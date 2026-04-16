import { type ExcelData, excelColumnRow } from "../../index.js";
import type { ValidationFunction } from "../../validation.js";

export const validations : ValidationFunction[] = [

function error1(data:ExcelData) {
  const A100 = excelColumnRow("A100", "C Report", data);
  const A200 = excelColumnRow("A200", "C Report", data);

  if (A100 !== "Waiver Name" || A200 !== "Waiver Name") {
    return { code: "1", message: "Waiver data is not pasted into correct location" };
  }
  return null;
},

function error2(data:ExcelData) {
  const k2 = excelColumnRow("K2", "C Report", data);
  if (k2 === "") {
    return { code: "2", message: "The 'Reporting DY' value is missing." };
  }
  return null;
},


function error3(data:ExcelData) {
  const k3 = excelColumnRow("K3", "C Report", data);
  if (k3 === "") {
    return { code: "3", message: "The 'Reporting Quarter' value is missing." }  ;
  }
  return null;
},

function error4(data:ExcelData)
{
  //TODO 
  return null;
},

function error5(data:ExcelData) {
  const H2 = excelColumnRow("H2", "C Report", data);
  if (H2 === "") {
    return { code: "5", message: "'Data Pulled On:' field is blank" };
  }
  return null;
},

function error6(data:ExcelData) {
   const H3 = excelColumnRow("H3", "C Report", data);
  if (H3 === "") {
    return { code: "6", message: "'For the Time Period Through:' field is blank" }  ;
  }
  return null;
},

function error7(data:ExcelData) {
  const k3 = Number(excelColumnRow("K3", "C Report", data));
  if ( isNaN(k3) || k3 < 1 || k3 > 4) {
    return { code: "7", message: "The 'Reporting Quarter' value is non-numerical, or beyond of the range from 1 to 4." }            ;
  }
  return null;
},

function error8(data:ExcelData) {
  //TODO: Missing column D
  return null;
},

function error9(data:ExcelData) {
  //TODO: Missing column D
  return null;
},

function error10(data:ExcelData ) {
  //TODO: Missing column D
  return null;
},

function error11(data:ExcelData) {
  //TODO: Missing column D
  return null;
},

function error12(data:ExcelData ) {
  //Use meta-data to check template version against upload
  return null;
},


function error13(   data:ExcelData) {
  //BN template has never been uploaded for the demonstration, or has been uploaded but removed later

  return null;
},
]