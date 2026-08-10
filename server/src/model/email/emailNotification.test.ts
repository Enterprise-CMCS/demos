import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../prismaClient";
import { enqueueRealtimeEmail, RealtimeEmailEnvelope } from "../../services/emailQueue";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  enqueueRealtimeEmail: vi.fn(),
}));

describe("enqueueTrackedRealtimeEmail", () => {
  const create = vi.fn();
  const update = vi.fn();
  const updateMany = vi.fn();
  const message: RealtimeEmailEnvelope = {
    emailType: "Deliverable Created",
    entityType: "deliverable",
    entityId: "7cd6cd0f-e3de-47a0-9faa-32343020c955",
    triggeredBy: {
      type: "realtime",
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
    },
    triggeredAt: "2026-07-30T12:00:00.000Z",
    idempotencyKey:
      "Deliverable Created:deliverable-action:2a527c98-8227-46cd-884d-a73e72817d9c",
    payload: {
      recipients: {
        to: [],
        bcc: ["Owner@Example.com"],
      },
    },
  };
  const sourceActionId = "2a527c98-8227-46cd-884d-a73e72817d9c";
  const recipients = [
    {
      personId: "500e9bef-8745-4209-ac73-0a87fa5f888b",
      emailAddress: "Owner@Example.com",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      emailNotification: {
        create,
        update,
        updateMany,
      },
    } as any);
    create.mockResolvedValue({ id: "notification-1" });
    update.mockResolvedValue({ id: "notification-1" });
    updateMany.mockResolvedValue({ count: 1 });
    vi.mocked(enqueueRealtimeEmail).mockResolvedValue("message-1");
  });

  it("records recipients and marks a successfully queued notification", async () => {
    await expect(
      enqueueTrackedRealtimeEmail(message, sourceActionId, recipients)
    ).resolves.toBe("message-1");

    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: {
        emailTypeId: "Deliverable Created",
        entityType: "deliverable",
        entityId: message.entityId,
        sourceActionId,
        triggeredByUserId: message.triggeredBy.id,
        statusId: "Pending",
        idempotencyKey: message.idempotencyKey,
        payload: message.payload,
        recipients: {
          create: [
            {
              personId: recipients[0].personId,
              emailAddress: "Owner@Example.com",
              normalizedEmail: "owner@example.com",
            },
          ],
        },
      },
    });
    expect(enqueueRealtimeEmail).toHaveBeenCalledExactlyOnceWith({
      ...message,
      emailNotificationId: "notification-1",
    });
    expect(update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "notification-1" },
      data: {
        sqsMessageId: "message-1",
      },
    });
    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "notification-1",
        statusId: "Pending",
      },
      data: {
        statusId: "Queued",
      },
    });
  });

  it("marks a notification failed when SQS rejects it", async () => {
    vi.mocked(enqueueRealtimeEmail).mockRejectedValueOnce(
      new Error("queue unavailable")
    );

    await expect(
      enqueueTrackedRealtimeEmail(message, sourceActionId, recipients)
    ).rejects.toThrow("queue unavailable");

    expect(update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "notification-1" },
      data: {
        statusId: "Failed",
        lastError: "queue unavailable",
      },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });
});
