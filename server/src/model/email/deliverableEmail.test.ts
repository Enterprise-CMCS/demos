import { beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope } from "../../services/emailQueue";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";
import {
  dispatchDeliverableCompletedEmail,
  dispatchDeliverableCreatedEmail,
  dispatchMultipleDeliverablesCreatedEmail,
  dispatchDeliverableDueDateUpdatedEmail,
  dispatchDeliverableSubmittedEmail,
  dispatchExtensionDecisionMadeEmail,
  dispatchExtensionRequestedEmail,
  dispatchPublicCommentAddedEmail,
  dispatchResubmissionRequestedEmail,
} from "./deliverableEmail";

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
}));

vi.mock("./emailNotification", () => ({
  enqueueTrackedRealtimeEmail: vi.fn(),
}));

describe("deliverable email dispatch", () => {
  const findUniqueOrThrow = vi.fn();
  const findMany = vi.fn();
  const sourceActionId = "action-1";
  const deliverable = {
    id: "deliverable-1",
    demonstrationId: "demonstration-1",
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
      demonstrationRoleAssignments: [
        {
          roleId: "Project Officer",
          person: {
            id: "cms-owner-1",
            firstName: "CMS",
            lastName: "Owner",
            email: "CMS.Owner@example.com",
          },
        },
        {
          roleId: "DDME Analyst",
          person: {
            id: "cms-contact-1",
            firstName: "CMS",
            lastName: "Contact",
            email: "cms.contact@example.com",
          },
        },
      ],
    },
  };
  const envelope = {
    emailType: "Deliverable Submitted" as const,
    entityType: "deliverable" as const,
    entityId: deliverable.id,
    triggeredBy: { type: "realtime" as const, id: "user-1" },
    triggeredAt: "2026-07-23T00:00:00.000Z",
    idempotencyKey: `Deliverable Submitted:deliverable:${deliverable.id}`,
    payload: {},
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      deliverable: { findUniqueOrThrow, findMany },
    } as any);
    findUniqueOrThrow.mockResolvedValue(deliverable);
    findMany.mockResolvedValue([deliverable]);
    vi.mocked(buildRealtimeEmailEnvelope).mockReturnValue(envelope);
    vi.mocked(enqueueTrackedRealtimeEmail).mockResolvedValue("message-1");
  });

  it("BCCs the CMS owner for a submitted deliverable", async () => {
    await dispatchDeliverableSubmittedEmail({
      deliverableId: deliverable.id,
      sourceActionId,
      triggeredByUserId: "user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Deliverable Submitted",
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredById: "user-1",
        idempotencyKey: `Deliverable Submitted:deliverable-action:${sourceActionId}`,
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              {
                name: "CMS Owner",
                address: "cms.owner@example.com",
              },
            ],
          },
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      sourceActionId,
      [
        {
          personId: "cms-owner-1",
          emailAddress: "cms.owner@example.com",
        },
      ]
    );
  });

  it("BCCs the CMS owner when a state user requests an extension", async () => {
    const requestedDueDate = new Date("2026-09-01T03:59:59.999Z");

    await dispatchExtensionRequestedEmail({
      deliverableId: deliverable.id,
      requestedDueDate,
      sourceActionId,
      triggeredByUserId: "state-user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Extension Requested",
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredById: "state-user-1",
        idempotencyKey: `Extension Requested:deliverable-action:${sourceActionId}`,
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              {
                name: "CMS Owner",
                address: "cms.owner@example.com",
              },
            ],
          },
          deliverable: expect.objectContaining({
            dueDate: deliverable.dueDate.toISOString(),
            requestedDueDate: requestedDueDate.toISOString(),
          }),
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      sourceActionId,
      [
        {
          personId: "cms-owner-1",
          emailAddress: "cms.owner@example.com",
        },
      ]
    );
  });

  it("BCCs all demonstration contacts and the CMS owner for a public comment", async () => {
    await dispatchPublicCommentAddedEmail({
      deliverableId: deliverable.id,
      publicCommentId: "public-comment-1",
      triggeredByUserId: "state-user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Public Comment Added",
        idempotencyKey: "Public Comment Added:public-comment:public-comment-1",
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              { name: "CMS Owner", address: "cms.owner@example.com" },
              { name: "CMS Contact", address: "cms.contact@example.com" },
            ],
          },
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      undefined,
      [
        { personId: "cms-owner-1", emailAddress: "cms.owner@example.com" },
        { personId: "cms-contact-1", emailAddress: "cms.contact@example.com" },
      ]
    );
  });

  it("includes the CMS owner when the demonstration contact list does not", async () => {
    findUniqueOrThrow.mockResolvedValueOnce({
      ...deliverable,
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments: [
          {
            roleId: "State Point of Contact",
            person: {
              id: "state-poc-1",
              firstName: "State",
              lastName: "POC",
              email: "state.poc@example.com",
            },
          },
        ],
      },
    });

    await dispatchPublicCommentAddedEmail({
      deliverableId: deliverable.id,
      publicCommentId: "public-comment-1",
      triggeredByUserId: "cms-user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Public Comment Added",
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              { name: "CMS Owner", address: "cms.owner@example.com" },
              { name: "State POC", address: "state.poc@example.com" },
            ],
          },
        }),
      })
    );
  });

  it("BCCs the CMS owner and demonstration CMS contacts for a created deliverable", async () => {
    await dispatchDeliverableCreatedEmail({
      deliverableId: deliverable.id,
      sourceActionId,
      triggeredByUserId: "user-1",
    });

    expect(findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: { id: deliverable.id },
        include: expect.objectContaining({
          demonstration: {
            include: {
              demonstrationRoleAssignments: {
                where: {
                  roleId: {
                    in: [
                      "Project Officer",
                      "DDME Analyst",
                      "Policy Technical Director",
                      "Monitoring & Evaluation Technical Director",
                    ],
                  },
                },
                include: { person: true },
              },
            },
          },
        }),
      })
    );
    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Deliverable Created",
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredById: "user-1",
        idempotencyKey: `Deliverable Created:deliverable-action:${sourceActionId}`,
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              {
                name: "CMS Owner",
                address: "cms.owner@example.com",
              },
              {
                name: "CMS Contact",
                address: "cms.contact@example.com",
              },
            ],
          },
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      sourceActionId,
      [
        {
          personId: "cms-owner-1",
          emailAddress: "cms.owner@example.com",
        },
        {
          personId: "cms-contact-1",
          emailAddress: "cms.contact@example.com",
        },
      ]
    );
  });

  it("queues one tracked email for multiple created deliverables", async () => {
    const secondDeliverable = {
      ...deliverable,
      id: "deliverable-2",
      name: "DY1Q2 Quarterly Report",
      dueDate: new Date("2026-11-01T03:59:59.999Z"),
    };
    findMany.mockResolvedValueOnce([secondDeliverable, deliverable]);

    await dispatchMultipleDeliverablesCreatedEmail({
      deliverableIds: [deliverable.id, secondDeliverable.id],
      triggeredByUserId: "user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Multiple Deliverables Created",
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredById: "user-1",
        idempotencyKey:
          "Multiple Deliverables Created:deliverables:deliverable-1,deliverable-2",
        payload: expect.objectContaining({
          deliverables: [
            expect.objectContaining({ id: deliverable.id, name: deliverable.name }),
            expect.objectContaining({
              id: secondDeliverable.id,
              name: secondDeliverable.name,
            }),
          ],
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      undefined,
      [
        {
          personId: "cms-owner-1",
          emailAddress: "cms.owner@example.com",
        },
        {
          personId: "cms-contact-1",
          emailAddress: "cms.contact@example.com",
        },
      ]
    );
  });

  it("BCCs all State POCs when a deliverable due date is updated", async () => {
    const previousDueDate = new Date("2026-07-01T03:59:59.999Z");
    findUniqueOrThrow.mockResolvedValueOnce({
      ...deliverable,
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments: [
          {
            roleId: "State Point of Contact",
            person: {
              id: "state-poc-1",
              firstName: "State",
              lastName: "POC One",
              email: "state.one@example.com",
            },
          },
          {
            roleId: "State Point of Contact",
            person: {
              id: "state-poc-2",
              firstName: "State",
              lastName: "POC Two",
              email: "state.two@example.com",
            },
          },
        ],
      },
    });

    await dispatchDeliverableDueDateUpdatedEmail({
      deliverableId: deliverable.id,
      previousDueDate,
      sourceActionId,
      triggeredByUserId: "user-1",
    });

    expect(findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: deliverable.id },
      include: {
        demonstration: {
          include: {
            demonstrationRoleAssignments: {
              where: {
                roleId: { in: ["State Point of Contact"] },
              },
              include: { person: true },
            },
          },
        },
      },
    });
    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Deliverable Due Date Updated",
        idempotencyKey: `Deliverable Due Date Updated:deliverable-action:${sourceActionId}`,
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              { name: "State POC One", address: "state.one@example.com" },
              { name: "State POC Two", address: "state.two@example.com" },
            ],
          },
          deliverable: expect.objectContaining({
            dueDate: deliverable.dueDate.toISOString(),
            previousDueDate: previousDueDate.toISOString(),
          }),
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      sourceActionId,
      [
        { personId: "state-poc-1", emailAddress: "state.one@example.com" },
        { personId: "state-poc-2", emailAddress: "state.two@example.com" },
      ]
    );
  });

  it("BCCs all State POCs when a resubmission is requested", async () => {
    const previousDueDate = new Date("2026-07-01T03:59:59.999Z");
    findUniqueOrThrow.mockResolvedValueOnce({
      ...deliverable,
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments: [
          {
            roleId: "State Point of Contact",
            person: {
              id: "state-poc-1",
              firstName: "State",
              lastName: "POC",
              email: "state.poc@example.com",
            },
          },
        ],
      },
    });

    await dispatchResubmissionRequestedEmail({
      deliverableId: deliverable.id,
      previousDueDate,
      sourceActionId,
      triggeredByUserId: "user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType: "Resubmission Requested",
        idempotencyKey: `Resubmission Requested:deliverable-action:${sourceActionId}`,
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [{ name: "State POC", address: "state.poc@example.com" }],
          },
          deliverable: expect.objectContaining({
            dueDate: deliverable.dueDate.toISOString(),
            previousDueDate: previousDueDate.toISOString(),
          }),
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      sourceActionId,
      [{ personId: "state-poc-1", emailAddress: "state.poc@example.com" }]
    );
  });

  it.each(["Approved", "Denied"] as const)(
    "BCCs all State POCs when an extension is %s",
    async (extensionDecision) => {
      const previousDueDate = new Date("2026-07-01T03:59:59.999Z");
      findUniqueOrThrow.mockResolvedValueOnce({
        ...deliverable,
        demonstration: {
          ...deliverable.demonstration,
          demonstrationRoleAssignments: [
            {
              roleId: "State Point of Contact",
              person: {
                id: "state-poc-1",
                firstName: "State",
                lastName: "POC",
                email: "state.poc@example.com",
              },
            },
          ],
        },
      });

      await dispatchExtensionDecisionMadeEmail({
        deliverableId: deliverable.id,
        extensionDecision,
        previousDueDate,
        sourceActionId,
        triggeredByUserId: "user-1",
      });

      expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          emailType: "Extension Decision Made",
          idempotencyKey: `Extension Decision Made:deliverable-action:${sourceActionId}`,
          payload: expect.objectContaining({
            recipients: {
              to: [],
              bcc: [{ name: "State POC", address: "state.poc@example.com" }],
            },
            deliverable: expect.objectContaining({
              dueDate: deliverable.dueDate.toISOString(),
              previousDueDate: previousDueDate.toISOString(),
              extensionDecision,
            }),
          }),
        })
      );
      expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
        envelope,
        sourceActionId,
        [{ personId: "state-poc-1", emailAddress: "state.poc@example.com" }]
      );
    }
  );

  it.each([
    ["Accepted", "Deliverable Accepted"],
    ["Approved", "Deliverable Approved"],
    ["Received and Filed", "Deliverable Received and Filed"],
  ] as const)("queues the %s completion email for all State POCs", async (finalStatus, emailType) => {
    findUniqueOrThrow.mockResolvedValueOnce({
      ...deliverable,
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments: [
          {
            roleId: "State Point of Contact",
            person: {
              id: "state-poc-1",
              firstName: "State",
              lastName: "POC",
              email: "state.poc@example.com",
            },
          },
        ],
      },
    });

    await dispatchDeliverableCompletedEmail({
      deliverableId: deliverable.id,
      finalStatus,
      sourceActionId,
      triggeredByUserId: "user-1",
    });

    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        emailType,
        idempotencyKey: `${emailType}:deliverable-action:${sourceActionId}`,
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [{ name: "State POC", address: "state.poc@example.com" }],
          },
        }),
      })
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      sourceActionId,
      [{ personId: "state-poc-1", emailAddress: "state.poc@example.com" }]
    );
  });

  it("logs created email failures without rejecting", async () => {
    findUniqueOrThrow.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      dispatchDeliverableCreatedEmail({
        deliverableId: deliverable.id,
        sourceActionId,
        triggeredByUserId: "user-1",
      })
    ).resolves.toBeUndefined();

    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: expect.any(Error),
        deliverableId: deliverable.id,
        emailType: "Deliverable Created",
      }),
      "Failed to dispatch deliverable email"
    );
  });

  it("logs created email queue failures without rejecting", async () => {
    vi.mocked(enqueueTrackedRealtimeEmail).mockRejectedValueOnce(
      new Error("queue unavailable")
    );

    await expect(
      dispatchDeliverableCreatedEmail({
        deliverableId: deliverable.id,
        sourceActionId,
        triggeredByUserId: "user-1",
      })
    ).resolves.toBeUndefined();

    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: "queue unavailable" }),
        deliverableId: deliverable.id,
        emailType: "Deliverable Created",
      }),
      "Failed to dispatch deliverable email"
    );
  });

  it("logs missing created email recipient addresses without queueing", async () => {
    findUniqueOrThrow.mockResolvedValueOnce({
      ...deliverable,
      cmsOwner: {
        person: {
          ...deliverable.cmsOwner.person,
          email: " ",
        },
      },
    });

    await dispatchDeliverableCreatedEmail({
      deliverableId: deliverable.id,
      sourceActionId,
      triggeredByUserId: "user-1",
    });

    expect(enqueueTrackedRealtimeEmail).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining("person cms-owner-1 has no email address"),
        }),
        emailType: "Deliverable Created",
      }),
      "Failed to dispatch deliverable email"
    );
  });

  it("logs dispatch failures with deliverable context", async () => {
    findUniqueOrThrow.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      dispatchDeliverableSubmittedEmail({
        deliverableId: deliverable.id,
        sourceActionId,
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
