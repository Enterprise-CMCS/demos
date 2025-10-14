import jwt, { Algorithm, JwtHeader, VerifyOptions } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { APIGatewayProxyEventHeaders } from "aws-lambda";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { getAuthConfig } from "./auth.config.js";
import { asRecord } from "./claim-utils";
import { prisma } from "../prismaClient.js";
import { pickString } from "./claim-utils";
import { PERSON_TYPES } from "../constants";
import { log } from "../logger.js";

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
  givenName?: string;
  familyName?: string;
  name?: string;
  externalUserId?: string;
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

type Claims = {
  sub: string;
  email?: string;
  role: string;
  givenName?: string;
  familyName?: string;
  name?: string;
  externalUserId?: string;
};

function getKey(header: JwtHeader, cb: (err: Error | null, key?: string) => void) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return cb(err || new Error("Signing key not found"));
    cb(null, key.getPublicKey());
  });
}

// Check if role is demos-admin, demos-cms-user, or demos-state-user
function verifyRole(role: string): void {
  const validRoles = (PERSON_TYPES as readonly string[]).filter(r => r !== "non-user-contact");
  if (!validRoles.includes(role)) {
    throw new GraphQLError(`Invalid user role: '${role}'`, {
      extensions: {
        code: "UNAUTHORIZED",
        http: { status: 403 },
      },
    });
  }
}

// Extract external userId from Cognito identities claim when available
export function extractExternalUserIdFromIdentities(
  identities: unknown,
  rawAll?: Record<string, unknown>
): string | undefined {
  let items: unknown[] = [];

  try {
    if (typeof identities === "string") {
      const parsed = JSON.parse(identities);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } else if (identities && typeof identities === "object") {
      items = Array.isArray(identities) ? identities : [identities];
    }
  } catch {
    // bad JSON? fall through to cognito:username
  }

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const candidate =
      (typeof record.userId === "string" && record.userId) ||
      (typeof record.user_id === "string" && record.user_id) ||
      (typeof record.username === "string" && record.username) ||
      (typeof record.nameId === "string" && record.nameId) || // some SAMLs
      (typeof record.sub === "string" && record.sub);         // fallback-ish
    if (candidate) return candidate.trim();
  }
  const fallback =
    rawAll && typeof rawAll["cognito:username"] === "string"
      ? (rawAll["cognito:username"] as string).trim()
      : undefined;
  return fallback && fallback.length ? fallback : undefined;
}

// Normalize raw Cognito payload (token or authorizer-claims) into our Claims shape and verify role
export function normalizeClaimsFromRaw(raw: Record<string, unknown>): Claims {
  // role from custom or flat authorizer
  const role = pickString(raw, ["custom:roles", "role"]);
  if (!role) {
    throw new GraphQLError("Missing role in token", { extensions: { code: "UNAUTHORIZED", http: { status: 403 } } });
  }
  verifyRole(role);

  // sub is required
  const sub = pickString(raw, ["sub"]);
  if (!sub) {
    throw new GraphQLError("Missing subject in token", {
      extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
    });
  }

  const email = pickString(raw, ["email"]);
  const givenName = pickString(raw, ["given_name", "givenName"]);
  const familyName = pickString(raw, ["family_name", "familyName"]);
  const name = pickString(raw, ["name"]);
  const externalUserId = extractExternalUserIdFromIdentities(raw["identities"], raw);

  return { sub, email, role, givenName, familyName, name, externalUserId };
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
      const rawDecoded = decoded as Record<string, unknown>;
      let claims: Claims;
      try {
        claims = normalizeClaimsFromRaw(rawDecoded);
      } catch (error) {
        log.error("auth.token.claims_error", { errorName: (error as Error).name, message: (error as Error).message });
        return reject(error);
      }

      resolve({
        sub: claims.sub,
        email: claims.email,
        token_use: (rawDecoded["token_use"] as DecodedJWT["token_use"]) ?? undefined,
        role: claims.role,
        givenName: claims.givenName,
        familyName: claims.familyName,
        name: claims.name,
        externalUserId: claims.externalUserId,
      });
    });
  });
}

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

function deriveUserFields(claims: Claims) {
  const backupUserName =
    claims.email && claims.email.includes("@") ? claims.email : undefined;
  const username = claims.externalUserId || backupUserName;

  if (!username) {
    throw new Error("username could not be set from claims");
  }

  const firstName = claims.givenName?.trim();
  const lastName  = claims.familyName?.trim();

  if (!firstName || !lastName || !claims.email) {
    throw new Error("Missing required name parts from claims; given_name family_name and email are required");
  }

  return { username, email: claims.email, firstName, lastName };
}


/** Upsert user and return the DB row */
async function ensureUserFromClaims(claims: Claims) {
  const { sub, role } = claims;

  // Set up person on first login.
  const { username, email, firstName, lastName } = deriveUserFields(claims);

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
      email: email,
      firstName,
      lastName,
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
  const rawClaims = headers["x-authorizer-claims"] ?? headers["X-Authorizer-Claims"];
  if (rawClaims) {
    try {
      const parsed =
        typeof rawClaims === "string"
          ? (JSON.parse(rawClaims) as Record<string, unknown>)
          : (rawClaims as Record<string, unknown>); // ✅ accept object too
      const claims = normalizeClaimsFromRaw(parsed);
      return buildContextFromClaims(claims);
    } catch {
      console.warn("[auth] Attempt to parse x-authorizer-claims failed");
    }
  }

  // 2) Fallback: verify the Bearer token yourself
  const token = extractToken(createHeaderGetter(headers as unknown as Record<string, unknown>));
  if (!token) return { user: null };

  try {
    const { sub, email, role, givenName, familyName, name, externalUserId } = await decodeToken(token);
    return buildContextFromClaims({ sub, email, role, givenName, familyName, name, externalUserId });
  } catch (err) {
    log.error("auth.lambda_context.error", { errorName: (err as Error).name, message: (err as Error).message });
    return { user: null };
  }
}

/* -----------------------  HTTP Context  ----------------------- */
export async function buildHttpContext(req: IncomingMessage): Promise<GraphQLContext> {
  const token = extractToken(createHeaderGetter(req.headers as Record<string, unknown>));

  if (!token) return { user: null };
  try {
    const decodedToken = await decodeToken(token);
    const { sub, email, role, givenName, familyName, name, externalUserId } = decodedToken;
    return buildContextFromClaims({ sub, email, role, givenName, familyName, name, externalUserId });
  } catch (err) {
    log.error("auth.http_context.error", { errorName: (err as Error).name, message: (err as Error).message });
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
