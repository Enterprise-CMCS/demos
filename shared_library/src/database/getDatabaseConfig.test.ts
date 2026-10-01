import { describe, it, expect, vi,  afterEach, beforeEach } from "vitest";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

let getDatabaseConfig:
  typeof import("./getDatabaseConfig.js").getDatabaseConfig;

const mockSecretArn = "arn:aws:secretsmanager:secret" // pragma: allowlist secret
vi.mock("@aws-sdk/client-secrets-manager");
const send = vi.mocked(SecretsManagerClient.prototype.send as never) as unknown as ReturnType<
  typeof vi.fn
>;

const CREDENTIALS = {
  username: "demos_export",
  password: "not-a-real-password", // pragma: allowlist secret
  host: "unit.test.rds.host",
  port: 5432,
  dbname: "utdb",
  engine: "postgres",
};

const ORIGINAL_ENV = process.env;

describe("getDatabaseConfig", () => {

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    ({ getDatabaseConfig } = await import("./getDatabaseConfig.js"));
    send.mockResolvedValue({ SecretString: JSON.stringify(CREDENTIALS) });
  });

  it("requires the secret ARN", async () => {
    // @ts-expect-error
    await expect(getDatabaseConfig()).rejects.toThrow(
      "Database secret arn must be provided to retrieve credentials"
    );
  });

  it("asks Secrets Manager for the ARN it was given", async () => {
    await getDatabaseConfig(mockSecretArn);
    expect(GetSecretValueCommand).toHaveBeenCalledWith({
      SecretId: mockSecretArn, // pragma: allowlist secret
    });
  });

  it("names the secret when it exists but has no string value", async () => {
    send.mockResolvedValue({});
    await expect(getDatabaseConfig(mockSecretArn)).rejects.toThrow(
      "The SecretString value is undefined for secret: arn:aws:secretsmanager:secret"
    );
  });

  it("preserves reserved characters in the discrete password", async () => {
    const password = "generated#/?password"; // pragma: allowlist secret
    send.mockResolvedValue({
      SecretString: JSON.stringify({ ...CREDENTIALS, password }),
    });

    const config = await getDatabaseConfig(mockSecretArn);

    expect(config.password).toBe(password); // pragma: allowlist secret
    expect(config.host).toBe("unit.test.rds.host");
  });

  it("keeps the password out of enumerable configuration", async () => {
    const config = await getDatabaseConfig(mockSecretArn);

    expect(config.password).toBe("not-a-real-password"); // pragma: allowlist secret
    expect(Object.keys(config)).not.toContain("password");
  });

  it("requires SSL by default", async () => {
    expect((await getDatabaseConfig(mockSecretArn)).ssl).toEqual({rejectUnauthorized: true});
  });

  it("prevents connectionString from being passed", async () => {
    // @ts-expect-error
    await expect(getDatabaseConfig(mockSecretArn, {connectionString: "something"})).rejects.toThrow(
      "connectionString should not be set in additional options"
    );
  });

  it("should return config with options passed, but overwrite invalid options", async () => {
    // @ts-expect-error
    const config = await getDatabaseConfig(mockSecretArn, {user: "something", options: "-c DateStyle=ISO,MD"})
    expect(config.options).toEqual("-c DateStyle=ISO,MD")
    expect(config.user).toEqual(CREDENTIALS.username)
  })

  it("disables SSL only when BYPASS_SSL is set, for localstack", async () => {
    process.env.BYPASS_SSL = "1";
    expect((await getDatabaseConfig(mockSecretArn)).ssl).toBe(false);
  });

  it("lets DB_SSL_MODE override, and win over BYPASS_SSL", async () => {
    process.env.DB_SSL_MODE = "verify-full";
    process.env.BYPASS_SSL = "1";
    expect((await getDatabaseConfig(mockSecretArn)).ssl).toEqual({rejectUnauthorized: true});
  });

  it("preserves the no-verify SSL mode", async () => {
    process.env.DB_SSL_MODE = "no-verify";
    expect((await getDatabaseConfig(mockSecretArn)).ssl).toEqual({ rejectUnauthorized: false });
  });
 
  it("adds additional options to ssl", async () => {
    process.env.DB_SSL_MODE = "verify-full";
    expect((await getDatabaseConfig(mockSecretArn, {ssl: {ca: "/path/to/root-ca.pem"}})).ssl).toEqual({
       rejectUnauthorized: true,
       ca: "/path/to/root-ca.pem"
      });
  });

  it("fetches the secret once and serves the rest from cache", async () => {
    await getDatabaseConfig(mockSecretArn);
    await getDatabaseConfig(mockSecretArn);
    await getDatabaseConfig(mockSecretArn);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("refetches after 5 minutes, so a rotated password is picked up", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T07:00:00Z"));
    await getDatabaseConfig(mockSecretArn);

    vi.setSystemTime(new Date("2026-09-04T07:04:59Z"));
    await getDatabaseConfig(mockSecretArn);
    expect(send).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-09-04T07:05:01Z"));
    await getDatabaseConfig(mockSecretArn);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("serves a rotated password after the cache expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T07:00:00Z"));
    expect((await getDatabaseConfig(mockSecretArn)).password).toBe("not-a-real-password");

    send.mockResolvedValue({
      SecretString: JSON.stringify({ ...CREDENTIALS, password: "rotated" }), // pragma: allowlist secret
    });
    vi.setSystemTime(new Date("2026-09-04T07:05:01Z"));
    expect((await getDatabaseConfig(mockSecretArn)).password).toBe("rotated");
  });

});
