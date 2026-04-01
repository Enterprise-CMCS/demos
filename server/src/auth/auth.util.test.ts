import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  verifyMock,
  jwksClientMock,
  getSigningKeyMock,
  prismaFactoryMock,
  userFindUniqueMock,
  userCreateMock,
  personCreateMock,
  secretSendMock,
  secretsManagerCtorMock,
  getSecretValueCommandCtorMock,
  logWarnMock,
  logErrorMock,
  logDebugMock,
} = vi.hoisted(() => {
  const verify = vi.fn();
  const getSigningKey = vi.fn();
  const jwksClient = vi.fn(() => ({ getSigningKey }));

  const userFindUnique = vi.fn();
  const userCreate = vi.fn();
  const personCreate = vi.fn();
  const prismaFactory = vi.fn(() => ({
    user: { findUnique: userFindUnique, create: userCreate },
    person: { create: personCreate },
  }));

  const secretSend = vi.fn();
  const secretsManagerCtor = vi.fn(function MockSecretsManagerClient(this: any) {
    this.send = secretSend;
  });
  const getSecretValueCommandCtor = vi.fn(function MockGetSecretValueCommand(this: any, input: unknown) {
    this.input = input;
  });

  return {
    verifyMock: verify,
    jwksClientMock: jwksClient,
    getSigningKeyMock: getSigningKey,
    prismaFactoryMock: prismaFactory,
    userFindUniqueMock: userFindUnique,
    userCreateMock: userCreate,
    personCreateMock: personCreate,
    secretSendMock: secretSend,
    secretsManagerCtorMock: secretsManagerCtor,
    getSecretValueCommandCtorMock: getSecretValueCommandCtor,
    logWarnMock: vi.fn(),
    logErrorMock: vi.fn(),
    logDebugMock: vi.fn(),
  };
});

vi.mock("jsonwebtoken", () => ({
  default: { verify: verifyMock },
  verify: verifyMock,
}));

vi.mock("jwks-rsa", () => ({
  default: jwksClientMock,
}));

vi.mock("./auth.config.js", () => ({
  getAuthConfig: () => ({
    audience: "test-aud",
    issuer: "https://issuer.example",
    jwksUri: "https://issuer.example/.well-known/jwks.json",
  }),
}));

vi.mock("../prismaClient.js", () => ({
  prisma: prismaFactoryMock,
}));

vi.mock("../log.js", () => ({
  log: {
    warn: logWarnMock,
    error: logErrorMock,
    debug: logDebugMock,
  },
}));

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: secretsManagerCtorMock,
  GetSecretValueCommand: getSecretValueCommandCtorMock,
}));

const originalSecretArn = process.env.DATABASE_SECRET_ARN;

const existingUser = {
  id: "user-1",
  personTypeId: "demos-cms-user",
  cognitoSubject: "sub-1",
  username: "user@example.com",
};

function setVerifySuccess(decoded: Record<string, unknown>) {
  verifyMock.mockImplementation(
    (
      _token: string,
      keyGetter: (header: { kid?: string }, cb: (err: Error | null, key?: string) => void) => void,
      _opts: unknown,
      done: (err: Error | null, decoded?: unknown) => void
    ) => {
      keyGetter({ kid: "kid-1" }, (err) => {
        if (err) {
          done(err);
          return;
        }
        done(null, decoded);
      });
    }
  );
}

function setVerifyFailure(message = "bad token") {
  verifyMock.mockImplementation(
    (
      _token: string,
      _keyGetter: unknown,
      _opts: unknown,
      done: (err: Error) => void
    ) => {
      done(new Error(message));
    }
  );
}

async function importAuthUtil() {
  vi.resetModules();
  return import("./auth.util.ts");
}

