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
  notifyDeliverableDueDateUpdated,
  notifyDeliverableExtensionRequested,
  notifyPublicCommentAdded,
  notifyDeliverableCompleted,
  notifyDeliverableExtensionDecisionMade,
  notifyDeliverableResubmissionRequested,
  notifyDeliverableSubmitted,
} from "./notifyDeliverableEvent";

describe("deliverable event email notifications", () => {
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
      state: { name: "Maryland" },
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
    findUniqueOrThrow.mockImplementation(async (query) => ({
      ...deliverable,
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments:
          query.include.demonstration.include.demonstrationRoleAssignments.where?.roleId.in.includes(
            "Project Officer"
          )
            ? [
                {
                  person: {
                    id: "cms-contact-1",
                    firstName: "CMS",
                    lastName: "Contact",
                    email: "cms@example.com",
                  },
                },
              ]
            : deliverable.demonstration.demonstrationRoleAssignments,
      },
    }));
    vi.mocked(enqueueAndTrackRealtimeEmail).mockResolvedValue("message-1");
  });

  it("queues submitted emails for the CMS owner", async () => {
    await notifyDeliverableSubmitted(input);

    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Deliverable Submitted",
        entityType: "deliverable_action",
        entityId: deliverable.id,
        triggeredBy: {
          type: "realtime",
          id: input.triggeredByUserId,
        },
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              { name: "CMS Owner", address: "owner@example.com" },
              { name: "CMS Contact", address: "cms@example.com" },
            ],
          },
          demonstration: {
            id: deliverable.demonstration.id,
            name: deliverable.demonstration.name,
            stateName: deliverable.demonstration.state.name,
          },
          deliverable: expect.objectContaining({
            id: deliverable.id,
            dueDate: deliverable.dueDate.toISOString(),
            statusId: deliverable.statusId,
          }),
        }),
      }),
      { deliverableActionId: input.sourceActionId },
      [{ personId: deliverable.cmsOwner.person.id }, { personId: "cms-contact-1" }]
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

  it.each([
    [
      "Deliverable Due Date Updated",
      notifyDeliverableDueDateUpdated,
      "previousDueDate",
      ["state@example.com"],
    ],
    [
      "Extension Requested",
      notifyDeliverableExtensionRequested,
      "requestedDueDate",
      ["owner@example.com", "cms@example.com"],
    ],
  ] as const)(
    "queues %s with its event date and recipients",
    async (emailType, notify, dateKey, addresses) => {
      const date = new Date("2026-10-01T00:00:00Z");
      await notify({ ...input, previousDueDate: date, requestedDueDate: date });
      expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType,
          payload: expect.objectContaining({
            deliverable: expect.objectContaining({
              [dateKey]: date.toISOString(),
            }),
            recipients: {
              to: [],
              bcc: addresses.map((address) => expect.objectContaining({ address })),
            },
          }),
        }),
        { deliverableActionId: input.sourceActionId },
        expect.any(Array)
      );
    }
  );

  it("tracks each public comment separately and notifies CMS and state", async () => {
    findUniqueOrThrow.mockResolvedValue({ ...deliverable, statusId: "Accepted" });
    for (const publicCommentId of ["comment-1", "comment-2"]) {
      await notifyPublicCommentAdded({
        deliverableId: input.deliverableId,
        triggeredByUserId: input.triggeredByUserId,
        publicCommentId,
      });
      expect(enqueueAndTrackRealtimeEmail).toHaveBeenLastCalledWith(
        expect.objectContaining({ emailType: "Deliverable Comment", entityType: "public_comment" }),
        { publicCommentId },
        [{ personId: "cms-owner-1" }, { personId: "state-poc-1" }]
      );
    }
    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledTimes(2);
  });
  it.each(["Upcoming", "Submitted", "Under CMS Review", "Past Due"])(
    "does not notify comments on %s deliverables",
    async (statusId) => {
      findUniqueOrThrow.mockResolvedValue({ ...deliverable, statusId });
      await notifyPublicCommentAdded({
        deliverableId: input.deliverableId,
        publicCommentId: "comment-1",
        triggeredByUserId: input.triggeredByUserId,
      });
      expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
    }
  );

  it.each(["Accepted", "Approved", "Received and Filed"])(
    "notifies all contacts for comments on %s deliverables",
    async (statusId) => {
      findUniqueOrThrow.mockResolvedValue({
        ...deliverable,
        statusId,
        demonstration: {
          ...deliverable.demonstration,
          demonstrationRoleAssignments: [
            ...deliverable.demonstration.demonstrationRoleAssignments,
            {
              person: {
                id: "cms-contact-1",
                firstName: "CMS",
                lastName: "Contact",
                email: "cms@example.com",
              },
            },
          ],
        },
      });
      await notifyPublicCommentAdded({
        deliverableId: input.deliverableId,
        publicCommentId: "comment-1",
        triggeredByUserId: input.triggeredByUserId,
      });
      const query = findUniqueOrThrow.mock.calls[0][0];
      expect(query.include.demonstration.include.demonstrationRoleAssignments).not.toHaveProperty(
        "where"
      );
      expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledWith(
        expect.any(Object),
        { publicCommentId: "comment-1" },
        [{ personId: "cms-owner-1" }, { personId: "state-poc-1" }, { personId: "cms-contact-1" }]
      );
    }
  );
});
