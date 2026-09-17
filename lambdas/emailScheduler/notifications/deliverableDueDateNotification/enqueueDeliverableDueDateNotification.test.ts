import type { SQSClient } from "@aws-sdk/client-sqs";
import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./getDeliverableData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./getDeliverableData")>();
  return { ...actual, getDeliverableData: vi.fn() };
});

vi.mock("./getRecipients", () => ({
  getRecipients: vi.fn(),
}));

vi.mock("./createEmailNotificationRecord", () => ({
  createEmailNotificationRecord: vi.fn(),
}));

vi.mock("./sendSqsNotification", () => ({
  sendSqsNotification: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: { error: vi.fn(), info: vi.fn() },
}));

import { enqueueDeliverableDueDateNotification } from "./enqueueDeliverableDueDateNotification";
import { getDeliverableData, REMINDER_STAGES } from "./getDeliverableData";
import { getRecipients } from "./getRecipients";
import { createEmailNotificationRecord } from "./createEmailNotificationRecord";
import { sendSqsNotification } from "./sendSqsNotification";
import { log } from "../../log";

const client = {} as PoolClient;
const sqsClient = {} as SQSClient;

const deliverable = {
  id: "11111111-1111-1111-1111-111111111111",
  deliverable_type_id: "Quarterly Report",
  name: "Test Deliverable",
  demonstration_name: "Test Demonstration",
  state_id: "CA",
  due_date: "2026-09-20T00:00:00.000Z",
  status_id: "Upcoming",
};

const recipient = {
  person_id: "22222222-2222-2222-2222-222222222222",
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
};

const expectedPayload = {
  recipients: {
    to: [],
    bcc: [{ name: "Jane Doe", address: "jane@example.com" }],
  },
  demonstration: { name: deliverable.demonstration_name, stateId: deliverable.state_id },
  deliverable: {
    id: deliverable.id,
    name: deliverable.name,
    deliverableTypeId: deliverable.deliverable_type_id,
    dueDate: deliverable.due_date,
    statusId: deliverable.status_id,
  },
  reminderStage: "Five Days Prior",
};

function stubOneDeliverableOnFiveDaysPrior() {
  vi.mocked(getDeliverableData).mockImplementation(async (_client, reminderStage) =>
    reminderStage === "Five Days Prior" ? [deliverable] : []
  );
}

describe("enqueueDeliverableDueDateNotification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDeliverableData).mockResolvedValue([]);
    vi.mocked(getRecipients).mockResolvedValue([recipient]);
    vi.mocked(createEmailNotificationRecord).mockResolvedValue(undefined as never);
    vi.mocked(sendSqsNotification).mockResolvedValue(undefined);
  });

  it("runs the notification for every reminder stage", async () => {
    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(vi.mocked(getDeliverableData).mock.calls.map(([, stage]) => stage)).toEqual(
      REMINDER_STAGES
    );
    for (const call of vi.mocked(getDeliverableData).mock.calls) {
      expect(call[0]).toBe(client);
    }
  });

  it("queues a notification for each deliverable with recipients", async () => {
    stubOneDeliverableOnFiveDaysPrior();

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(getRecipients).toHaveBeenCalledExactlyOnceWith(client, deliverable.id);

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
        emailType: "Deliverable Due Date Reminder",
        entityType: "deliverable",
        entityId: deliverable.id,
        idempotencyKey: `deliverable-due-date-reminder:${deliverable.id}:${deliverable.due_date}`,
        payload: expectedPayload,
      }
    );

    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, emailNotificationId, reminderStage: "Five Days Prior" },
      "queued deliverable due date notification"
    );
  });

  it("skips and logs when no recipients are found", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    vi.mocked(getRecipients).mockResolvedValue([]);

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, reminderStage: "Five Days Prior" },
      "no recipients found for deliverable due date notification."
    );
  });

  it("logs and continues when querying recipients fails", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    vi.mocked(getRecipients).mockRejectedValue(new Error("db down"));

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, reminderStage: "Five Days Prior", error: "db down" },
      "failed to query recipients for deliverable due date notification"
    );
  });

  it("logs and continues when creating the email notification record fails", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    vi.mocked(createEmailNotificationRecord).mockRejectedValue(new Error("insert failed"));

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, error: "insert failed" },
      "failed to create deliverable due date email notification"
    );
  });

  it("logs when sending the sqs notification fails", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    vi.mocked(sendSqsNotification).mockRejectedValue(new Error("sqs down"));

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    const [, emailNotificationId] = vi.mocked(createEmailNotificationRecord).mock.calls[0];

    expect(log.info).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: deliverable.id,
        emailNotificationId,
        reminderStage: "Five Days Prior",
        error: "sqs down",
      },
      "failed to send deliverable due date notification"
    );
  });
});