beforeEach(() => {
  getSigningKeyMock.mockReset();
  verifyMock.mockReset();
  jwksClientMock.mockClear();
  prismaFactoryMock.mockClear();
  userFindUniqueMock.mockReset();
  userCreateMock.mockReset();
  personCreateMock.mockReset();
  secretSendMock.mockReset();
  secretsManagerCtorMock.mockClear();
  getSecretValueCommandCtorMock.mockClear();
  logWarnMock.mockClear();
  logErrorMock.mockClear();
  logDebugMock.mockClear();

  process.env.DATABASE_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:111122223333:secret:test"; // pragma: allowlist secret

  getSigningKeyMock.mockImplementation(
    (_kid: string | undefined, cb: (err: Error | null, key?: { getPublicKey: () => string }) => void) => {
      cb(null, { getPublicKey: () => "public-key" });
    }
  );

  setVerifySuccess({
    sub: "sub-1",
    email: "user@example.com",
    role: "demos-cms-user",
    given_name: "Leia",
    family_name: "Organa",
    token_use: "id",
  });

  userFindUniqueMock.mockResolvedValue(existingUser);
  userCreateMock.mockResolvedValue(existingUser);
  personCreateMock.mockResolvedValue({
    id: "person-1",
    personTypeId: "demos-cms-user",
    email: "user@example.com",
    firstName: "Leia",
    lastName: "Organa",
  });

  secretSendMock.mockResolvedValue({
    SecretString: JSON.stringify({
      username: "demo@user",
      password: "p@ss:word", // pragma: allowlist secret
      host: "db.example.com",
      port: "5432",
      dbname: "demos/main",
    }),
  });
});

afterEach(() => {
  if (originalSecretArn === undefined) {
    delete process.env.DATABASE_SECRET_ARN;
  } else {
    process.env.DATABASE_SECRET_ARN = originalSecretArn;
  }
});

describe("extractExternalUserIdFromIdentities", () => {
  it("returns userId from JSON-string identities", async () => {
    const mod = await importAuthUtil();

    const result = mod.extractExternalUserIdFromIdentities(
      JSON.stringify([{ provider: "SAML" }, { userId: " ABCD " }]),
      {}
    );

    expect(result).toBe("ABCD");
  });

  it("falls back to cognito username when identities do not include userId", async () => {
    const mod = await importAuthUtil();

    const result = mod.extractExternalUserIdFromIdentities(
      [{ provider: "SAML" }],
      { "cognito:username": "  fallback-user  " }
    );

    expect(result).toBe("fallback-user");
  });

  it("returns undefined when identities and fallback are unavailable", async () => {
    const mod = await importAuthUtil();
    expect(mod.extractExternalUserIdFromIdentities(undefined)).toBeUndefined();
  });
});

describe("normalizeClaimsFromRaw", () => {
  it("normalizes role and name fields", async () => {
    const mod = await importAuthUtil();

    const claims = mod.normalizeClaimsFromRaw({
      "custom:roles": "demos-state-user",
      sub: "sub-2",
      email: "state@example.com",
      given_name: "Jane",
      family_name: "Doe",
      identities: JSON.stringify([{ userId: "federated-123" }]),
    });

    expect(claims).toEqual({
      sub: "sub-2",
      email: "state@example.com",
      role: "demos-state-user",
      givenName: "Jane",
      familyName: "Doe",
      name: undefined,
      externalUserId: "federated-123",
    });
  });

  it("throws when role is missing", async () => {
    const mod = await importAuthUtil();
    expect(() => mod.normalizeClaimsFromRaw({ sub: "sub-3" })).toThrow("Missing role in token");
  });

  it("throws when role is invalid", async () => {
    const mod = await importAuthUtil();
    expect(() => mod.normalizeClaimsFromRaw({ sub: "sub-3", role: "invalid-role" })).toThrow(
      "Invalid user role: 'invalid-role'"
    );
  });

  it("throws when sub is missing", async () => {
    const mod = await importAuthUtil();
    expect(() => mod.normalizeClaimsFromRaw({ role: "demos-admin" })).toThrow("Missing subject in token");
  });
});

