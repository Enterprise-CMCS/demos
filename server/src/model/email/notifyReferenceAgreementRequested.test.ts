import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  enqueueEmail: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueEmail } from "../../services/emailQueue";
import { notifyReferenceAgreementRequested } from "./notifyReferenceAgreementRequested";

describe("notifyReferenceAgreementRequested", () => {
  const findUniqueOrThrow = vi.fn();
  const input = {
    referenceConfigurationId: "6d8aa609-4968-4819-b673-fb0db01b2039",
    triggeredByUserId: "91152df6-2ff7-4b5d-9346-4945213760b4",
    triggeredAt: new Date("2026-08-27T14:00:00.000Z"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      user: { findUniqueOrThrow },
    } as any);
    findUniqueOrThrow.mockResolvedValue({
      person: {
        firstName: "Dustin",
        lastName: "Horning",
        email: " dustin@example.com ",
      },
    });
    vi.mocked(enqueueEmail).mockResolvedValue("message-1");
  });

  it("queues identifiers and recipients without reference document data", async () => {
    await notifyReferenceAgreementRequested(input);

    expect(findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: input.triggeredByUserId },
      include: { person: true },
    });
    expect(enqueueEmail).toHaveBeenCalledExactlyOnceWith({
      emailType: "Terms And Conditions Requested",
      entityType: "reference",
      entityId: input.referenceConfigurationId,
      triggeredBy: {
        type: "realtime",
        id: input.triggeredByUserId,
      },
      triggeredAt: input.triggeredAt.toISOString(),
      idempotencyKey:
        "Terms And Conditions Requested:reference-agreement-acceptance:" +
        `${input.referenceConfigurationId}:${input.triggeredByUserId}:${input.triggeredAt.toISOString()}`,
      payload: {
        recipients: {
          to: [{ name: "Dustin Horning", address: "dustin@example.com" }],
        },
      },
    });
  });

  it("reports a missing registered email without queueing", async () => {
    findUniqueOrThrow.mockResolvedValue({
      person: { firstName: "Dustin", lastName: "Horning", email: " " },
    });

    await notifyReferenceAgreementRequested(input);

    expect(enqueueEmail).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: `Cannot queue Terms And Conditions Requested email: user ${input.triggeredByUserId} has no email address.`,
        }),
      }),
      "Failed to queue reference agreement email",
    );
  });
});
