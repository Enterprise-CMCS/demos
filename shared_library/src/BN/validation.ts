import { type ExcelData, excelColumnRow } from "./index.js";

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationFunction = (data: ExcelData) => ValidationError | null;


export async function validateBNWorkbook(data:ExcelData, validations: ValidationFunction[]): Promise<ValidationError[]>{
  
  const errors: ValidationError[] = validations.map((validation) => validation(data)).filter((error) => error !== null) as ValidationError[] ;
  return errors;

}


