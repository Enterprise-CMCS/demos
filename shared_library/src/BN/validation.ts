import { type ExcelData } from "./index.js";

export const RULE_ERROR_CODE = "RULE_ERROR";
export const EXTRACTION_ERROR_CODE = "EXTRACTION_ERROR";

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  extractedValues: Map<string, (string | number)>;
}


export type ValidationFunction = (data: ExcelData) => ValidationError | null;
export type ExtractionFunction = (data: ExcelData) => Map<string, string | number> | null;

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

// A rule that throws is reported as an error rather than aborting the run, so callers
// always get a result they can persist.
function runValidations(data: ExcelData, validations: ValidationFunction[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const validation of validations) {
    try {
      const error = validation(data);
      if (error) {
        errors.push(error);
      }
    } catch (ruleError) {
      errors.push({
        code: RULE_ERROR_CODE,
        message: `Workbook is missing expected structure: ${toMessage(ruleError)}`,
      });
    }
  }

  return errors;
}

// Extractors run independently so one failure still yields the other values. A failed
// extraction is an error, which keeps a partially extracted workbook from reading as valid.
function runExtractions(
  data: ExcelData,
  extractionFunctions: ExtractionFunction[]
): { extractedValues: Map<string, string | number>; errors: ValidationError[] } {
  const extractedValues = new Map<string, string | number>();
  const errors: ValidationError[] = [];

  for (const extraction of extractionFunctions) {
    try {
      const result = extraction(data);
      if (result) {
        result.forEach((value, key) => {
          extractedValues.set(key, value);
        });
      }
    } catch (extractionError) {
      errors.push({
        code: EXTRACTION_ERROR_CODE,
        message: toMessage(extractionError),
      });
    }
  }

  return { extractedValues, errors };
}

export async function validateBNWorkbook(data:ExcelData, validations: ValidationFunction[], extractionFunctions: ExtractionFunction[]): Promise<ValidationResult>{

  const validationErrors = runValidations(data, validations);
  const { extractedValues, errors: extractionErrors } = runExtractions(data, extractionFunctions);
  const errors = [...validationErrors, ...extractionErrors];

  return {
    isValid: errors.length === 0,
    errors,
    extractedValues
  };

}
