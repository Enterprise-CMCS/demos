import type { SQSClient } from "@aws-sdk/client-sqs";
import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./getApplicationData", () => ({
  getApplicationData: vi.fn(),
}));

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

import { enqueueApplicationExpectedApprovalDateNotification } from "./enqueueApplicationExpectedApprovalDateNotification";
import { getApplicationData } from "./getApplicationData";
import { getRecipients } from "./getRecipients";
import { createEmailNotificationRecord } from "./createEmailNotificationRecord";
import { sendSqsNotification } from "../sendSqsNotification";
import { log } from "../../log";

const client = {} as PoolClient;
const sqsClient = {} as SQSClient;

const application = {
  id: "11111111-1111-1111-1111-111111111111",
  application_type_id: "Amendment",
  name: "Test Application",
  parent_demonstration_name: "Test Demonstration",
  parent_demonstration_id: "33333333-3333-3333-3333-333333333333",
  state_id: "CA",
  expected_approval_date: "2026-09-20T00:00:00.000Z",
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
  application: {
    id: application.id,
    name: application.name,
    applicationTypeId: application.application_type_id,
    expectedApprovalDate: application.expected_approval_date,
    parentDemonstrationName: application.parent_demonstration_name,
    parentDemonstrationId: application.parent_demonstration_id,
    stateId: application.state_id,
  },
};

describe("enqueueApplicationExpectedApprovalDateNotification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getApplicationData).mockResolvedValue([application]);
    vi.mocked(getRecipients).mockResolvedValue([recipient]);
    vi.mocked(createEmailNotificationRecord).mockResolvedValue(undefined as never);
    vi.mocked(sendSqsNotification).mockResolvedValue(undefined);
  });

  it("does nothing when there are no applicable applications", async () => {
    vi.mocked(getApplicationData).mockResolvedValue([]);

    await enqueueApplicationExpectedApprovalDateNotification(client, sqsClient);

    expect(getRecipients).not.toHaveBeenCalled();
  });

  it("queues a notification for an application with recipients", async () => {
    await enqueueApplicationExpectedApprovalDateNotification(client, sqsClient);

    expect(getRecipients).toHaveBeenCalledExactlyOnceWith(client, application.id);

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
        emailType: "Application Expected approval date Reminder",
        entityType: "application",
        entityId: application.id,
        idempotencyKey: `application-due-date-reminder:${application.id}:${application.expected_approval_date}`,
        payload: expectedPayload,
      }
    );

    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      { applicationId: application.id, emailNotificationId },
      "queued application expected approval date notification"
    );
  });

  it("skips and logs when no recipients are found", async () => {
    vi.mocked(getRecipients).mockResolvedValue([]);

    await enqueueApplicationExpectedApprovalDateNotification(client, sqsClient);

    expect(createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      { applicationId: application.id },
      "no recipients found for application expected approval date notification."
    );
  });

  it("logs and continues when querying recipients fails", async () => {
    vi.mocked(getRecipients).mockRejectedValue(new Error("db down"));

    await enqueueApplicationExpectedApprovalDateNotification(client, sqsClient);

    expect(createEmailNotificationRecord).not.toHaveBeenCalled();
    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      { applicationId: application.id, error: "db down" },
      "failed to query recipients for application expected approval date notification"
    );
  });

  it("logs and continues when creating the email notification record fails", async () => {
    vi.mocked(createEmailNotificationRecord).mockRejectedValue(new Error("insert failed"));

    await enqueueApplicationExpectedApprovalDateNotification(client, sqsClient);

    expect(sendSqsNotification).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      { applicationId: application.id, error: "insert failed" },
      "failed to create application expected approval date email notification"
    );
  });

  it("logs when sending the sqs notification fails", async () => {
    vi.mocked(sendSqsNotification).mockRejectedValue(new Error("sqs down"));

    await enqueueApplicationExpectedApprovalDateNotification(client, sqsClient);

    const [, emailNotificationId] = vi.mocked(createEmailNotificationRecord).mock.calls[0];

    expect(log.info).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      {
        applicationId: application.id,
        emailNotificationId,
        error: "sqs down",
      },
      "failed to send application expected approval date notification"
    );
  });
});
