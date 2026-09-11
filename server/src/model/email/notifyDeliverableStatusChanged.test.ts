import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("./emailNotification", () => ({
  enqueueAndTrackRealtimeEmail: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueAndTrackRealtimeEmail } from "./emailNotification";
import {
  notifyDeliverableCompleted,
  notifyDeliverableExtensionDecisionMade,
  notifyDeliverableResubmissionRequested,
  notifyDeliverableSubmitted,
} from "./notifyDeliverableStatusChanged";

describe("deliverable status email notifications", () => {
  const findUniqueOrThrow = vi.fn();
  const input = {
    deliverableId: "deliverable-1",
    sourceActionId: "action-1",
    triggeredByUserId: "user-1",
  };
  const deliverable = {
    id: input.deliverableId,
    name: "Quarterly Report",
    deliverableTypeId: "Monitoring Report",
    dueDate: new Date("2026-09-30T23:59:59.999Z"),
    statusId: "Submitted",
    cmsOwner: {
      person: {
        id: "cms-owner-1",
        firstName: "CMS",
        lastName: "Owner",
        email: "owner@example.com",
      },
    },
    demonstration: {
      id: "demonstration-1",
      name: "Medicaid Demonstration",
      stateId: "MD",
      demonstrationRoleAssignments: [
        {
          person: {
            id: "state-poc-1",
            firstName: "State",
            lastName: "Contact",
            email: "state@example.com",
          },
        },
      ],
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      deliverable: { findUniqueOrThrow },
    } as never);
    findUniqueOrThrow.mockResolvedValue(deliverable);
    vi.mocked(enqueueAndTrackRealtimeEmail).mockResolvedValue("message-1");
  });

  it("queues submitted emails for the CMS owner", async () => {
    await notifyDeliverableSubmitted(input);

    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Deliverable Submitted",
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredBy: {
          type: "realtime",
          id: input.triggeredByUserId,
        },
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [{ name: "CMS Owner", address: "owner@example.com" }],
          },
          demonstration: {
            id: deliverable.demonstration.id,
            name: deliverable.demonstration.name,
            stateId: deliverable.demonstration.stateId,
          },
          deliverable: expect.objectContaining({
            id: deliverable.id,
            dueDate: deliverable.dueDate.toISOString(),
            statusId: deliverable.statusId,
          }),
        }),
      }),
      { deliverableActionId: input.sourceActionId },
      [{ personId: deliverable.cmsOwner.person.id }]
    );
  });

  it.each([
    ["Accepted", "Deliverable Accepted"],
    ["Approved", "Deliverable Approved"],
    ["Received and Filed", "Deliverable Received and Filed"],
  ] as const)("queues %s emails for State Points of Contact", async (finalStatus, emailType) => {
    await notifyDeliverableCompleted({ ...input, finalStatus });

    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType,
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [{ name: "State Contact", address: "state@example.com" }],
          },
        }),
      }),
      { deliverableActionId: input.sourceActionId },
      [{ personId: "state-poc-1" }]
    );
  });

  it("includes the previous due date in resubmission emails", async () => {
    const previousDueDate = new Date("2026-08-31T23:59:59.999Z");

    await notifyDeliverableResubmissionRequested({ ...input, previousDueDate });

    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Resubmission Requested",
        payload: expect.objectContaining({
          deliverable: expect.objectContaining({
            dueDate: deliverable.dueDate.toISOString(),
            previousDueDate: previousDueDate.toISOString(),
          }),
        }),
      }),
      { deliverableActionId: input.sourceActionId },
      [{ personId: "state-poc-1" }]
    );
  });

  it.each(["Approved", "Denied"] as const)(
    "queues extension %s decisions for State Points of Contact",
    async (extensionDecision) => {
      const previousDueDate = new Date("2026-08-31T23:59:59.999Z");

      await notifyDeliverableExtensionDecisionMade({
        ...input,
        extensionDecision,
        previousDueDate,
      });

      expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          emailType: "Extension Decision Made",
          payload: expect.objectContaining({
            recipients: {
              to: [],
              bcc: [{ name: "State Contact", address: "state@example.com" }],
            },
            deliverable: expect.objectContaining({
              dueDate: deliverable.dueDate.toISOString(),
              extensionDecision,
              previousDueDate: previousDueDate.toISOString(),
            }),
          }),
        }),
        { deliverableActionId: input.sourceActionId },
        [{ personId: "state-poc-1" }]
      );
    }
  );

  it("reports when a State Point of Contact cannot be found", async () => {
    findUniqueOrThrow.mockResolvedValue({
      ...deliverable,
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments: [],
      },
    });

    await notifyDeliverableCompleted({ ...input, finalStatus: "Approved" });

    expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({
          message:
            "Cannot queue Deliverable Approved email for deliverable deliverable-1: " +
            "no State Points of Contact were found on the demonstration.",
        }),
        deliverableId: input.deliverableId,
        emailType: "Deliverable Approved",
      },
      "Failed to queue deliverable email"
    );
  });

  it("reports an invalid recipient email without queueing", async () => {
    findUniqueOrThrow.mockResolvedValue({
      ...deliverable,
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments: [
          {
            person: {
              ...deliverable.demonstration.demonstrationRoleAssignments[0].person,
              email: "not-an-email",
            },
          },
        ],
      },
    });

    await notifyDeliverableCompleted({ ...input, finalStatus: "Approved" });

    expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({
          message:
            "Cannot queue Deliverable Approved email for deliverable deliverable-1: " +
            "person state-poc-1 does not have a valid email address.",
        }),
        deliverableId: input.deliverableId,
        emailType: "Deliverable Approved",
      },
      "Failed to queue deliverable email"
    );
  });

  it("reports queue failures without failing the deliverable operation", async () => {
    vi.mocked(enqueueAndTrackRealtimeEmail).mockRejectedValue(new Error("queue unavailable"));

    await expect(notifyDeliverableSubmitted(input)).resolves.toBeUndefined();

    expect(log.error).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({ message: "queue unavailable" }),
        deliverableId: input.deliverableId,
        emailType: "Deliverable Submitted",
      },
      "Failed to queue deliverable email"
    );
  });
});
