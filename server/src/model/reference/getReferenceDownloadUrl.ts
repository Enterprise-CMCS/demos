import { getS3Adapter } from "../../adapters";
import { GraphQLContext } from "../../auth";
import { insertReferenceAgreementAcceptance } from "../referenceAgreementAcceptance/queries";
import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";

export async function getReferenceDownloadUrl(
  parent: unknown,
  args: { id: string; acceptedAgreementId?: string },
  context: GraphQLContext
): Promise<string> {
  const requestedReferenceConfiguration = await validateReferenceDownloadRequest(
    args.id,
    args.acceptedAgreementId
  );
  if (args.acceptedAgreementId) {
    // If we enter this block, we know there is a referenceAgreement on the configuration
    await insertReferenceAgreementAcceptance({
      referenceId: requestedReferenceConfiguration.reference.id,
      referenceAgreementId: requestedReferenceConfiguration.referenceAgreement!.id,
      userId: context.user.id,
    });
  }
  return getS3Adapter().getPresignedDownloadUrl(requestedReferenceConfiguration.reference.s3Path);
}
