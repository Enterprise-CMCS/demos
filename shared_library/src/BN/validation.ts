import type { ExcelData } from "./index.js";
import { BNWorkbookInputError } from "./errors.js";

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];  
  extractedValues?: Map<string, (string | number)>;
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


