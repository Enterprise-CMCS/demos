import { beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import {
  buildRealtimeEmailEnvelope,
  enqueueRealtimeEmail,
} from "../../services/emailQueue";
import { dispatchDeliverableSubmittedEmail } from "./deliverableEmail";

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  buildRealtimeEmailEnvelope: vi.fn(),
  enqueueRealtimeEmail: vi.fn(),
}));

describe("dispatchDeliverableSubmittedEmail", () => {
  const findUniqueOrThrow = vi.fn();
  const deliverable = {
    id: "deliverable-1",
    name: "Quarterly Report",
    deliverableTypeId: "Monitoring Report",
    dueDate: new Date("2026-08-01T03:59:59.999Z"),
    statusId: "Submitted",
    cmsOwner: {
      person: {
        id: "cms-owner-1",
        firstName: "CMS",
        lastName: "Owner",
        email: "cms.owner@example.com",
      },
    },
    demonstration: {
      id: "demonstration-1",
      name: "Example Demonstration",
      stateId: "MD",
    },
  };
  const envelope = {
    emailType: "Deliverable Submitted" as const,
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredBy: { type: "realtime" as const, id: "user-1" },
    triggeredAt: "2026-07-23T00:00:00.000Z",
    idempotencyKey: `Deliverable Submitted:deliverable:${deliverable.id}`,
    payload: {},
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      deliverable: { findUniqueOrThrow },
    } as any);
    findUniqueOrThrow.mockResolvedValue(deliverable);
    vi.mocked(buildRealtimeEmailEnvelope).mockReturnValue(envelope);
    vi.mocked(enqueueRealtimeEmail).mockResolvedValue("message-1");
  });

  it("sends submitted email to the CMS owner", async () => {
    await dispatchDeliverableSubmittedEmail({
      deliverableId: deliverable.id,
      triggeredByUserId: "user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Deliverable Submitted",
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredById: "user-1",
        payload: expect.objectContaining({
          recipients: {
            to: [
              {
                name: "CMS Owner",
                address: "cms.owner@example.com",
              },
            ],
          },
        }),
      })
    );
    expect(enqueueRealtimeEmail).toHaveBeenCalledExactlyOnceWith(envelope);
  });

  it("logs dispatch failures with deliverable context", async () => {
    findUniqueOrThrow.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      dispatchDeliverableSubmittedEmail({
        deliverableId: deliverable.id,
        triggeredByUserId: "user-1",
      })
    ).resolves.toBeUndefined();

    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: expect.any(Error),
        deliverableId: deliverable.id,
        emailType: "Deliverable Submitted",
      }),
      "Failed to dispatch deliverable email"
    );
  });
});
