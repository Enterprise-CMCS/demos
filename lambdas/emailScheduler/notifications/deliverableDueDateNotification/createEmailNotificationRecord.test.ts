import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createEmailNotificationRecord,
  INSERT_EMAIL_NOTIFICATION_QUERY,
  INSERT_RECIPIENT_QUERY,
  Payload,
} from "./createEmailNotificationRecord";
import type { Recipient } from "./getRecipients";

const payload: Payload = {
  recipients: {
    to: [],
    bcc: [{ name: "Jane Doe", address: "jane@example.com" }],
  },
  demonstration: { name: "Test Demonstration", stateName: "California" },
  deliverable: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Test Deliverable",
    deliverableTypeId: "Quarterly Report",
    dueDate: "2026-09-20T00:00:00.000Z",
    statusId: "Upcoming",
  },
  reminderStage: "Five Days Prior",
};

const recipients: Recipient[] = [
  {
    person_id: "22222222-2222-2222-2222-222222222222",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
  },
  {
    person_id: "33333333-3333-3333-3333-333333333333",
    first_name: "John",
    last_name: "Smith",
    email: "john@example.com",
  },
];

const emailNotificationId = "44444444-4444-4444-4444-444444444444";

describe("createEmailNotificationRecord", () => {
  const query = vi.fn();
  const client = { query } as unknown as PoolClient;

  beforeEach(() => {
    vi.resetAllMocks();
    query.mockResolvedValue(undefined);
  });

  it("inserts the notification and one recipient row per recipient inside a transaction", async () => {
    const result = await createEmailNotificationRecord(
      client,
      emailNotificationId,
      payload,
      recipients
    );

    expect(result).toBe(emailNotificationId);
    expect(query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(query).toHaveBeenNthCalledWith(2, INSERT_EMAIL_NOTIFICATION_QUERY, [
      emailNotificationId,
      "Deliverable Due Date Reminder",
      payload.deliverable.id,
      JSON.stringify(payload),
    ]);
    expect(query).toHaveBeenNthCalledWith(3, INSERT_RECIPIENT_QUERY, [
      emailNotificationId,
      recipients[0].person_id,
    ]);
    expect(query).toHaveBeenNthCalledWith(4, INSERT_RECIPIENT_QUERY, [
      emailNotificationId,
      recipients[1].person_id,
    ]);
    expect(query).toHaveBeenNthCalledWith(5, "COMMIT");
    expect(query).toHaveBeenCalledTimes(5);
  });

  it("rolls back and rethrows when the email_notification insert fails", async () => {
    query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error("insert failed")); // INSERT email_notification

    await expect(
      createEmailNotificationRecord(client, emailNotificationId, payload, recipients)
    ).rejects.toThrow("insert failed");

    expect(query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(query).not.toHaveBeenCalledWith("COMMIT");
  });

  it("rolls back and rethrows when a recipient insert fails", async () => {
    query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce(undefined) // INSERT email_notification
      .mockRejectedValueOnce(new Error("recipient insert failed")); // INSERT recipient

    await expect(
      createEmailNotificationRecord(client, emailNotificationId, payload, recipients)
    ).rejects.toThrow("recipient insert failed");

    expect(query).toHaveBeenNthCalledWith(4, "ROLLBACK");
    expect(query).not.toHaveBeenCalledWith("COMMIT");
  });

  it("rolls back and rethrows when commit fails", async () => {
    query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce(undefined) // INSERT email_notification
      .mockResolvedValueOnce(undefined) // INSERT recipient 1
      .mockResolvedValueOnce(undefined) // INSERT recipient 2
      .mockRejectedValueOnce(new Error("commit failed")); // COMMIT

    await expect(
      createEmailNotificationRecord(client, emailNotificationId, payload, recipients)
    ).rejects.toThrow("commit failed");

    expect(query).toHaveBeenNthCalledWith(6, "ROLLBACK");
  });
});
