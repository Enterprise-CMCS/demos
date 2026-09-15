import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../prismaClient";
import { log } from "../../log";
import { PrismaApplication } from "../application";
import { enqueueAndTrackRealtimeEmail } from "./emailNotification";
import {
  notifyApplicationDeemedComplete,
  notifyApplicationStatusUpdated,
} from "./notifyApplicationEvent";

vi.mock("../../prismaClient", () => ({ prisma: vi.fn() }));
vi.mock("../../log", () => ({ log: { error: vi.fn() } }));
vi.mock("./emailNotification", () => ({ enqueueAndTrackRealtimeEmail: vi.fn() }));

const findUniqueOrThrow = vi.fn();
const application = {
  id: "app-1",
  name: "Application title",
  applicationTypeId: "Demonstration",
  statusId: "Under Review",
  statusUpdatedAt: new Date("2026-09-15T14:30:00Z"),
} as PrismaApplication;
const person = {
  id: "person-1",
  firstName: "CMS",
  lastName: "Contact",
  email: "CMS@example.com",
};
const demonstration = {
  id: "demo-1",
  name: "Demo title",
  stateId: "MD",
  demonstrationRoleAssignments: [
    { person },
    { person: { ...person, id: "person-2", email: "cms@example.com " } },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma).mockReturnValue({
    demonstration: { findUniqueOrThrow },
  } as unknown as ReturnType<typeof prisma>);
  findUniqueOrThrow.mockResolvedValue(demonstration);
  vi.mocked(enqueueAndTrackRealtimeEmail).mockResolvedValue("message-1");
});

describe("application notifications", () => {
  it.each(["Demonstration", "Amendment", "Extension"])(
    "tracks %s status changes with deduplicated BCC recipients",
    async (applicationTypeId) => {
      const current = {
        ...application,
        applicationTypeId,
        ...(applicationTypeId !== "Demonstration" ? { demonstrationId: "demo-1" } : {}),
      };
      await notifyApplicationStatusUpdated(
        { ...current, statusId: "Pre-Submission" },
        current,
        "user-1"
      );
      expect(findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: applicationTypeId === "Demonstration" ? "app-1" : "demo-1" },
          include: {
            demonstrationRoleAssignments: {
              where: {
                OR: [
                  {
                    roleId: { in: expect.arrayContaining(["Project Officer", "DDME Analyst"]) },
                  },
                  { personTypeId: "demos-admin" },
                ],
              },
              include: { person: true },
            },
          },
        })
      );
      expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          emailType: "Application Status Updated",
          entityType: "application",
          entityId: "app-1",
          triggeredBy: { type: "realtime", id: "user-1" },
          payload: expect.objectContaining({
            application: expect.objectContaining({
              applicationTypeId,
              statusId: "Under Review",
            }),
            recipients: { to: [], bcc: [{ name: "CMS Contact", address: "cms@example.com" }] },
          }),
        }),
        { applicationId: "app-1" },
        [{ personId: "person-1" }]
      );
    }
  );

  it("does not notify when status is unchanged", async () => {
    await notifyApplicationStatusUpdated(application, application, "user-1");
    expect(findUniqueOrThrow).not.toHaveBeenCalled();
    expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
  });

  it("includes the deemed-complete date", async () => {
    const date = new Date("2026-09-15T04:00:00Z");
    await notifyApplicationDeemedComplete(application, date, "user-1");
    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        emailType: "Application Deemed Complete",
        payload: expect.objectContaining({
          application: expect.objectContaining({ deemedCompleteDate: date.toISOString() }),
        }),
      }),
      { applicationId: "app-1" },
      [{ personId: "person-1" }]
    );
  });

  it.each([{ assignments: [] }, { assignments: [{ person: { ...person, email: "invalid" } }] }])(
    "reports missing or invalid recipients",
    async ({ assignments }) => {
      findUniqueOrThrow.mockResolvedValue({
        ...demonstration,
        demonstrationRoleAssignments: assignments,
      });
      await notifyApplicationDeemedComplete(application, new Date(), "user-1");
      expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
      expect(log.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error), applicationId: "app-1" }),
        "Failed to queue application email"
      );
    }
  );

  it("logs queue failures without failing the saved application change", async () => {
    const error = new Error("queue unavailable");
    vi.mocked(enqueueAndTrackRealtimeEmail).mockRejectedValue(error);
    await expect(
      notifyApplicationDeemedComplete(application, new Date(), "user-1")
    ).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ error }),
      "Failed to queue application email"
    );
  });
});
