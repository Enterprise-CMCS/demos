import { describe, expect, it, vi, beforeEach } from "vitest";

const { sendMock, queryMock, releaseMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  queryMock: vi.fn(),
  releaseMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-secrets-manager", () => {
  class SecretsManagerClient {
    send = sendMock;
  }
  class GetSecretValueCommand {
    constructor(public input: unknown) {}
  }
  return { SecretsManagerClient, GetSecretValueCommand };
});

vi.mock("pg", () => {
  class Pool {
    connect = vi.fn().mockResolvedValue({
      query: queryMock,
      release: releaseMock,
    });
  }
  return { Pool };
});

import { fetchQuestionPrompts } from "./db";

describe("fetchQuestionPrompts", () => {
  beforeEach(() => {
    sendMock.mockReset();
    queryMock.mockReset();
    releaseMock.mockReset();
    process.env.DATABASE_SECRET_ARN = "db-secret-arn"; // pragma: allowlist secret
  });

  it("normalizes and filters prompts", async () => {
    sendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        username: "u",
        password: "p",
        host: "h",
        port: "5432",
        dbname: "demos",
      }),
    });

    queryMock.mockResolvedValue({
      rows: [
        { id: "one", question: "First", field_type: "Text", multi_valued: true },
        { question: "", field_type: "Text", multi_valued: false },
        { prompt_id: "two", prompt: "Second", type: "Number", multivalued: true },
      ],
    });

    const result = await fetchQuestionPrompts();

    expect(result).toEqual([
      { id: "one", question: "First", fieldType: "Text", multiValued: true },
      { id: "two", question: "Second", fieldType: "Number", multiValued: true },
    ]);
    expect(releaseMock).toHaveBeenCalled();
  });
});