describe("buildLambdaContext", () => {
  it("uses x-authorizer-claims fast path and returns existing user", async () => {
    const mod = await importAuthUtil();
    const claimsHeader = JSON.stringify({
      role: "demos-cms-user",
      sub: "sub-1",
      email: "user@example.com",
      given_name: "Leia",
      family_name: "Organa",
    });

    const ctx = await mod.buildLambdaContext({
      "x-authorizer-claims": claimsHeader,
    });

    expect(ctx.user).toEqual({ id: "user-1", sub: "sub-1", role: "demos-cms-user" });
    expect(userFindUniqueMock).toHaveBeenCalledWith({ where: { cognitoSubject: "sub-1" } });
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("falls back to token flow if claims header cannot be parsed", async () => {
    const mod = await importAuthUtil();
    const ctx = await mod.buildLambdaContext({
      "x-authorizer-claims": "not-json",
      authorization: "Bearer token-123",
    });

    expect(logWarnMock).toHaveBeenCalledWith("[auth] Attempt to parse x-authorizer-claims failed");
    expect(getSigningKeyMock).toHaveBeenCalledWith("kid-1", expect.any(Function));
    expect(ctx.user).toEqual({ id: "user-1", sub: "sub-1", role: "demos-cms-user" });
  });

  it("creates person and user when subject does not exist", async () => {
    userFindUniqueMock.mockResolvedValueOnce(null);
    personCreateMock.mockResolvedValueOnce({
      id: "person-new",
      personTypeId: "demos-state-user",
      email: "new@example.com",
      firstName: "New",
      lastName: "User",
    });
    userCreateMock.mockResolvedValueOnce({
      id: "new-user-1",
      personTypeId: "demos-state-user",
      cognitoSubject: "sub-new",
      username: "federated-xyz",
    });

    setVerifySuccess({
      sub: "sub-new",
      role: "demos-state-user",
      email: "new@example.com",
      given_name: "New",
      family_name: "User",
      identities: JSON.stringify([{ userId: "federated-xyz" }]),
    });

    const mod = await importAuthUtil();
    const ctx = await mod.buildLambdaContext({ authorization: "Bearer create-user-token" });

    expect(personCreateMock).toHaveBeenCalledWith({
      data: {
        personTypeId: "demos-state-user",
        email: "new@example.com",
        firstName: "New",
        lastName: "User",
      },
    });
    expect(userCreateMock).toHaveBeenCalledWith({
      data: {
        id: "person-new",
        personTypeId: "demos-state-user",
        cognitoSubject: "sub-new",
        username: "federated-xyz",
      },
    });
    expect(ctx.user).toEqual({ id: "new-user-1", sub: "sub-new", role: "demos-state-user" });
  });

  it("returns null user when no token is present", async () => {
    const mod = await importAuthUtil();
    const ctx = await mod.buildLambdaContext({});
    expect(ctx).toEqual({ user: null });
  });

  it("returns null user and logs when token decode fails", async () => {
    setVerifyFailure("jwt rejected");
    const mod = await importAuthUtil();
    const ctx = await mod.buildLambdaContext({ authorization: "Bearer bad-token" });

    expect(ctx).toEqual({ user: null });
    expect(logErrorMock).toHaveBeenCalledWith(
      { errorName: "GraphQLError", message: "User is not authenticated", type: "auth.lambda_context.error" }
    );
  });

  it("returns null user when claims do not contain required fields", async () => {
    setVerifySuccess({
      sub: "sub-1",
      role: "demos-cms-user",
      email: "user@example.com",
      // missing given/family name triggers deriveUserFields error
    });

    userFindUniqueMock.mockResolvedValueOnce(null);
    const mod = await importAuthUtil();
    const ctx = await mod.buildLambdaContext({ authorization: "Bearer missing-name-token" });

    expect(ctx).toEqual({ user: null });
    expect(logErrorMock).toHaveBeenCalledWith(
      {
        errorName: "Error",
        message: "Missing required name parts from claims; given_name family_name and email are required",
        type: "auth.lambda_context.error",
      }
    );
  });
});

describe("buildHttpContext", () => {
  it("reads token from cookie access_token", async () => {
    const mod = await importAuthUtil();
    const req = {
      headers: { cookie: "access_token=Bearer%20cookie-token" },
    } as any;

    const ctx = await mod.buildHttpContext(req);
    expect(ctx.user).toEqual({ id: "user-1", sub: "sub-1", role: "demos-cms-user" });
  });

  it("returns null user when no auth header or cookie exists", async () => {
    const mod = await importAuthUtil();
    const ctx = await mod.buildHttpContext({ headers: {} } as any);
    expect(ctx).toEqual({ user: null });
  });

  it("returns null user and logs on verification failure", async () => {
    setVerifyFailure("jwt failed");
    const mod = await importAuthUtil();
    const ctx = await mod.buildHttpContext({ headers: { authorization: "Bearer bad" } } as any);

    expect(ctx).toEqual({ user: null });
    expect(logErrorMock).toHaveBeenCalledWith(
      { errorName: "GraphQLError", message: "User is not authenticated", type: "auth.http_context.error" }
    );
  });

  it("logs token-claims parsing errors and returns null user", async () => {
    setVerifySuccess({
      sub: "sub-claims-error",
      // missing role triggers normalizeClaimsFromRaw failure inside decodeToken
      email: "claims@example.com",
      given_name: "Bad",
      family_name: "Token",
    });

    const mod = await importAuthUtil();
    const ctx = await mod.buildHttpContext({ headers: { authorization: "Bearer claims-error" } } as any);

    expect(ctx).toEqual({ user: null });
    expect(logErrorMock).toHaveBeenCalledWith(
      { errorName: "GraphQLError", message: "Missing role in token", type: "auth.token.claims_error" }
    );
    expect(logErrorMock).toHaveBeenCalledWith(
      { errorName: "GraphQLError", message: "Missing role in token", type: "auth.http_context.error" }
    );
  });
});

describe("context assertions and current user helpers", () => {
  it("throws when context user does not exist", async () => {
    const mod = await importAuthUtil();
    expect(() => mod.assertContextUserExists({ user: null })).toThrow("User not authenticated");
  });

  it("returns current user role id", async () => {
    const mod = await importAuthUtil();
    userFindUniqueMock.mockResolvedValueOnce({
      id: "user-1",
      personTypeId: "demos-admin",
    });

    const role = await mod.getCurrentUserRoleId({
      user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
    });

    expect(role).toBe("demos-admin");
  });

  it("throws when current user no longer exists in database", async () => {
    const mod = await importAuthUtil();
    userFindUniqueMock.mockResolvedValueOnce(null);

    await expect(
      mod.getCurrentUserRoleId({
        user: { id: "missing", sub: "sub-1", role: "demos-admin" },
      })
    ).rejects.toThrow("User not found");
  });

  it("returns current user id", async () => {
    const mod = await importAuthUtil();
    const userId = await mod.getCurrentUserId({
      user: { id: "u-123", sub: "sub-123", role: "demos-admin" },
    });
    expect(userId).toBe("u-123");
  });
});

describe("getDatabaseUrl", () => {
  it("builds encoded connection URL and caches result", async () => {
    const mod = await importAuthUtil();

    const first = await mod.getDatabaseUrl();
    const second = await mod.getDatabaseUrl();

    expect(first).toBe(
      "postgresql://demo%40user:p%40ss%3Aword@db.example.com:5432/demos%2Fmain?schema=demos_app" // pragma: allowlist secret
    );
    expect(second).toBe(first);
    expect(secretSendMock).toHaveBeenCalledTimes(1);
    expect(getSecretValueCommandCtorMock).toHaveBeenCalledWith({
      SecretId: process.env.DATABASE_SECRET_ARN,
    });
    expect(logDebugMock).toHaveBeenCalledWith({ type: "graphql.db.creds_request" });
  });

  it("throws if SecretString is missing", async () => {
    secretSendMock.mockResolvedValueOnce({ SecretString: undefined });
    const mod = await importAuthUtil();

    await expect(mod.getDatabaseUrl()).rejects.toThrow("The SecretString value is undefined!");
  });
});
