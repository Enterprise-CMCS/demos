import { getS3Adapter } from "../../adapters";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope } from "../../services/emailQueue";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";

type TermsAndConditionsRequestedEmailInput = {
  referenceConfigurationId: string;
  referenceId: string;
  referenceName: string;
  referenceAgreementId: string;
  referenceAgreementName: string;
  referenceAgreementS3Path: string;
  acceptanceTimestamp: Date;
  triggeredByUserId: string;
};

export async function dispatchTermsAndConditionsRequestedEmail(
  input: TermsAndConditionsRequestedEmailInput,
): Promise<void> {
  try {
    const user = await prisma().user.findUniqueOrThrow({
      where: { id: input.triggeredByUserId },
      include: { person: true },
    });
    const emailAddress = user.person.email.trim();
    if (!emailAddress) {
      throw new Error(
        `Cannot dispatch Terms And Conditions Requested email for user ${input.triggeredByUserId}: ` +
          "the registered email address is blank.",
      );
    }

    const recipientName =
      `${user.person.firstName} ${user.person.lastName}`.trim();
    const attachmentFileName = await getS3Adapter().getDownloadFileName(
      input.referenceAgreementS3Path,
      input.referenceAgreementName,
    );
    const message = buildRealtimeEmailEnvelope({
      emailType: "Terms And Conditions Requested",
      entityType: "reference",
      entityId: input.referenceConfigurationId,
      triggeredById: input.triggeredByUserId,
      idempotencyKey:
        "Terms And Conditions Requested:reference-agreement-acceptance:" +
        `${input.referenceId}:${input.referenceAgreementId}:${input.triggeredByUserId}:` +
        input.acceptanceTimestamp.toISOString(),
      payload: {
        recipients: {
          to: [{ name: recipientName, address: emailAddress }],
        },
        referenceMaterial: {
          id: input.referenceId,
          name: input.referenceName,
        },
        termsAndConditions: {
          id: input.referenceAgreementId,
          name: input.referenceAgreementName,
          fileName: attachmentFileName,
          s3Path: input.referenceAgreementS3Path,
        },
      },
    });

    const messageId = await enqueueTrackedRealtimeEmail(message, undefined, [
      {
        personId: user.person.id,
        emailAddress,
      },
    ]);
    log.info(
      {
        messageId,
        referenceConfigurationId: input.referenceConfigurationId,
        emailType: "Terms And Conditions Requested",
      },
      "Reference agreement email dispatched",
    );
  } catch (error) {
    log.error(
      {
        error,
        referenceConfigurationId: input.referenceConfigurationId,
        emailType: "Terms And Conditions Requested",
      },
      "Failed to dispatch reference agreement email",
    );
  }
}
