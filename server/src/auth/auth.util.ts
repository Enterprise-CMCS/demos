import jwt, { JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { PrismaClient, } from "@prisma/client";
import { getAuthConfig } from "./auth.config.js";
import { APIGatewayProxyEventHeaders } from "aws-lambda";
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from "@aws-sdk/client-secrets-manager";

const prisma = new PrismaClient();
const config = getAuthConfig();

export interface GraphQLContext {
  user: null | {
    id: string;
    name: string;
    roles: string[] | null;
  };
}

type DecodedJWT = {
  sub: string;
  email: string;
};

const decodeToken = (token: string): Promise<DecodedJWT> => {
  console.log(token, 'token');
  const client = jwksClient({
    jwksUri: config.jwksUri,
  });

  function getKey(
    header: JwtHeader,
    callback: (err: Error | null, signingKey?: string) => void,
  ): void {
    client.getSigningKey(header.kid, (err, key) => {
      if (err || !key)
        return callback(err || new Error("Signing key not found"));
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: config.audience,
        issuer: config.issuer,
      },
      (err, decoded) => {
        console.log("------------------------------------------------------------");
        console.log("err:", err);
        // console.log("Decoded JWT:", decoded);
        if (err) {
          return reject(
            new GraphQLError("User is not authenticated", {
              extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
            }),
          );
        }
        resolve(decoded as DecodedJWT);
      },
    );
  });
}

const checkAuthBypass = (): DecodedJWT | undefined => {
  // Bypass authentication for testing purposes
  if (process.env.BYPASS_AUTH === "true") {
    return {
      sub: "14f83478-c0f1-70f7-2c30-ca664b9177e9",
      email: "dustin.h@globalalliantinc.com"
    };
  }
}

export const getCognitoUserInfo = (
  req: IncomingMessage,
): Promise<DecodedJWT> => {

  const bypassResult = checkAuthBypass();
  if (bypassResult) {
    return Promise.resolve(bypassResult);
  }

  const token: string = req.headers.authorization?.split(" ")[1] || "";
  return decodeToken(token);

};

export const getCognitoUserInfoForLambda = (
  headers: APIGatewayProxyEventHeaders,
): Promise<DecodedJWT> => {

  const bypassResult = checkAuthBypass();
  if (bypassResult) {
    return Promise.resolve(bypassResult);
  }

  const token: string = headers.authorization?.split(" ")[1] || "";
  console.log("Lambda token:", token);
  // createUserIfNotExists()
  return decodeToken(token);
};

// const createUserIfNotExists = async (sub: string, email: string, given_name?: string, family_name?: string): Promise<void> => {
//   const user = await prisma.user.findUnique({ where: { cognitoSubject: sub } });
//   if (!user) {
//     await prisma.user.create({
//       data: {
//         cognitoSubject: sub,
//         email,
//         fullName: `${given_name ?? ""} ${family_name ?? ""}`.trim(),
//         username: email, // or another field if available
//         displayName: given_name ?? email,
//       },
//     });
//   }
// };

/**
 * Fetches a user's role from the DB using their Cognito sub.
 */
export const getUserRoles = async (
  cognitoSubject: string,
): Promise<string[] | null> => {

  if (process.env.BYPASS_AUTH === "true") {
    return ["ADMIN"];
  }

  const user = await prisma.user.findUnique({
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    where: { cognitoSubject },
  });
  return user?.userRoles.map(userRole => userRole.role.name) || null;
};

function assertContextUserExists(context: GraphQLContext)
: asserts context is GraphQLContext & { user: NonNullable<GraphQLContext['user']> } {
  if (!context.user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
};

/**
 * Gets the current user's primary role ID from the GraphQL context.
 * This is useful for associating actions with the role the user was acting under.
 */
export const getCurrentUserRoleId = async (context: GraphQLContext): Promise<string> => {
  assertContextUserExists(context);

  // Find the user with their roles to get the role ID
  const userWithRoles = await prisma.user.findUnique({
    where: { cognitoSubject: context.user.id },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!userWithRoles || userWithRoles.userRoles.length === 0) {
    throw new GraphQLError("User has no assigned roles", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return userWithRoles.userRoles[0].role.id;
};

/**
 * Gets the current user's database ID from the GraphQL context.
 */
export const getCurrentUserId = async (context: GraphQLContext): Promise<string> => {
  assertContextUserExists(context);

  // Find the user by their Cognito subject to get the database ID
  const user = await prisma.user.findUnique({
    where: { cognitoSubject: context.user.id },
    select: { id: true }
  });

  if (!user) {
    throw new GraphQLError("User not found in database", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return user.id;
};

/**
 * Obtaining (with caching) secrets from SecretsManager.
 */
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });
let databaseUrlCache = "";
let cacheExpiration = 0;

export async function getDatabaseUrl(): Promise<string> {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) {
    return databaseUrlCache;
  }

  const secretArn = process.env.DATABASE_SECRET_ARN;
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsManager.send(command);

  if (!response.SecretString) {
    throw new Error("The SecretString value is undefined!")
  }
  const secretData = JSON.parse(response.SecretString);
  databaseUrlCache = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${secretData.dbname}?schema=demos_app`;
  cacheExpiration = now + 60 * 60 * 1000; // Cache for 1 hour

  return databaseUrlCache;
}
