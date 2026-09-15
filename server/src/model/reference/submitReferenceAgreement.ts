import { getS3Adapter } from "../../adapters";
import { GraphQLContext } from "../../auth";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueAndTrackRealtimeEmail } from "../email/emailNotification";
import { insertReferenceAgreementAcceptance } from "../referenceAgreementAcceptance/queries";
import { SubmitReferenceAgreementResult } from "./referenceSchema";
import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";

export async function submitReferenceAgreement(
  parent: unknown,
  args: { id: string; acceptedAgreementId: string; emailRequested: boolean },
  context: GraphQLContext
): Promise<SubmitReferenceAgreementResult> {
  const configuration = await prisma().$transaction(async (tx) => {
    const configuration = await validateReferenceDownloadRequest(
      args.id,
      tx,
      args.acceptedAgreementId
    );
    await insertReferenceAgreementAcceptance(
      {
        referenceId: configuration.reference.id,
        referenceAgreementId: args.acceptedAgreementId,
        userId: context.user.id,
      },
      tx
    );
    return configuration;
  });

  let emailRequestStatus: SubmitReferenceAgreementResult["emailRequestStatus"] = "NOT_REQUESTED";
  if (args.emailRequested) {
    if (process.env.DISABLE_EMAIL_NOTIFICATIONS === "true") {
      emailRequestStatus = "DISABLED";
    } else {
      try {
        const [person, agreement] = await Promise.all([
          prisma().person.findUniqueOrThrow({ where: { id: context.user.id } }),
          prisma().referenceAgreement.findUniqueOrThrow({
            where: { id: args.acceptedAgreementId },
          }),
        ]);
        const messageId = await enqueueAndTrackRealtimeEmail(
          {
            emailType: "Terms And Conditions Requested",
            entityType: "reference",
            entityId: configuration.id,
            triggeredBy: { type: "realtime", id: context.user.id },
            payload: {
              recipients: { to: [person.email] },
              reference: { name: configuration.reference.name },
              agreement: {
                id: agreement.id,
                name: agreement.name,
                s3Path: agreement.s3Path,
              },
            },
          },
          { referenceConfigurationId: configuration.id },
          [{ personId: person.id }]
        );
        emailRequestStatus = messageId === null ? "DISABLED" : "QUEUED";
      } catch (error) {
        log.error(
          { error, referenceConfigurationId: args.id, userId: context.user.id },
          "Unable to queue accepted reference agreement email"
        );
        emailRequestStatus = "FAILED";
      }
    }
  }

  const downloadUrl = await getS3Adapter().getPresignedDownloadUrl(
    configuration.reference.s3Path,
    configuration.reference.name,
    { disposition: "attachment" }
  );
  return { downloadUrl, emailRequestStatus };
}
