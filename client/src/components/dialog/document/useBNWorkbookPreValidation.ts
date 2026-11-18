import { useEffect, useState } from "react";

import { BudgetNeutralityValidationError, DocumentType } from "demos-server";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "demos-server-constants";

const PARSE_ERROR: BudgetNeutralityValidationError = {
  code: "PARSE_ERROR",
  message: "Unable to read the workbook. Please upload a valid .xlsx file.",
};

const VALIDATION_ERROR: BudgetNeutralityValidationError = {
  code: "VALIDATION_ERROR",
  message: "Unable to validate the workbook. Please try again.",
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
      try {
        const [
          { parseBNWorkbook, BNWorkbookInputError },
          { validations },
          { validateBNWorkbook },
          { extractorFunctions },
        ] = await Promise.all([
          import("demos-shared-library/BN"),
          import("demos-shared-library/BN/rulesets"),
          import("demos-shared-library/BN/validation"),
          import("demos-shared-library/BN/extractors"),
        ]);
        if (cancelled) return;

        let data;
        try {
          ({ data } = await parseBNWorkbook(file));
        } catch (parseError) {
          if (cancelled) return;
          console.error("BN workbook parse failed:", parseError);
          setState({
            status: "invalid",
            errors: [
              parseError instanceof BNWorkbookInputError ? parseError.validationError : PARSE_ERROR,
            ],
          });
          return;
        }
        if (cancelled) return;

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

        if (errors.length > 0) {
          setState({ status: "invalid", errors });
          return;
        }

        const result = await validateBNWorkbook(data, [], extractorFunctions);
        if (cancelled) return;
        setState(result.isValid ? { status: "valid" } : { status: "invalid", errors: result.errors });
      } catch (validationError) {
        if (cancelled) return;
        console.error("BN workbook validation failed:", validationError);
        setState({ status: "invalid", errors: [VALIDATION_ERROR] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, documentType]);

  return state;
};
