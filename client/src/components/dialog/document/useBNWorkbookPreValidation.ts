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
        const [{ parseBNWorkbook, BNWorkbookInputError }, { validate }] = await Promise.all([
          import("demos-shared-library/BN"),
          import("demos-shared-library/BN/validation"),
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

        const errors = await validate(data);
        if (cancelled) return;
        if (errors.length > 0) {
          setState({ status: "invalid", errors });
          return;
        }
        setState({ status: "valid" });
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
