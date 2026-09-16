import type { SQSClient } from "@aws-sdk/client-sqs";
import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDeliverableData: vi.fn(),
  getRecipients: vi.fn(),
  createEmailNotificationRecord: vi.fn(),
  sendSqsNotification: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("./getDeliverableData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./getDeliverableData")>();
  return { ...actual, getDeliverableData: mocks.getDeliverableData };
});

vi.mock("./getRecipients", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./getRecipients")>();
  return { ...actual, getRecipients: mocks.getRecipients };
});

vi.mock("./createEmailNotificationRecord", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./createEmailNotificationRecord")>();
  return { ...actual, createEmailNotificationRecord: mocks.createEmailNotificationRecord };
});

vi.mock("./sendSqsNotification", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sendSqsNotification")>();
  return { ...actual, sendSqsNotification: mocks.sendSqsNotification };
});

vi.mock("../../log", () => ({
  log: { error: mocks.logError, info: mocks.logInfo },
}));

import { enqueueDeliverableDueDateNotification } from "./enqueueDeliverableDueDateNotification";
import { REMINDER_STAGES } from "./getDeliverableData";

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
  mocks.getDeliverableData.mockImplementation(async (_client: PoolClient, reminderStage: string) =>
    reminderStage === "Five Days Prior" ? [deliverable] : []
  );
}

describe("enqueueDeliverableDueDateNotification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getDeliverableData.mockResolvedValue([]);
    mocks.getRecipients.mockResolvedValue([recipient]);
    mocks.createEmailNotificationRecord.mockResolvedValue(undefined);
    mocks.sendSqsNotification.mockResolvedValue(undefined);
  });

  it("runs the notification for every reminder stage", async () => {
    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(mocks.getDeliverableData.mock.calls.map(([, stage]) => stage)).toEqual(REMINDER_STAGES);
    for (const call of mocks.getDeliverableData.mock.calls) {
      expect(call[0]).toBe(client);
    }
  });

  it("queues a notification for each deliverable with recipients", async () => {
    stubOneDeliverableOnFiveDaysPrior();

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(mocks.getRecipients).toHaveBeenCalledExactlyOnceWith(client, deliverable.id);

    expect(mocks.createEmailNotificationRecord).toHaveBeenCalledOnce();
    const [recordClient, emailNotificationId, payloadArg, recipientsArg] =
      mocks.createEmailNotificationRecord.mock.calls[0];
    expect(recordClient).toBe(client);
    expect(payloadArg).toEqual(expectedPayload);
    expect(recipientsArg).toEqual([recipient]);

    expect(mocks.sendSqsNotification).toHaveBeenCalledExactlyOnceWith(
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

    expect(mocks.logInfo).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, emailNotificationId, reminderStage: "Five Days Prior" },
      "queued deliverable due date notification"
    );
  });

  it("skips and logs when no recipients are found", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    mocks.getRecipients.mockResolvedValue([]);

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(mocks.createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(mocks.sendSqsNotification).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, reminderStage: "Five Days Prior" },
      "no recipients found for deliverable due date notification."
    );
  });

  it("logs and continues when querying recipients fails", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    mocks.getRecipients.mockRejectedValue(new Error("db down"));

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(mocks.createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(mocks.sendSqsNotification).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, reminderStage: "Five Days Prior", error: "db down" },
      "failed to query recipients for deliverable due date notification"
    );
  });

  it("logs and continues when creating the email notification record fails", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    mocks.createEmailNotificationRecord.mockRejectedValue(new Error("insert failed"));

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    expect(mocks.sendSqsNotification).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: deliverable.id, error: "insert failed" },
      "failed to create deliverable due date email notification"
    );
  });

  it("logs when sending the sqs notification fails", async () => {
    stubOneDeliverableOnFiveDaysPrior();
    mocks.sendSqsNotification.mockRejectedValue(new Error("sqs down"));

    await enqueueDeliverableDueDateNotification(client, sqsClient);

    const [, emailNotificationId] = mocks.createEmailNotificationRecord.mock.calls[0];

    expect(mocks.logInfo).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledExactlyOnceWith(
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
