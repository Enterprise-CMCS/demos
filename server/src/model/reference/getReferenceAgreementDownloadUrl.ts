import { GraphQLError } from "graphql";
import { getS3Adapter } from "../../adapters";
import { log } from "../../log";
import { selectReferenceAgreement } from "../referenceAgreement/queries";
import { CustomInternalErrorCode } from "../../errors/errorCodes";

export async function getReferenceAgreementDownloadUrl(
  parent: unknown,
  args: { id: string }
): Promise<string> {
  const referenceAgreement = await selectReferenceAgreement({
    id: args.id,
  });

  if (!referenceAgreement) {
    log.info(`Reference agreement "${args.id}" was requested, but could not be found.`);
    throw new GraphQLError(`Reference agreement ${args.id} not found.`, {
      extensions: {
        code: "REFERENCE_AGREEMENT_NOT_FOUND" satisfies CustomInternalErrorCode,
      },
    });
  }

  if (!referenceAgreement.inActiveUse) {
    log.info(
      `Reference agreement "${args.id}" was requested but is not assigned to any active reference configurations.`
    );
    throw new GraphQLError(`Reference agreement ${args.id} not found.`, {
      extensions: {
        code: "REFERENCE_AGREEMENT_NOT_ACTIVE" satisfies CustomInternalErrorCode,
      },
    });
  }

  return getS3Adapter().getPresignedDownloadUrl(referenceAgreement.s3Path, referenceAgreement.name, {
    disposition: "attachment",
  });
}
