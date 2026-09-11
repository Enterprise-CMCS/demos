import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../log", () => ({
  log: {
    info: vi.fn(),
  },
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  enqueueEmail: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { enqueueEmail, RealtimeEmailMessage } from "../../services/emailQueue";
import { enqueueAndTrackRealtimeEmail } from "./emailNotification";

describe("enqueueAndTrackRealtimeEmail", () => {
  const originalEnv = { ...process.env };
  const create = vi.fn();
  const message: RealtimeEmailMessage = {
    emailType: "Deliverable Created",
    entityType: "deliverable",
    entityId: "7cd6cd0f-e3de-47a0-9faa-32343020c955",
    triggeredBy: {
      type: "realtime",
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
    },
    payload: {
      recipients: {
        to: [],
        bcc: ["owner@example.com"],
      },
    },
  };
  const source = {
    deliverableActionId: "2a527c98-8227-46cd-884d-a73e72817d9c",
  };
  const recipients = [{ personId: "500e9bef-8745-4209-ac73-0a87fa5f888b" }];

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, DISABLE_EMAIL_NOTIFICATIONS: "false" };
    vi.mocked(prisma).mockReturnValue({
      emailNotification: {
        create,
      },
    } as never);
    create.mockResolvedValue({ id: "notification-1" });
    vi.mocked(enqueueEmail).mockResolvedValue("message-1");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("creates a pending notification before enqueueing it", async () => {
    await expect(enqueueAndTrackRealtimeEmail(message, source, recipients)).resolves.toBe(
      "message-1"
    );

    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: {
        emailTypeId: "Deliverable Created",
        entityType: "deliverable",
        deliverableActionId: source.deliverableActionId,
        statusId: "Pending",
        payload: message.payload,
        recipients: {
          create: recipients,
        },
      },
    });
    expect(enqueueEmail).toHaveBeenCalledExactlyOnceWith({
      ...message,
      emailNotificationId: "notification-1",
    });
  });

  it("does not create a notification when email notifications are disabled", async () => {
    process.env.DISABLE_EMAIL_NOTIFICATIONS = "true";

    await expect(enqueueAndTrackRealtimeEmail(message, source, recipients)).resolves.toBeNull();

    expect(create).not.toHaveBeenCalled();
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it("reports a queue failure from enqueueEmail", async () => {
    vi.mocked(enqueueEmail).mockRejectedValueOnce(new Error("queue unavailable"));

    await expect(enqueueAndTrackRealtimeEmail(message, source, recipients)).rejects.toThrow(
      "queue unavailable"
    );

    expect(create).toHaveBeenCalledOnce();
  });
});
