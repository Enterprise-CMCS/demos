import { useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";

import { BudgetNeutralityValidationResult } from "demos-server";

export const BN_VALIDATION_MAX_ATTEMPTS = 30;
export const BN_VALIDATION_POLL_INTERVAL_MS = 2_000;

export const BN_VALIDATION_STATUS_QUERY = gql`
  query BnValidationStatus($documentId: ID!) {
    document(id: $documentId) {
      id
      budgetNeutralityValidation {
        status
        errors {
          code
          message
        }
      }
    }
  }
`;

const TERMINAL_STATUSES = new Set(["Succeeded", "Failed"]);

export const useBNValidationStatus = () => {
  const [getValidationStatus] = useLazyQuery<{
    document: { id: string; budgetNeutralityValidation: BudgetNeutralityValidationResult | null };
  }>(BN_VALIDATION_STATUS_QUERY, { fetchPolicy: "network-only" });

  const waitForBNValidation = async (
    documentId: string
  ): Promise<BudgetNeutralityValidationResult | null> => {
    let lastResult: BudgetNeutralityValidationResult | null = null;

    for (let attempt = 0; attempt < BN_VALIDATION_MAX_ATTEMPTS; attempt++) {
      const { data } = await getValidationStatus({ variables: { documentId } });
      lastResult = data?.document?.budgetNeutralityValidation ?? null;

      if (lastResult && TERMINAL_STATUSES.has(lastResult.status)) {
        return lastResult;
      }

      await new Promise((resolve) => setTimeout(resolve, BN_VALIDATION_POLL_INTERVAL_MS));
    }

    return lastResult;
  };

  return { waitForBNValidation };
};
