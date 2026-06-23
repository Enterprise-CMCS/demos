import { useEffect, useState } from "react";

import { BudgetNeutralityValidationError, DocumentType } from "demos-server";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "demos-server-constants";

const PARSE_ERROR: BudgetNeutralityValidationError = {
  code: "PARSE_ERROR",
  message: "Unable to read the workbook. Please upload a valid .xlsx file.",
};

const buildRuleError = (cause: unknown): BudgetNeutralityValidationError => ({
  code: "RULE_ERROR",
  message:
    cause instanceof Error
      ? `Workbook is missing expected structure: ${cause.message}.`
      : "Workbook is missing expected structure.",
});

export type BNPreValidationState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "valid" }
  | { status: "invalid"; errors: BudgetNeutralityValidationError[] };

const IDLE: BNPreValidationState = { status: "idle" };

export const useBNWorkbookPreValidation = (
  file: File | null,
  documentType: DocumentType
): BNPreValidationState => {
  const [state, setState] = useState<BNPreValidationState>(IDLE);

  useEffect(() => {
    if (!file || documentType !== BN_WORKBOOK_DOCUMENT_TYPE) {
      setState(IDLE);
      return;
    }

    let cancelled = false;
    setState({ status: "validating" });

    (async () => {
      const [{ parseBNFile }, { validations }] = await Promise.all([
        import("demos-shared-library/dist/src/BN/index.js"),
        import("demos-shared-library/dist/src/BN/rulesets/v1/index.js"),
      ]);

      let data;
      try {
        data = await parseBNFile(file);
      } catch (parseError) {
        if (cancelled) return;
        console.error("BN workbook parse failed:", parseError);
        setState({ status: "invalid", errors: [PARSE_ERROR] });
        return;
      }

      // Run each rule independently so one rule throwing doesn't suppress the rest.
      const errors: BudgetNeutralityValidationError[] = [];
      for (const rule of validations) {
        try {
          const error = rule(data);
          if (error) errors.push(error);
        } catch (ruleError) {
          console.error("BN validation rule threw:", ruleError);
          errors.push(buildRuleError(ruleError));
        }
      }

      if (cancelled) return;
      setState(errors.length === 0 ? { status: "valid" } : { status: "invalid", errors });
    })();

    return () => {
      cancelled = true;
    };
  }, [file, documentType]);

  return state;
};
