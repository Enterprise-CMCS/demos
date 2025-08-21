import jwt, { JwtHeader, VerifyOptions } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { APIGatewayProxyEventHeaders } from "aws-lambda";
import { prisma } from "../prismaClient.js"; // <-- adjust path if needed
import { getAuthConfig } from "./auth.config.js";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const config = getAuthConfig();

export interface GraphQLContext {
  user: null | {
    id: string;
    sub: string;
    roles: string[] | null;
    displayName?: string;
  };
}

type DecodedJWT = {
  sub: string;
  email?: string;
  token_use?: "id" | "access";
};

const verifyOpts: VerifyOptions = {
  audience: config.audience,
  issuer: config.issuer,
  algorithms: ["RS256"],
};

// Reuse a single JWKS client (with cache)
const jwks = jwksClient({
  jwksUri: config.jwksUri,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000, // 10 mins
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header: JwtHeader, cb: (err: Error | null, key?: string) => void) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return cb(err || new Error("Signing key not found"));
    cb(null, key.getPublicKey());
  });
}

const decodeToken = (token: string): Promise<DecodedJWT> =>
  new Promise((resolve, reject) => {
    if (!token) {
      return reject(
        new GraphQLError("User is not authenticated", {
          extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
        })
      );
    }
    jwt.verify(token, getKey, verifyOpts, (err, decoded) => {
      if (err) {
        return reject(
          new GraphQLError("User is not authenticated", {
            extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
          })
        );
      }
      resolve(decoded as DecodedJWT);
    });
  });

const checkAuthBypass = (): DecodedJWT | undefined => {
  if (process.env.BYPASS_AUTH === "true") {
    return {
      sub: "1234abcd-0000-1111-2222-333333333333",
      email: "bypassedUser@email.com",
    };
  }
};

export async function buildLambdaContext(
  headers: APIGatewayProxyEventHeaders
): Promise<GraphQLContext> {
  const authHeader =
    headers.authorization || (headers as Record<string, string>).Authorization || "";

  // no bearer -> anonymous
  if (!authHeader?.startsWith("Bearer ")) return { user: null };

  try {
    const { sub, email } = await getCognitoUserInfoForLambda(headers);

    const username = email?.includes("@") ? email.split("@")[0] : sub;
    const displayName = username;
    const emailForCreate = email ?? `${sub}@no-email.local`;
    const fullName = email ?? username;

    // ⬇️ upsert by cognitoSubject
    const dbUser = await prisma().user.upsert({
      where: { cognitoSubject: sub },
      update: { ...(email ? { email } : {}) }, // keep email fresh if present
      create: {
        cognitoSubject: sub,
        username,
        email: emailForCreate,
        fullName,
        displayName,
      },
    });

    const roles = await getUserRoles(sub);

    // include both DB id and sub in context
    return {
      user: {
        id: dbUser.id,
        sub,
        roles,
        displayName: dbUser.displayName,
      },
    };
  } catch (err) {
    console.error("[auth] lambda context error:", err);
    return { user: null };
  }
}

/** Build context for Node/Express/standalone HTTP */
export async function buildHttpContext(req: IncomingMessage): Promise<GraphQLContext> {
  // BYPASS first (so it works even without Authorization header)
  const bypass = checkAuthBypass();
  if (bypass) {
    const { sub, email } = bypass;
    const username = email?.includes("@") ? email.split("@")[0] : sub;
    const dbUser = await prisma().user.upsert({
      where: { cognitoSubject: sub },
      update: { ...(email ? { email } : {}) },
      create: {
        cognitoSubject: sub,
        username,
        email: email ?? `${sub}@no-email.local`,
        fullName: email ?? username,
        displayName: username,
      },
    });
    const roles = await getUserRoles(sub);
    return { user: { id: dbUser.id, sub, roles, displayName: dbUser.displayName } };
  }

  const rawAuth =
    req.headers.authorization ??
    // some Node envs may populate capitalized version
    (req as IncomingMessage & { headers: Record<string, string> }).headers?.Authorization ??
    "";

  if (!rawAuth.startsWith("Bearer ")) return { user: null };

  try {
    const token = rawAuth.slice(7);
    const { sub, email } = await decodeToken(token);

    const username = email?.includes("@") ? email.split("@")[0] : sub;
    const dbUser = await prisma().user.upsert({
      where: { cognitoSubject: sub },
      update: { ...(email ? { email } : {}) },
      create: {
        cognitoSubject: sub,
        username,
        email: email ?? `${sub}@no-email.local`,
        fullName: email ?? username,
        displayName: username,
      },
    });

    const roles = await getUserRoles(sub);
    return { user: { id: dbUser.id, sub, roles, displayName: dbUser.displayName } };
  } catch (err) {
    console.error("[auth] context error:", err);
    return { user: null };
  }
}

/** Raw token helpers (HTTP & Lambda) */
export const getCognitoUserInfo = (req: IncomingMessage): Promise<DecodedJWT> => {
  const bypass = checkAuthBypass();
  if (bypass) return Promise.resolve(bypass);
  // Sometimes this can be cappped?
  const bearer =
    req.headers.authorization ??
    req.headers.Authorization ??
    "";
  const token = typeof bearer === "string" && bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  return decodeToken(token);
};

export const getCognitoUserInfoForLambda = (headers: APIGatewayProxyEventHeaders): Promise<DecodedJWT> => {
  const bypass = checkAuthBypass();
  if (bypass) return Promise.resolve(bypass);

  const bearer = (headers.authorization || (headers as any).Authorization || "") as string;
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  return decodeToken(token);
};

/** Roles by cognito subject */
export const getUserRoles = async (cognitoSubject: string): Promise<string[] | null> => {
  if (process.env.BYPASS_AUTH === "true") return ["ADMIN"];
  const user = await prisma().user.findUnique({
    include: { userRoles: { include: { role: true } } },
    where: { cognitoSubject },
  });
  return user?.userRoles.map((ur) => ur.role.name) || null;
};

/** Context assertions & helpers */
function assertContextUserExists(
  context: GraphQLContext
): asserts context is GraphQLContext & { user: NonNullable<GraphQLContext["user"]> } {
  if (!context.user) {
    throw new GraphQLError("User not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
  }
}

export const getCurrentUserRoleId = async (context: GraphQLContext): Promise<string> => {
  assertContextUserExists(context);
  const userWithRoles = await prisma().user.findUnique({
    where: { id: context.user.id }, // DB id
    include: { userRoles: { include: { role: true } } },
  });
  if (!userWithRoles || userWithRoles.userRoles.length === 0) {
    throw new GraphQLError("User has no assigned roles", { extensions: { code: "FORBIDDEN" } });
  }
  return userWithRoles.userRoles[0].role.id;
};

export const getCurrentUserId = async (context: GraphQLContext): Promise<string> => {
  assertContextUserExists(context);
  return context.user.id; // already DB id
};

/** Secrets Manager helper */
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });
let databaseUrlCache = "";
let cacheExpiration = 0;

export async function getDatabaseUrl(): Promise<string> {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) return databaseUrlCache;

  const secretArn = process.env.DATABASE_SECRET_ARN;
  const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (!response.SecretString) throw new Error("The SecretString value is undefined!");

  const secretData = JSON.parse(response.SecretString);
  databaseUrlCache = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${secretData.dbname}?schema=demos_app`;
  cacheExpiration = now + 60 * 60 * 1000; // 1 hour
  return databaseUrlCache;
}
