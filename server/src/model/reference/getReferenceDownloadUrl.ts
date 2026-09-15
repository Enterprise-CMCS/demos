import { getS3Adapter } from "../../adapters";
import { GraphQLContext } from "../../auth";
import { log } from "../../log";
import { enqueueAndTrackRealtimeEmail } from "../email/emailNotification";
import { prisma } from "../../prismaClient";
import { insertReferenceAgreementAcceptance } from "../referenceAgreementAcceptance/queries";
import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";

export async function getReferenceDownloadUrl(
  parent: unknown,
  args: { id: string; acceptedAgreementId?: string; emailRequested?: boolean },
  context: GraphQLContext
): Promise<string> {
  const requestedReferenceConfiguration = await prisma().$transaction(async (tx) => {
    const validatedReferenceConfiguration = await validateReferenceDownloadRequest(
      args.id,
      tx,
      args.acceptedAgreementId
    );
    if (args.acceptedAgreementId) {
      // If we enter this block, we know there is a referenceAgreement on the configuration
      await insertReferenceAgreementAcceptance(
        {
          referenceId: validatedReferenceConfiguration.reference.id,
          referenceAgreementId: validatedReferenceConfiguration.referenceAgreement!.id,
          userId: context.user.id,
        },
        tx
      );
    }
    return validatedReferenceConfiguration;
  });
  if (args.acceptedAgreementId && args.emailRequested) {
    try {
      const [person, agreement] = await Promise.all([
        prisma().person.findUniqueOrThrow({ where: { id: context.user.id } }),
        prisma().referenceAgreement.findUniqueOrThrow({
          where: { id: args.acceptedAgreementId },
        }),
      ]);
      await enqueueAndTrackRealtimeEmail(
        {
          emailType: "Terms And Conditions Requested",
          entityType: "reference",
          entityId: requestedReferenceConfiguration.id,
          triggeredBy: { type: "realtime", id: context.user.id },
          payload: {
            recipients: { to: [person.email] },
            reference: { name: requestedReferenceConfiguration.reference.name },
            agreement: {
              id: agreement.id,
              name: agreement.name,
              s3Path: agreement.s3Path,
            },
          },
        },
        { referenceConfigurationId: requestedReferenceConfiguration.id },
        [{ personId: person.id }]
      );
    } catch (error) {
      log.error(
        { error, referenceConfigurationId: args.id, userId: context.user.id },
        "Unable to queue accepted reference agreement email"
      );
    }
  }
  return getS3Adapter().getPresignedDownloadUrl(
    requestedReferenceConfiguration.reference.s3Path,
    requestedReferenceConfiguration.reference.name,
    { disposition: "attachment" }
  );
}
