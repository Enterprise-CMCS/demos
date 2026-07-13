import { beforeEach, describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";
import { createEmail } from "./createEmail";
import { CreateEmailInput } from "./emailSchema";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  buildRealtimeEmailEnvelope: vi.fn(),
  enqueueRealtimeEmail: vi.fn(),
}));

describe("createEmail", () => {
  const context = {
    user: { id: "user-1" },
  } as GraphQLContext;
  const input: CreateEmailInput = {
    emailType: "Deliverable Created",
    entityType: "deliverable",
    entityId: "deliverable-1",
    payload: { name: "Quarterly Report" },
  };
  const envelope = {
    emailType: "Deliverable Created" as const,
    entityType: "deliverable",
    entityId: "deliverable-1",
    triggeredBy: { type: "realtime" as const, id: "graphql-api" },
    triggeredAt: "2026-07-13T00:00:00.000Z",
    idempotencyKey: "Deliverable Created:deliverable:deliverable-1",
    payload: {
      name: "Quarterly Report",
      to: "current.user@example.com",
    },
  };
  const findUniqueOrThrow = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      user: { findUniqueOrThrow },
    } as any);
    findUniqueOrThrow.mockResolvedValue({
      person: { email: " current.user@example.com " },
    });
    vi.mocked(buildRealtimeEmailEnvelope).mockReturnValue(envelope);
    vi.mocked(enqueueRealtimeEmail).mockResolvedValue("message-1");
  });

  it("dispatches a generic email envelope for the current user", async () => {
    await expect(createEmail(input, context)).resolves.toBe("message-1");

    expect(findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: context.user.id },
      include: { person: true },
    });
    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith({
      ...input,
      payload: {
        ...input.payload,
        to: "current.user@example.com",
      },
    });
    expect(enqueueRealtimeEmail).toHaveBeenCalledExactlyOnceWith(envelope);
  });

  it("rejects a current user without an email address", async () => {
    findUniqueOrThrow.mockResolvedValueOnce({ person: { email: "" } });

    await expect(createEmail(input, context)).rejects.toThrow(
      "Cannot create email because the current user email is missing."
    );
    expect(buildRealtimeEmailEnvelope).not.toHaveBeenCalled();
    expect(enqueueRealtimeEmail).not.toHaveBeenCalled();
  });
});
