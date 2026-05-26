import { type ExcelData, excelColumnRow } from "./index.js";

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
  const isValid = errors.length === 0;
  const extractedValues = new Map<string, string | number>();

  if(isValid){
    extractionFunctions.forEach((extraction) => {
      const result = extraction(data);
      if(result){
        result.forEach((value, key) => {
          extractedValues.set(key, value);
        });
      }
    });
  }

  return {
    isValid,
    errors,
    extractedValues
  };

}


