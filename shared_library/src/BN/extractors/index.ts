import type {ExtractionFunction} from "../validation.js";
import {excelColumnRow} from "../index.js";


export const extractorFunctions: ExtractionFunction[] = [
  function extractActuals(data) {
    const B8 = excelColumnRow("B8", "Summary", data);
    if(B8 === "" || B8 === null || B8 === undefined){
        throw new Error("Unable to extract actuals from cell B8 in Summary tab. Please ensure the value is a string and is not empty.");
    }
    return new Map<string, string>([["actuals", B8 as string]]);
  },

  function extractNetVariance(data) {
    const AS436 = excelColumnRow("AS436", "Summary", data);
    if(AS436 === "" || AS436 === null || AS436 === undefined || isNaN(Number(AS436))){
        throw new Error("Unable to extract net variance from cell AS436 in Summary tab. Please ensure the value is a number and is not empty.");
    }
    return new Map<string, number>([["netVariance", AS436 as number]]);
  },
];  

