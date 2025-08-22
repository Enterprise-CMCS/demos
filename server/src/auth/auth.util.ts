// src/auth/auth.util.ts
import jwt, { JwtHeader, VerifyOptions } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { APIGatewayProxyEventHeaders } from "aws-lambda";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { getAuthConfig } from "./auth.config.js";
import { prisma } from "../prismaClient.js";


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

const jwks = jwksClient({
  jwksUri: config.jwksUri,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header: JwtHeader, cb: (err: Error | null, key?: string) => void) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return cb(err || new Error("Signing key not found"));
    cb(null, key.getPublicKey());
  });
}

function decodeToken(token: string): Promise<DecodedJWT> {
  return new Promise((resolve, reject) => {
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
}

const checkAuthBypass = (): DecodedJWT | undefined => {
  if (process.env.BYPASS_AUTH === "true") {
    return { sub: "1234abcd-0000-1111-2222-333333333333", email: "bypassedUser@email.com" };
  }
};

/* -----------------------  CENTRALIZED HELPERS  ----------------------- */
type Claims = { sub: string; email?: string };

function deriveUserFields({ sub, email }: Claims) {
  const username = email?.includes("@") ? email.split("@")[0] : sub;
  const displayName = username;
  const emailForCreate = email ?? `${sub}@no-email.local`;
  const fullName = email ?? username;
  return { username, displayName, emailForCreate, fullName };
}

/** Upsert user and return the DB row */
async function ensureUserFromClaims(claims: Claims) {
  const { sub, email } = claims;
  const { username, displayName, emailForCreate, fullName } = deriveUserFields(claims);

  return prisma().user.upsert({
    where: { cognitoSubject: sub },
    update: { ...(email ? { email } : {}) },
    create: {
      cognitoSubject: sub,
      username,
      email: emailForCreate,
      fullName,
      displayName,
    },
  });
}

/** Get roles by Cognito sub (already handles BYPASS_AUTH internally) */
export async function getUserRoles(cognitoSubject: string): Promise<string[] | null> {
  if (process.env.BYPASS_AUTH === "true") return ["ADMIN"];
  const user = await prisma().user.findUnique({
    where: { cognitoSubject },
    include: { userRoles: { include: { role: true } } },
  });
  return user?.userRoles.map(ur => ur.role.name) || null;
}

/** Build GraphQLContext from verified claims, creating user/roles as needed */
async function buildContextFromClaims(claims: Claims): Promise<GraphQLContext> {
  const dbUser = await ensureUserFromClaims(claims);
  const roles = await getUserRoles(claims.sub);
  return {
    user: { id: dbUser.id, sub: claims.sub, roles, displayName: dbUser.displayName },
  };
}

/* -----------------------  Lambda Context  ----------------------- */
// I'll nuke this once i debug dev
// function getHeaderCI(
//   headers: APIGatewayProxyEventHeaders,
//   name: string
// ): string | undefined {
//   // Fast path
//   const direct = headers[name];
//   if (typeof direct === "string") return direct;

//   const target = name.toLowerCase();
//   for (const key in headers) {
//     if (key.toLowerCase() === target) {
//       const val = headers[key];
//       return typeof val === "string" ? val : undefined;
//     }
//   }
//   return undefined;
// }

// auth.util.ts
export async function buildLambdaContext(headers: APIGatewayProxyEventHeaders): Promise<GraphQLContext> {
  // 1) Prefer claims provided by the API Gateway custom authorizer
  const rawInjected = headers["x-authorizer-claims"] || headers["X-Authorizer-Claims"];
  if (rawInjected) {
    try {
      const parsed = JSON.parse(rawInjected as string) as { sub?: unknown; email?: unknown };
      const sub = typeof parsed.sub === "string" ? parsed.sub : undefined;
      const email = typeof parsed.email === "string" ? parsed.email : undefined;

      if (sub) {
        console.log("[auth] using claims from authorizer");
        return buildContextFromClaims({ sub, email });
      } else {
        console.warn("[auth] x-authorizer-claims present but no valid 'sub'");
      }
    } catch (e) {
      console.warn("[auth] failed to parse x-authorizer-claims:", e);
    }
  }

  // 2) BYPASS (local/dev)
  const bypass = checkAuthBypass();
  if (bypass) return buildContextFromClaims(bypass);

  // 3) Fallback to verifying the bearer token ourselves
  const rawAuth =
    headers.authorization ||
    (headers as Record<string, string | undefined>).Authorization ||
    "";

  if (!rawAuth.startsWith("Bearer ")) return { user: null };

  try {
    const { sub, email } = await decodeToken(rawAuth.slice(7));
    return buildContextFromClaims({ sub, email });
  } catch (err) {
    console.error("[auth] lambda context error:", err);
    return { user: null };
  }
}

/* -----------------------  HTTP Context  ----------------------- */
export async function buildHttpContext(req: IncomingMessage): Promise<GraphQLContext> {
  const bypass = checkAuthBypass();
  if (bypass) return buildContextFromClaims(bypass);

  const rawAuth =
    req.headers.authorization ||
    // some environments set capitalized header
    (req.headers as Record<string, string | undefined>)["Authorization"] ||
    "";

  if (!rawAuth.startsWith("Bearer ")) return { user: null };

  try {
    const { sub, email } = await decodeToken(rawAuth.slice(7));
    return buildContextFromClaims({ sub, email });
  } catch (err) {
    console.error("[auth] context error:", err);
    return { user: null };
  }
}

export function assertContextUserExists(
  context: GraphQLContext
): asserts context is GraphQLContext & { user: NonNullable<GraphQLContext["user"]> } {
  if (!context.user) {
    throw new GraphQLError("User not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
  }
}

export const getCurrentUserRoleId = async (context: GraphQLContext): Promise<string> => {
  assertContextUserExists(context);
  const userWithRoles = await prisma().user.findUnique({
    where: { id: context.user.id },
    include: { userRoles: { include: { role: true } } },
  });
  if (!userWithRoles || userWithRoles.userRoles.length === 0) {
    throw new GraphQLError("User has no assigned roles", { extensions: { code: "FORBIDDEN" } });
  }
  return userWithRoles.userRoles[0].role.id;
};

export const getCurrentUserId = async (context: GraphQLContext): Promise<string> => {
  assertContextUserExists(context);
  return context.user.id;
};

/* SecretsManager helpers */
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });
let databaseUrlCache = "";
let cacheExpiration = 0;

export async function getDatabaseUrl(): Promise<string> {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) return databaseUrlCache;

  const secretArn = process.env.DATABASE_SECRET_ARN;
  const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));

  if (!response.SecretString) throw new Error("The SecretString value is undefined!");
  const s = JSON.parse(response.SecretString);
  databaseUrlCache = `postgresql://${s.username}:${s.password}@${s.host}:${s.port}/${s.dbname}?schema=demos_app`;
  cacheExpiration = now + 60 * 60 * 1000;
  return databaseUrlCache;
}
