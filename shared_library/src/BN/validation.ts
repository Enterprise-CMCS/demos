import type { ExcelData } from "./index.js";
import { BNWorkbookInputError } from "./errors.js";
import { extractorFunctions } from "./extractors/index.js";
import { validations } from "./rulesets/v1/index.js";

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];  
  extractedValues: Map<string, string | number>;
}



export type ValidationFunction = (data: ExcelData) => ValidationError | null;
export type ExtractionFunction = (data: ExcelData) => Map<string, string | number> | null;


export async function validateBNWorkbook(data:ExcelData, validations: ValidationFunction[], extractionFunctions: ExtractionFunction[]): Promise<ValidationResult>{
  const errors: ValidationError[] = validations.map((validation) => validation(data)).filter((error) => error !== null) as ValidationError[] ;
  const extractedValues = new Map<string, string | number>();

  if(errors.length === 0){
    extractionFunctions.forEach((extraction) => {
      try {
        const result = extraction(data);
        if(result){
          result.forEach((value, key) => {
            extractedValues.set(key, value);
          });
        }
      } catch (error) {
        if (!(error instanceof BNWorkbookInputError)) throw error;
        errors.push(error.validationError);
      }
    });
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    errors,
    extractedValues: isValid ? extractedValues : new Map(),
  };
}

const buildRuleError = (cause: unknown): ValidationError => ({
  code: "RULE_ERROR",
  message:
    cause instanceof Error
      ? `Workbook is missing expected structure: ${cause.message}.`
      : "Workbook is missing expected structure.",
});

export async function validate(data: ExcelData): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  for (const validation of validations) {
    try {
      const error = validation(data);
      if (error) errors.push(error);
    } catch (ruleError) {
      console.error("BN validation rule threw:", ruleError);
      errors.push(buildRuleError(ruleError));
    }
  }

  if (errors.length > 0) return errors;

  const result = await validateBNWorkbook(data, [], extractorFunctions);
  return result.errors;
}


