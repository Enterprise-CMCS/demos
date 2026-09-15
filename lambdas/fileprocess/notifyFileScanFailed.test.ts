import type { GuardDutyScanResultNotificationEvent } from "aws-lambda";
import type { Client } from "pg";

const sqsMocks = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn(function () {
    return { send: sqsMocks.send };
  }),
  SendMessageCommand: vi.fn(function (this: { input?: unknown }, input: unknown) {
    this.input = input;
  }),
}));

import { notifyFileScanFailed } from "./notifyFileScanFailed";

const event = {
  id: "guardduty-event-id",
  time: "2026-09-15T12:34:56Z",
  region: "us-east-1",
  detail: {
    s3ObjectDetails: {
      bucketName: "upload-bucket",
      objectKey: "document-id",
    },
    scanResultDetails: {
      scanResultStatus: "THREATS_FOUND",
      threats: [{ name: "Malware.Test" }],
    },
  },
} as GuardDutyScanResultNotificationEvent;

describe("notifyFileScanFailed", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("EMAILER_QUEUE_URL", "https://sqs.example.com/emailer");
    vi.stubEnv("INFECTED_BUCKET", "infected-bucket");
    vi.stubEnv("SECURITY_OFFICER_EMAIL", "Security.Official@example.com");
    sqsMocks.send.mockReset().mockResolvedValue({ MessageId: "message-id" });
  });

  it("blind copies the Security Official and every DEMOS Admin", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("FROM demos_app.document_infected")) {
        return {
          rows: [{
            name: "infected.pdf",
            application_id: "application-id",
            s3_path: "application-id/document-id",
            first_name: "Upload",
            last_name: "User",
            demonstration_name: "Demo Name",
          }],
        };
      }
      if (sql.includes("FROM demos_app.person")) {
        return {
          rows: [
            {
              id: "admin-1",
              first_name: "Admin",
              last_name: "One",
              email: "admin@example.com",
            },
            {
              id: "admin-2",
              first_name: "Security",
              last_name: "Official",
              email: "security.official@example.com",
            },
          ],
        };
      }
      return { rows: [] };
    });

    await notifyFileScanFailed(
      { query } as unknown as Pick<Client, "query">,
      event
    );

    const command = sqsMocks.send.mock.calls[0][0] as { input: { MessageBody: string } };
    const envelope = JSON.parse(command.input.MessageBody);
    expect(envelope.payload.recipients).toEqual({
      to: [],
      bcc: [
        {
          personId: "admin-2",
          name: "Security Official",
          address: "security.official@example.com",
        },
        {
          personId: "admin-1",
          name: "Admin One",
          address: "admin@example.com",
        },
      ].map(({ name, address }) => ({ name, address })),
    });
    expect(envelope.payload.file).toEqual(expect.objectContaining({
      name: "infected.pdf",
      detectedAt: event.time,
      virusInformation: "Malware.Test",
      uploadedBy: "Upload User",
    }));
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO demos_app.email_notification_recipient"),
      [expect.any(String), "admin-1"]
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO demos_app.email_notification_recipient"),
      [expect.any(String), "admin-2"]
    );
  });

  it("requires the Security Official address", async () => {
    vi.stubEnv("SECURITY_OFFICER_EMAIL", "");
    const query = vi.fn();

    await expect(
      notifyFileScanFailed({ query } as unknown as Pick<Client, "query">, event)
    ).rejects.toThrow("SECURITY_OFFICER_EMAIL environment variable is required.");
    expect(query).not.toHaveBeenCalled();
  });
});