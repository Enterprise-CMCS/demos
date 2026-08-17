import { beforeEach, describe, expect, it, vi } from "vitest";
import { getS3Adapter } from "../../adapters";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope } from "../../services/emailQueue";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";
import { dispatchTermsAndConditionsRequestedEmail } from "./referenceEmail";

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../adapters", () => ({
  getS3Adapter: vi.fn(),
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

describe("reference agreement email dispatch", () => {
  const findUniqueOrThrow = vi.fn();
  const getDownloadFileName = vi.fn();
  const acceptanceTimestamp = new Date("2026-08-14T15:00:00.000Z");
  const input = {
    referenceConfigurationId: "reference-configuration-1",
    referenceId: "reference-1",
    referenceName: "National Quality Measures",
    referenceAgreementId: "reference-agreement-1",
    referenceAgreementName: "Point and Click Agreement",
    referenceAgreementS3Path: "reference-agreements/agreement-1",
    acceptanceTimestamp,
    triggeredByUserId: "user-1",
  };
  const user = {
    person: {
      id: "user-1",
      firstName: "Dustin",
      lastName: "Horning",
      email: " dustin@example.com ",
    },
  };
  const envelope = {
    emailType: "Terms And Conditions Requested" as const,
    entityType: "reference" as const,
    entityId: input.referenceConfigurationId,
    triggeredBy: { type: "realtime" as const, id: input.triggeredByUserId },
    triggeredAt: acceptanceTimestamp.toISOString(),
    idempotencyKey: "reference-email-1",
    payload: {},
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      user: { findUniqueOrThrow },
    } as any);
    findUniqueOrThrow.mockResolvedValue(user);
    vi.mocked(getS3Adapter).mockReturnValue({ getDownloadFileName } as any);
    getDownloadFileName.mockResolvedValue("Point and Click Agreement.pdf");
    vi.mocked(buildRealtimeEmailEnvelope).mockReturnValue(envelope);
    vi.mocked(enqueueTrackedRealtimeEmail).mockResolvedValue("message-1");
  });

  it("sends only to the requesting user's registered email and tracks it", async () => {
    await dispatchTermsAndConditionsRequestedEmail(input);

    expect(findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: input.triggeredByUserId },
      include: { person: true },
    });
    expect(getDownloadFileName).toHaveBeenCalledExactlyOnceWith(
      input.referenceAgreementS3Path,
      input.referenceAgreementName,
    );
    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledExactlyOnceWith({
      emailType: "Terms And Conditions Requested",
      entityType: "reference",
      entityId: input.referenceConfigurationId,
      triggeredById: input.triggeredByUserId,
      idempotencyKey:
        "Terms And Conditions Requested:reference-agreement-acceptance:" +
        `${input.referenceId}:${input.referenceAgreementId}:` +
        `${input.triggeredByUserId}:${acceptanceTimestamp.toISOString()}`,
      payload: {
        recipients: {
          to: [{ name: "Dustin Horning", address: "dustin@example.com" }],
        },
        referenceMaterial: {
          id: input.referenceId,
          name: input.referenceName,
        },
        termsAndConditions: {
          id: input.referenceAgreementId,
          name: input.referenceAgreementName,
          fileName: "Point and Click Agreement.pdf",
          s3Path: input.referenceAgreementS3Path,
        },
      },
    });
    expect(enqueueTrackedRealtimeEmail).toHaveBeenCalledExactlyOnceWith(
      envelope,
      undefined,
      [{ personId: "user-1", emailAddress: "dustin@example.com" }],
    );
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "message-1" }),
      "Reference agreement email dispatched",
    );
  });

  it("reports a blank registered email without queuing", async () => {
    findUniqueOrThrow.mockResolvedValue({
      person: { ...user.person, email: " " },
    });

    await dispatchTermsAndConditionsRequestedEmail(input);

    expect(enqueueTrackedRealtimeEmail).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining("registered email address is blank"),
        }),
      }),
      "Failed to dispatch reference agreement email",
    );
  });
});
