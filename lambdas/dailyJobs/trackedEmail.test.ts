import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enqueueEmail: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("./emailQueue", () => ({ enqueueEmail: mocks.enqueueEmail }));
vi.mock("./db", () => ({ getDbSchema: vi.fn(() => "demos_app") }));
vi.mock("./log", () => ({ log: { error: mocks.logError } }));

import { enqueueTrackedEmail } from "./trackedEmail";

const input = {
  emailType: "Deliverable Due Today",
  entityType: "deliverable",
  entityId: "11111111-1111-4111-8111-111111111111",
  idempotencyKey:
    "Deliverable Due Today:deliverable:11111111-1111-4111-8111-111111111111:2026-08-24",
  scheduledAt: new Date("2026-08-24T12:00:00.000Z"),
  jobId: "deliverable-due-today",
  payload: { deliverable: { id: "11111111-1111-4111-8111-111111111111" } },
  recipients: [
    {
      personId: "22222222-2222-4222-8222-222222222222",
      name: "CMS Owner",
      address: "Owner@Example.com",
    },
  ],
};

function pool(notificationId: string | null = "33333333-3333-4333-8333-333333333333") {
  const clientQuery = vi.fn(async (sql: string) => {
    if (sql.includes("INSERT INTO demos_app.email_notification (")) {
      return { rows: notificationId ? [{ id: notificationId }] : [], rowCount: notificationId ? 1 : 0 };
    }
    return { rows: [], rowCount: 1 };
  });
  const release = vi.fn();
  const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });

  return {
    value: {
      connect: vi.fn(async () => ({ query: clientQuery, release })),
      query,
    } as any,
    clientQuery,
    release,
    query,
  };
}

describe("enqueueTrackedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enqueueEmail.mockResolvedValue("sqs-message-1");
  });

  it("creates tracking rows, queues the envelope, and marks it queued", async () => {
    const testPool = pool();

    await expect(enqueueTrackedEmail(testPool.value, input)).resolves.toBe("queued");

    expect(testPool.clientQuery).toHaveBeenCalledWith("BEGIN");
    expect(testPool.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO demos_app.email_notification ("),
      expect.arrayContaining([
        "Deliverable Due Today",
        "deliverable",
        input.entityId,
        input.idempotencyKey,
      ])
    );
    expect(testPool.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO demos_app.email_notification_recipient"),
      [
        "33333333-3333-4333-8333-333333333333",
        input.recipients[0].personId,
        "Owner@Example.com",
        "owner@example.com",
      ]
    );
    expect(testPool.clientQuery).toHaveBeenCalledWith("COMMIT");
    expect(testPool.release).toHaveBeenCalledOnce();
    expect(mocks.enqueueEmail).toHaveBeenCalledExactlyOnceWith({
      emailNotificationId: "33333333-3333-4333-8333-333333333333",
      emailType: "Deliverable Due Today",
      entityType: "deliverable",
      entityId: input.entityId,
      triggeredBy: { type: "scheduled", id: "deliverable-due-today" },
      triggeredAt: "2026-08-24T12:00:00.000Z",
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
    });
    expect(testPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status_id = 'Queued'"),
      ["33333333-3333-4333-8333-333333333333", "sqs-message-1"]
    );
  });

  it("skips an already tracked idempotency key", async () => {
    const testPool = pool(null);

    await expect(enqueueTrackedEmail(testPool.value, input)).resolves.toBe("skipped");

    expect(mocks.enqueueEmail).not.toHaveBeenCalled();
    expect(testPool.query).not.toHaveBeenCalled();
    expect(testPool.clientQuery).toHaveBeenCalledWith("COMMIT");
  });

  it("records an SQS failure before reporting it", async () => {
    const testPool = pool();
    mocks.enqueueEmail.mockRejectedValue(new Error("SQS unavailable"));

    await expect(enqueueTrackedEmail(testPool.value, input)).rejects.toThrow(
      "SQS unavailable"
    );
    expect(testPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status_id = 'Failed'"),
      ["33333333-3333-4333-8333-333333333333", "SQS unavailable"]
    );
  });
});
