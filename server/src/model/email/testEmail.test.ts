import { beforeEach, describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";
import { testEmail } from "./testEmail";
import { TestEmailInput } from "./emailSchema";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  buildRealtimeEmailEnvelope: vi.fn(),
  enqueueRealtimeEmail: vi.fn(),
}));

describe("testEmail", () => {
  const context = {
    user: { id: "user-1" },
  } as GraphQLContext;
  const input: TestEmailInput = {
    emailType: "Deliverable Created",
    entityType: "deliverable",
    entityId: "deliverable-1",
    recipientUserIds: ["recipient-1", "recipient-2"],
    payload: { name: "Quarterly Report" },
  };
  const envelope = {
    emailType: "Deliverable Created" as const,
    entityType: "deliverable",
    entityId: "deliverable-1",
    triggeredBy: { type: "realtime" as const, id: "user-1" },
    triggeredAt: "2026-07-13T00:00:00.000Z",
    idempotencyKey: "Deliverable Created:deliverable:deliverable-1",
    payload: {
      name: "Quarterly Report",
      recipients: {
        to: [
          {
            name: "Current User",
            address: "current.user@example.com",
          },
          {
            name: "Second User",
            address: "second.user@example.com",
          },
        ],
      },
    },
  };
  const findMany = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      user: { findMany },
    } as any);
    findMany.mockResolvedValue([
      {
        id: "recipient-1",
        person: {
          email: " current.user@example.com ",
          firstName: "Current",
          lastName: "User",
        },
      },
      {
        id: "recipient-2",
        person: {
          email: "second.user@example.com",
          firstName: "Second",
          lastName: "User",
        },
      },
    ]);
    vi.mocked(buildRealtimeEmailEnvelope).mockReturnValue(envelope);
    vi.mocked(enqueueRealtimeEmail).mockResolvedValue("message-1");
  });

  it("dispatches a generic email envelope for specified users", async () => {
    await expect(testEmail(input, context)).resolves.toBe("message-1");

    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: { id: { in: input.recipientUserIds } },
      include: { person: true },
    });
    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith({
      emailType: input.emailType,
      entityType: input.entityType,
      entityId: input.entityId,
      triggeredById: context.user.id,
      payload: {
        ...input.payload,
        recipients: {
          to: [
            {
              name: "Current User",
              address: "current.user@example.com",
            },
            {
              name: "Second User",
              address: "second.user@example.com",
            },
          ],
        },
      },
    });
    expect(enqueueRealtimeEmail).toHaveBeenCalledExactlyOnceWith(envelope);
  });

  it("rejects recipient IDs that do not resolve to users", async () => {
    findMany.mockResolvedValueOnce([]);

    await expect(testEmail(input, context)).rejects.toThrow(
      "Cannot test email because recipient users were not found: recipient-1, recipient-2"
    );
    expect(buildRealtimeEmailEnvelope).not.toHaveBeenCalled();
    expect(enqueueRealtimeEmail).not.toHaveBeenCalled();
  });

  it("rejects a recipient without an email address", async () => {
    findMany.mockResolvedValueOnce([
      {
        id: "recipient-1",
        person: { email: "", firstName: "Current", lastName: "User" },
      },
      {
        id: "recipient-2",
        person: {
          email: "second.user@example.com",
          firstName: "Second",
          lastName: "User",
        },
      },
    ]);

    await expect(testEmail(input, context)).rejects.toThrow(
      "Cannot test email because recipient user recipient-1 has no email address."
    );
  });
});
