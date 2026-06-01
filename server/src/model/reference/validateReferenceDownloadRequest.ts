import { GraphQLError } from "graphql";
import { CustomInternalErrorCode } from "../../errors/errorCodes";
import { log } from "../../log";
import {
  SelectManyReferenceConfigurationsResult,
  selectReferenceConfiguration,
} from "../referenceConfiguration/queries";

export async function validateReferenceDownloadRequest(
  referenceConfigurationId: string,
  agreementId?: string
): Promise<SelectManyReferenceConfigurationsResult> {
  const referenceConfiguration = await selectReferenceConfiguration({
    id: referenceConfigurationId,
  });

  if (!referenceConfiguration) {
    log.info(`Reference "${referenceConfigurationId}" was requested, but could not be found.`);
    throw new GraphQLError(`Reference configuration ${referenceConfigurationId} not found.`, {
      extensions: {
        code: "REFERENCE_NOT_FOUND" satisfies CustomInternalErrorCode,
      },
    });
  }

  if (referenceConfiguration.statusId !== "Active") {
    log.info(`Reference "${referenceConfigurationId}" was requested, but is inactive.`);
    throw new GraphQLError(`Reference configuration ${referenceConfigurationId} not found.`, {
      extensions: {
        code: "REFERENCE_NOT_ACTIVE" satisfies CustomInternalErrorCode,
      },
    });
  }

  const referenceAgreementId = referenceConfiguration.referenceAgreement?.id;
  const errorMessage = "Cannot download requested reference using provided agreement ID.";

  if (!referenceAgreementId && agreementId) {
    log.info(
      `Reference "${referenceConfigurationId}" was requested using agreement "${agreementId}", ` +
        "but reference does not require agreement."
    );
    throw new GraphQLError(errorMessage, {
      extensions: {
        code: "REFERENCE_AGREEMENT_ERROR" satisfies CustomInternalErrorCode,
      },
    });
  }

  if (referenceAgreementId && !agreementId) {
    log.info(
      `Reference "${referenceConfigurationId}" was requested without an agreement, ` +
        `but an agreement with ID "${referenceAgreementId}" is required.`
    );
    throw new GraphQLError(errorMessage, {
      extensions: {
        code: "REFERENCE_AGREEMENT_ERROR" satisfies CustomInternalErrorCode,
      },
    });
  }

  if (referenceAgreementId && agreementId !== referenceAgreementId) {
    log.info(
      `Reference "${referenceConfigurationId}" was requested using agreement "${agreementId}" ` +
        `but the agreement required is "${referenceAgreementId}".`
    );
    throw new GraphQLError(errorMessage, {
      extensions: {
        code: "REFERENCE_AGREEMENT_ERROR" satisfies CustomInternalErrorCode,
      },
    });
  }

  return referenceConfiguration;
}
