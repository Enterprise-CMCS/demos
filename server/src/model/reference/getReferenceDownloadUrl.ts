import { getS3Adapter } from "../../adapters";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { insertReferenceAgreementAcceptance } from "../referenceAgreementAcceptance/queries";
import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";

export async function getReferenceDownloadUrl(
  parent: unknown,
  args: { id: string; acceptedAgreementId?: string },
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
  return getS3Adapter().getPresignedDownloadUrl(requestedReferenceConfiguration.reference.s3Path);
}
