import jwt, { Algorithm, JwtHeader, VerifyOptions } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { APIGatewayProxyEventHeaders } from "aws-lambda";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { getAuthConfig } from "./auth.config.js";
import { prisma } from "../prismaClient.js";
import { PERSON_TYPES } from "../constants.ts";

const config = getAuthConfig();

const ALGORITHMS: Algorithm[] = ["RS256"];
const CACHE_MAX_AGE = 60 * 60 * 1000; // 10 minutes
const CACHE_MAX_ENTRIES = 10;

export interface GraphQLContext {
  user: null | {
    id: string;
    sub: string;
    role: string;
  };
}

type DecodedJWT = {
  sub: string;
  email?: string;
  token_use?: "id" | "access";
  role: string;
};

const verifyOpts: VerifyOptions = {
  audience: config.audience,
  issuer: config.issuer,
  algorithms: ALGORITHMS,
};

const jwks = jwksClient({
  jwksUri: config.jwksUri,
  cache: true,
  cacheMaxEntries: CACHE_MAX_ENTRIES,
  cacheMaxAge: CACHE_MAX_AGE,
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

      const rawDecoded = decoded as {
        sub: string;
        email: string;
        token_use?: "id" | "access";
        "custom:roles": string;
      };

      resolve({
        ...rawDecoded,
        role: rawDecoded["custom:roles"],
      });
    });
  });
}

/* -----------------------  HELPERS  ----------------------- */
type Claims = {
  sub: string;
  email?: string;
  role: string;
};

type HeaderGetter = (name: string) => string | undefined;

function createHeaderGetter(obj: Record<string, unknown> | undefined | null): HeaderGetter {
  const lowerMap = new Map<string, string | undefined>();
  if (obj) {
    for (const k of Object.keys(obj)) {
      const v = (obj as Record<string, string | undefined>)[k];
      lowerMap.set(k.toLowerCase(), v);
    }
  }
  return (name: string) => lowerMap.get(name.toLowerCase());
}

function parseCookie(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const entries = header.split("; ").map((c) => {
    const idx = c.indexOf("=");
    return idx === -1 ? [c, ""] : [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
  });
  return Object.fromEntries(entries);
}

function extractToken(getHeader: HeaderGetter): string {
  const rawAuth = getHeader("authorization") || "";
  let token = "";
  if (rawAuth.startsWith("Bearer ")) {
    token = rawAuth.slice(7);
  } else {
    const cookieHeader = getHeader("cookie");
    const cookieMap = parseCookie(cookieHeader);
    token = cookieMap["id_token"] || cookieMap["access_token"] || cookieMap["authorization"] || "";
    if (token.startsWith("Bearer ")) token = token.slice(7);
  }
  return token;
}

function deriveUserFields({ sub, email }: Claims) {
  const username = email?.includes("@") ? email.split("@")[0] : sub;
  const displayName = username;
  const emailForCreate = email ?? `${sub}@no-email.local`;
  const fullName = email ?? username;
  return { username, displayName, emailForCreate, fullName };
}

/** Upsert user and return the DB row */
async function ensureUserFromClaims(claims: Claims) {
  const { sub, role } = claims;
  const { username, displayName, emailForCreate, fullName } = deriveUserFields(claims);

  // Add await and handle the result properly
  const existingUser = await prisma().user.findUnique({
    where: { cognitoSubject: sub },
  });

  if (existingUser) {
    return existingUser;
  }

  const person = await prisma().person.create({
    data: {
      personTypeId: role,
      email: emailForCreate,
      fullName,
      displayName,
    },
  });

  return await prisma().user.create({
    data: {
      id: person.id,
      personTypeId: person.personTypeId,
      cognitoSubject: sub,
      username,
    },
  });
}

/** Build GraphQLContext from verified claims, creating user/roles as needed */
async function buildContextFromClaims(claims: Claims): Promise<GraphQLContext> {
  const user = await ensureUserFromClaims(claims);
  return {
    user: { id: user.id, sub: claims.sub, role: user.personTypeId },
  };
}

/* -----------------------  Lambda Context  ----------------------- */
export async function buildLambdaContext(
  headers: APIGatewayProxyEventHeaders
): Promise<GraphQLContext> {
  // 1) Prefer claims passed from the Lambda entrypoint (authorizer output)
  const rawClaims = headers["x-authorizer-claims"] ?? headers["X-Authorizer-Claims"];
  if (rawClaims) {
    try {
      const { sub, email, role } = JSON.parse(rawClaims as string) as {
        sub: string;
        email?: string;
        role: string;
      };
      return buildContextFromClaims({ sub, email, role });
    } catch {
      // fall through to JWT verify
    }
  }

  // 2) Fallback: verify the Bearer token yourself
  const token = extractToken(createHeaderGetter(headers as unknown as Record<string, unknown>));
  if (!token) return { user: null };

  try {
    const { sub, email, role } = await decodeToken(token);
    return buildContextFromClaims({ sub, email, role });
  } catch (err) {
    console.error("[auth] lambda context error:", err);
    return { user: null };
  }
}

/* -----------------------  HTTP Context  ----------------------- */
export async function buildHttpContext(req: IncomingMessage): Promise<GraphQLContext> {
  const token = extractToken(createHeaderGetter(req.headers as Record<string, unknown>));
  if (!token) return { user: null };

  try {
    const decodedToken = await decodeToken(token);
    const { sub, email, role } = decodedToken;
    return buildContextFromClaims({ sub, email, role });
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
  const user = await prisma().user.findUnique({
    where: { id: context.user.id },
  });
  if (!user) {
    throw new GraphQLError("User not found", { extensions: { code: "UNAUTHENTICATED" } });
  }
  return user.personTypeId;
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
  cacheExpiration = now + CACHE_MAX_AGE;
  return databaseUrlCache;
}
