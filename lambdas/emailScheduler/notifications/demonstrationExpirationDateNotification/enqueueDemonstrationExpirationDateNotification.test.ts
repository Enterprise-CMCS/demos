import type { SQSClient } from "@aws-sdk/client-sqs";
import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./getDemonstrationData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./getDemonstrationData")>();
  return { ...actual, getDemonstrationData: vi.fn() };
});

vi.mock("./getRecipients", () => ({
  getRecipients: vi.fn(),
}));

vi.mock("./createEmailNotificationRecord", () => ({
  createEmailNotificationRecord: vi.fn(),
}));

vi.mock("../sendSqsNotification", () => ({
  sendSqsNotification: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: { error: vi.fn(), info: vi.fn() },
}));

import { enqueueDemonstrationExpirationDateNotification } from "./enqueueDemonstrationExpirationDateNotification";
import {
  DemonstrationExpirationDateNotification,
  getDemonstrationData,
  REMINDER_STAGES,
} from "./getDemonstrationData";
import { getRecipients } from "./getRecipients";
import { createEmailNotificationRecord, Payload } from "./createEmailNotificationRecord";
import { sendSqsNotification } from "../sendSqsNotification";
import { log } from "../../log";

const client = {} as PoolClient;
const sqsClient = {} as SQSClient;

const demonstration: DemonstrationExpirationDateNotification = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Test Demonstration",
  state_id: "CA",
  expiration_date: "2026-09-20T00:00:00.000Z",
};

const recipient = {
  person_id: "22222222-2222-2222-2222-222222222222",
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
};

const expectedPayload: Payload = {
  recipients: {
    to: [],
    bcc: [{ name: "Jane Doe", address: "jane@example.com" }],
  },
  demonstration: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Test Demonstration",
    stateId: "CA",
    expirationDate: "2026-09-20T00:00:00.000Z",
  },
  reminderStage: "Thirty Days Prior",
  isStateUser: false,
};

function stubOneDemonstrationOnThirtyDaysPrior() {
  vi.mocked(getDemonstrationData).mockImplementation(async (_client, reminderStage) =>
    reminderStage === "Thirty Days Prior" ? [demonstration] : []
  );
}

describe("enqueueDemonstrationExpirationDateNotification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDemonstrationData).mockResolvedValue([]);
    // every stage runs once for isStateUser=false and once for isStateUser=true; only the
    // non-state-user pass has a recipient by default, so the state-user pass harmlessly
    // logs "no recipients found" unless a test overrides this for both
    vi.mocked(getRecipients).mockImplementation(async (_client, _demonstrationId, isStateUser) =>
      isStateUser ? [] : [recipient]
    );
    vi.mocked(createEmailNotificationRecord).mockResolvedValue(undefined as never);
    vi.mocked(sendSqsNotification).mockResolvedValue(undefined);
  });

  it("runs the notification for every reminder stage and both user types", async () => {
    await enqueueDemonstrationExpirationDateNotification(client, sqsClient);

    expect(vi.mocked(getDemonstrationData).mock.calls.map(([, stage]) => stage)).toEqual(
      REMINDER_STAGES.flatMap((stage) => [stage, stage])
    );
    for (const call of vi.mocked(getDemonstrationData).mock.calls) {
      expect(call[0]).toBe(client);
    }
  });

  it("queues a notification for the demonstration's non-state-user recipients", async () => {
    stubOneDemonstrationOnThirtyDaysPrior();

    await enqueueDemonstrationExpirationDateNotification(client, sqsClient);

    expect(getRecipients).toHaveBeenCalledWith(client, demonstration.id, false);

    expect(createEmailNotificationRecord).toHaveBeenCalledOnce();
    const [recordClient, emailNotificationId, payloadArg, recipientsArg] = vi.mocked(
      createEmailNotificationRecord
    ).mock.calls[0];
    expect(recordClient).toBe(client);
    expect(payloadArg).toEqual(expectedPayload);
    expect(recipientsArg).toEqual([recipient]);

    expect(sendSqsNotification).toHaveBeenCalledExactlyOnceWith(
      client,
      sqsClient,
      emailNotificationId,
      {
        emailNotificationId,
        emailType: "Demonstration Expiration Date Reminder",
        entityType: "demonstration",
        entityId: demonstration.id,
        idempotencyKey: `demonstration-expiration-date-reminder:${demonstration.id}:${demonstration.expiration_date}`,
        payload: expectedPayload,
      }
    );

    expect(log.info).toHaveBeenCalledWith(
      {
        demonstrationId: demonstration.id,
        emailNotificationId,
        reminderStage: "Thirty Days Prior",
      },
      "queued demonstration expiration date notification"
    );
  });

  it("skips and logs when no recipients are found for either user type", async () => {
    stubOneDemonstrationOnThirtyDaysPrior();
    vi.mocked(getRecipients).mockResolvedValue([]);

    await enqueueDemonstrationExpirationDateNotification(client, sqsClient);

    expect(createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledTimes(2);
    expect(log.error).toHaveBeenCalledWith(
      { demonstrationId: demonstration.id, reminderStage: "Thirty Days Prior" },
      "no recipients found for demonstration expiration date notification."
    );
  });

  it("logs and continues when querying recipients fails", async () => {
    stubOneDemonstrationOnThirtyDaysPrior();
    vi.mocked(getRecipients).mockRejectedValue(new Error("db down"));

    await enqueueDemonstrationExpirationDateNotification(client, sqsClient);

    expect(createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledTimes(2);
    expect(log.error).toHaveBeenCalledWith(
      { demonstrationId: demonstration.id, reminderStage: "Thirty Days Prior", error: "db down" },
      "failed to query recipients for demonstration expiration date notification"
    );
  });

  it("logs and continues when creating the email notification record fails", async () => {
    stubOneDemonstrationOnThirtyDaysPrior();
    vi.mocked(createEmailNotificationRecord).mockRejectedValue(new Error("insert failed"));

    await enqueueDemonstrationExpirationDateNotification(client, sqsClient);

    expect(sendSqsNotification).not.toHaveBeenCalled();
    // only the non-state-user pass has a recipient by default, so only it reaches this point
    expect(log.error).toHaveBeenCalledWith(
      { demonstrationId: demonstration.id, error: "insert failed" },
      "failed to create demonstration expiration date email notification"
    );
  });

  it("logs when sending the sqs notification fails", async () => {
    stubOneDemonstrationOnThirtyDaysPrior();
    vi.mocked(sendSqsNotification).mockRejectedValue(new Error("sqs down"));

    await enqueueDemonstrationExpirationDateNotification(client, sqsClient);

    const [, emailNotificationId] = vi.mocked(createEmailNotificationRecord).mock.calls[0];

    expect(log.info).not.toHaveBeenCalledWith(
      expect.anything(),
      "queued demonstration expiration date notification"
    );
    // only the non-state-user pass has a recipient by default, so only it reaches this point
    expect(log.error).toHaveBeenCalledWith(
      {
        demonstrationId: demonstration.id,
        emailNotificationId,
        reminderStage: "Thirty Days Prior",
        error: "sqs down",
      },
      "failed to send demonstration expiration date notification"
    );
  });
});
