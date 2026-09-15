import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";
import { insertReferenceAgreementAcceptance } from "../referenceAgreementAcceptance/queries";
import { enqueueAndTrackRealtimeEmail } from "../email/emailNotification";
import { submitReferenceAgreement } from "./submitReferenceAgreement";

vi.mock("../../prismaClient", () => ({ prisma: vi.fn() }));
vi.mock("./validateReferenceDownloadRequest", () => ({
  validateReferenceDownloadRequest: vi.fn(),
}));
vi.mock("../referenceAgreementAcceptance/queries", () => ({
  insertReferenceAgreementAcceptance: vi.fn(),
}));
vi.mock("../email/emailNotification", () => ({
  enqueueAndTrackRealtimeEmail: vi.fn(),
}));
vi.mock("../../log", () => ({ log: { error: vi.fn() } }));
vi.mock("../../adapters", () => ({
  getS3Adapter: () => ({ getPresignedDownloadUrl: async () => "download-url" }),
}));

const configuration = {
  id: "configuration-id",
  reference: {
    id: "reference-id",
    name: "Reference.pdf",
    s3Path: "reference-key",
  },
};
const agreement = {
  id: "agreement-id",
  name: "Terms.pdf",
  s3Path: "agreement-key",
};
const context = { user: { id: "user-id" } } as GraphQLContext;
const args = {
  id: configuration.id,
  acceptedAgreementId: agreement.id,
  emailRequested: true,
};
const person = vi.fn();
const findAgreement = vi.fn();
const tx = {};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("DISABLE_EMAIL_NOTIFICATIONS", "false");
  vi.mocked(prisma).mockReturnValue({
    $transaction: async (fn: (tx: object) => unknown) => fn(tx),
    person: { findUniqueOrThrow: person },
    referenceAgreement: { findUniqueOrThrow: findAgreement },
  } as never);
  vi.mocked(validateReferenceDownloadRequest).mockResolvedValue(configuration as never);
  person.mockResolvedValue({ id: "user-id", email: "registered@example.test" });
  findAgreement.mockResolvedValue(agreement);
  vi.mocked(enqueueAndTrackRealtimeEmail).mockResolvedValue("sqs-id");
});
afterEach(() => vi.unstubAllEnvs());

describe("submitReferenceAgreement", () => {
  it("records acceptance and queues the configuration's agreement for the registered user", async () => {
    await expect(submitReferenceAgreement(null, args, context)).resolves.toEqual({
      downloadUrl: "download-url",
      emailRequestStatus: "QUEUED",
    });
    expect(validateReferenceDownloadRequest).toHaveBeenCalledWith(
      configuration.id,
      tx,
      agreement.id
    );
    expect(insertReferenceAgreementAcceptance).toHaveBeenCalledWith(
      {
        referenceId: "reference-id",
        referenceAgreementId: agreement.id,
        userId: "user-id",
      },
      tx
    );
    expect(person).toHaveBeenCalledWith({ where: { id: "user-id" } });
    expect(findAgreement).toHaveBeenCalledWith({ where: { id: agreement.id } });
    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledWith(
      {
        emailType: "Terms And Conditions Requested",
        entityType: "reference",
        entityId: configuration.id,
        triggeredBy: { type: "realtime", id: "user-id" },
        payload: {
          recipients: { to: ["registered@example.test"] },
          reference: { name: "Reference.pdf" },
          agreement,
        },
      },
      { referenceConfigurationId: configuration.id },
      [{ personId: "user-id" }]
    );
  });

  it("records acceptance without requesting email when not opted in", async () => {
    await expect(
      submitReferenceAgreement(null, { ...args, emailRequested: false }, context)
    ).resolves.toMatchObject({ emailRequestStatus: "NOT_REQUESTED" });
    expect(insertReferenceAgreementAcceptance).toHaveBeenCalledOnce();
    expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
    expect(person).not.toHaveBeenCalled();
  });

  it("returns a download and failed email status after a queue error", async () => {
    vi.mocked(enqueueAndTrackRealtimeEmail).mockRejectedValue(new Error("SQS unavailable"));
    await expect(submitReferenceAgreement(null, args, context)).resolves.toEqual({
      downloadUrl: "download-url",
      emailRequestStatus: "FAILED",
    });
    expect(insertReferenceAgreementAcceptance).toHaveBeenCalledOnce();
  });

  it("reports disabled notifications without queueing", async () => {
    vi.stubEnv("DISABLE_EMAIL_NOTIFICATIONS", "true");
    await expect(submitReferenceAgreement(null, args, context)).resolves.toMatchObject({
      emailRequestStatus: "DISABLED",
    });
    expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
  });

  it.each(["inactive configuration", "mismatched agreement"])(
    "rejects %s before acceptance or email",
    async (reason) => {
      vi.mocked(validateReferenceDownloadRequest).mockRejectedValue(new Error(reason));
      await expect(submitReferenceAgreement(null, args, context)).rejects.toThrow(reason);
      expect(insertReferenceAgreementAcceptance).not.toHaveBeenCalled();
      expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
    }
  );
});
