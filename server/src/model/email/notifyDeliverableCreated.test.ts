import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("./emailNotification", () => ({
  enqueueTrackedRealtimeEmail: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { CMS_USER_DEMONSTRATION_ROLES } from "../../constants";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";
import { notifyDeliverableCreated } from "./notifyDeliverableCreated";

describe("notifyDeliverableCreated", () => {
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
    statusId: "Upcoming",
    cmsOwner: {
      person: {
        id: "owner-1",
        firstName: "CMS",
        lastName: "Owner",
        email: "Owner@example.com",
      },
    },
    demonstration: {
      id: "demonstration-1",
      name: "Medicaid Demonstration",
      stateId: "MD",
      demonstrationRoleAssignments: [
        {
          person: {
            id: "duplicate-owner",
            firstName: "Duplicate",
            lastName: "Owner",
            email: "owner@example.com",
          },
        },
        {
          person: {
            id: "project-officer",
            firstName: "Project",
            lastName: "Officer",
            email: "officer@example.com",
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
    vi.mocked(enqueueTrackedRealtimeEmail).mockResolvedValue("message-1");
  });

  it("queues one email with the deliverable and deduplicated recipients", async () => {
    await notifyDeliverableCreated(input);

    expect(findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        include: expect.objectContaining({
          demonstration: {
            include: {
              demonstrationRoleAssignments: {
                where: {
                  roleId: { in: Array.from(CMS_USER_DEMONSTRATION_ROLES) },
                },
                include: { person: true },
              },
            },
          },
        }),
      }),
    );
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      {
        emailType: "Deliverable Created",
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredBy: {
          type: "realtime",
          id: input.triggeredByUserId,
        },
        payload: {
          recipients: {
            to: [],
            bcc: [
              { name: "CMS Owner", address: "owner@example.com" },
              { name: "Project Officer", address: "officer@example.com" },
            ],
          },
          demonstration: {
            id: deliverable.demonstration.id,
            name: deliverable.demonstration.name,
            stateId: deliverable.demonstration.stateId,
          },
          deliverable: {
            id: deliverable.id,
            name: deliverable.name,
            deliverableTypeId: deliverable.deliverableTypeId,
            dueDate: deliverable.dueDate.toISOString(),
            statusId: deliverable.statusId,
          },
        },
      },
      { deliverableActionId: input.sourceActionId },
      [{ personId: "owner-1" }, { personId: "project-officer" }],
    );
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: "message-1",
        deliverableId: deliverable.id,
      }),
      "Deliverable email queued",
    );
  });

  it("reports a missing recipient email without queueing", async () => {
    findUniqueOrThrow.mockResolvedValue({
      ...deliverable,
      cmsOwner: {
        person: {
          ...deliverable.cmsOwner.person,
          email: " ",
        },
      },
      demonstration: {
        ...deliverable.demonstration,
        demonstrationRoleAssignments: [],
      },
    });

    await notifyDeliverableCreated(input);

    expect(enqueueTrackedRealtimeEmail).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message:
            "Cannot queue Deliverable Created email: person owner-1 has no email address.",
        }),
      }),
      "Failed to queue deliverable email",
    );
  });
});
