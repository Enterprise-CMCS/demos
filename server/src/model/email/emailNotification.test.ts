import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  enqueueEmail: vi.fn(),
}));

import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueEmail, RealtimeEmailMessage } from "../../services/emailQueue";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";

describe("enqueueTrackedRealtimeEmail", () => {
  const create = vi.fn();
  const update = vi.fn();
  const updateMany = vi.fn();
  const message: RealtimeEmailMessage = {
    emailType: "Deliverable Created",
    entityType: "deliverable",
    entityId: "7cd6cd0f-e3de-47a0-9faa-32343020c955",
    triggeredBy: {
      type: "realtime",
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
    },
    triggeredAt: "2026-07-30T12:00:00.000Z",
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
    vi.mocked(enqueueEmail).mockResolvedValue("message-1");
  });

  it("records recipients and marks a successfully queued notification", async () => {
    await expect(
      enqueueTrackedRealtimeEmail(message, { deliverableActionId: sourceActionId }, recipients),
    ).resolves.toBe("message-1");

    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: {
        emailTypeId: "Deliverable Created",
        entityType: "deliverable",
        deliverableId: message.entityId,
        deliverableActionId: sourceActionId,
        publicCommentId: undefined,
        triggeredByUserId: message.triggeredBy.id,
        statusId: "Pending",
        payload: message.payload,
        recipients: {
          create: [
            {
              personId: recipients[0].personId,
              emailAddress: "owner@example.com",
            },
          ],
        },
      },
    });
    expect(enqueueEmail).toHaveBeenCalledExactlyOnceWith({
      ...message,
      emailNotificationId: "notification-1",
    });
    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "notification-1",
        statusId: "Pending",
      },
      data: {
        sqsMessageId: "message-1",
        statusId: "Queued",
      },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("records public comment provenance for each comment email", async () => {
    const publicCommentMessage = {
      ...message,
      emailType: "Public Comment Added",
    } satisfies RealtimeEmailMessage;

    await enqueueTrackedRealtimeEmail(
      publicCommentMessage,
      { publicCommentId: "public-comment-1" },
      recipients,
    );

    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: expect.objectContaining({
        deliverableId: message.entityId,
        deliverableActionId: undefined,
        publicCommentId: "public-comment-1",
      }),
    });
  });

  it.each([
    ["Application Status Updated", "application", "applicationId"],
    ["Terms And Conditions Requested", "reference", "referenceId"],
    [
      "Terms And Conditions Requested",
      "reference_agreement",
      "referenceAgreementId",
    ],
  ] as const)("links %s through %s", async (emailType, entityType, foreignKey) => {
    const entityMessage = {
      ...message,
      emailType,
      entityType,
    } as RealtimeEmailMessage;

    await enqueueTrackedRealtimeEmail(entityMessage, undefined, recipients);

    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: expect.objectContaining({
        [foreignKey]: message.entityId,
        deliverableActionId: undefined,
        publicCommentId: undefined,
      }),
    });
  });

  it("records the message ID without overwriting a terminal status", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      enqueueTrackedRealtimeEmail(message, { deliverableActionId: sourceActionId }, recipients),
    ).resolves.toBe("message-1");

    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "notification-1",
        statusId: "Pending",
      },
      data: {
        sqsMessageId: "message-1",
        statusId: "Queued",
      },
    });
    expect(update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "notification-1" },
      data: { sqsMessageId: "message-1" },
    });
  });

  it("marks the notification failed when SQS rejects it", async () => {
    vi.mocked(enqueueEmail).mockRejectedValueOnce(new Error("queue unavailable"));

    await expect(
      enqueueTrackedRealtimeEmail(message, { deliverableActionId: sourceActionId }, recipients),
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

  it("preserves the queue error when recording the failure also fails", async () => {
    vi.mocked(enqueueEmail).mockRejectedValueOnce(new Error("queue unavailable"));
    update.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      enqueueTrackedRealtimeEmail(message, { deliverableActionId: sourceActionId }, recipients),
    ).rejects.toThrow("queue unavailable");

    expect(log.error).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({ message: "database unavailable" }),
        emailNotificationId: "notification-1",
      },
      "Failed to record email notification queue failure",
    );
  });
});
