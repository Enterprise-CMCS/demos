import { getS3Adapter } from "../../adapters";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { dispatchTermsAndConditionsRequestedEmail } from "../email";
import { insertReferenceAgreementAcceptance } from "../referenceAgreementAcceptance/queries";
import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";

export async function getReferenceDownloadUrl(
  parent: unknown,
  args: { id: string; acceptedAgreementId?: string; emailAgreement?: boolean },
  context: GraphQLContext
): Promise<string> {
  if (args.emailAgreement && !args.acceptedAgreementId) {
    throw new Error(
      "Cannot email a reference agreement without accepting the agreement."
    );
  }

  const { requestedReferenceConfiguration, acceptanceTimestamp } =
    await prisma().$transaction(async (tx) => {
      const validatedReferenceConfiguration = await validateReferenceDownloadRequest(
        args.id,
        tx,
        args.acceptedAgreementId
      );
      let acceptanceTimestamp: Date | undefined;
      if (args.acceptedAgreementId) {
        // If we enter this block, we know there is a referenceAgreement on the configuration
        const acceptance = await insertReferenceAgreementAcceptance(
          {
            referenceId: validatedReferenceConfiguration.reference.id,
            referenceAgreementId: validatedReferenceConfiguration.referenceAgreement!.id,
            userId: context.user.id,
          },
          tx
        );
        acceptanceTimestamp = acceptance.acceptanceTimestamp;
      }
      return {
        requestedReferenceConfiguration: validatedReferenceConfiguration,
        acceptanceTimestamp,
      };
    });

  if (args.emailAgreement && acceptanceTimestamp) {
    const agreement = requestedReferenceConfiguration.referenceAgreement!;
    await dispatchTermsAndConditionsRequestedEmail({
      referenceConfigurationId: requestedReferenceConfiguration.id,
      referenceId: requestedReferenceConfiguration.reference.id,
      referenceName: requestedReferenceConfiguration.reference.name,
      referenceAgreementId: agreement.id,
      referenceAgreementName: agreement.name,
      referenceAgreementS3Path: agreement.s3Path,
      acceptanceTimestamp,
      triggeredByUserId: context.user.id,
    });
  }

  return getS3Adapter().getPresignedDownloadUrl(
    requestedReferenceConfiguration.reference.s3Path,
    requestedReferenceConfiguration.reference.name,
    { disposition: "attachment" }
  );
}
