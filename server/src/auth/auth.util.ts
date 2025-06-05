import jwt, { JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { GraphQLResolveInfo, GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { PrismaClient, } from "@prisma/client";
import { getAuthConfig } from "./auth.config.js";

const prisma = new PrismaClient();
const config = getAuthConfig();

export interface GraphQLContext {
  user: null | {
    id: string;
    name: string;
    roles: string[] | null;
  };
}

type ResolverFn<
  Parent = unknown,
  Args = Record<string, unknown>,
  Context = GraphQLContext,
  Result = unknown,
> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<Result> | Result;

type DecodedJWT = {
  sub: string;
  email: string;
};

/**
 * Verifies the Cognito JWT and extracts user info.
 */
export const getCognitoUserInfo = (
  req: IncomingMessage,
): Promise<DecodedJWT> => {

  // Bypass authentication for testing purposes
  if (process.env.BYPASS_AUTH === "true") {
    return Promise.resolve({
      sub: "bypassed-user",
      email: "bypassedUser@email.com"
    });
  }

  const token: string = req.headers.authorization?.split(" ")[1] || "";
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
};

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

/**
 * Resolver middleware to enforce role-based access control.
 */
export const requireRole = (requiredRoles: string[] = []) => {
  return <
    Parent,
    Args extends Record<string, unknown>,
    Context extends GraphQLContext,
    Result,
  >(
    resolver: ResolverFn<Parent, Args, Context, Result>,
  ): ResolverFn<Parent, Args, Context, Result> => {
  return async (parent, args, context, info) => {
      const user = context.user;
      console.log('user', user)
      if (!user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const userRoles = user.roles ?? [];
      console.log('userRoles', userRoles)
      const hasRequiredRole = userRoles.some((userRole) =>
        requiredRoles.includes(userRole),
      );

      if (!hasRequiredRole) {
        throw new GraphQLError("Not authorized", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      return resolver(parent, args, context, info);
    };
  };
};
