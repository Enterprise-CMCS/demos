import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";

import { setupLogger } from "./log";

describe("setupLogger", () => {
  const prevEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("redacts sensitive fields from serialized log output", () => {
    process.env = { ...prevEnv, AWS_EXECUTION_ENV: "AWS_Lambda_nodejs22.x" };
    const chunks: string[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });
    const logger = setupLogger("test", destination);

    logger.error(
      {
        headers: {
          Authorization: "Bearer token-123", // pragma: allowlist secret
          authorization: "Bearer lower-token-123", // pragma: allowlist secret
        },
        clientSecret: "secret-123", // pragma: allowlist secret
        error: {
          config: {
            headers: {
              Authorization: "Basic basic-token-123", // pragma: allowlist secret
            },
          },
          response: {
            data: {
              access_token: "access-token-123", // pragma: allowlist secret
            },
          },
        },
      },
      "redaction test"
    );

    const output = chunks.join("");
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("token-123");
    expect(output).not.toContain("lower-token-123");
    expect(output).not.toContain("secret-123");
    expect(output).not.toContain("basic-token-123");
    expect(output).not.toContain("access-token-123");
  });
});
