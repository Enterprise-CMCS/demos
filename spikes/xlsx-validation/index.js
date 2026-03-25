import fs from "node:fs/promises";
import readXlsxFile from "read-excel-file/universal";

const data = await fs.readFile("./input.xlsm");
const blob = new Blob([data], {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});
// aproximently 2.5 mb here.
//for browser, you can directly use the file input element to get the `Blob` from the selected file. see https://developer.mozilla.org/en-US/docs/Web/API/File

const Overview = await readXlsxFile(blob, { sheet: "Overview" }); //112mb
const DYDef = await readXlsxFile(blob, { sheet: "DY Def" }); //161mb
const MEGDef = await readXlsxFile(blob, { sheet: "MEG Def" }); //210mb
const WowPmpmAgg = await readXlsxFile(blob, { sheet: "WOW PMPM & Agg" }); //213mb
const ProgramSpendingLimits = await readXlsxFile(blob, {
  sheet: "Program Spending Limits",
}); //214 mb
const CReport = await readXlsxFile(blob, { sheet: "C Report" }); //248mb
const CReportGrouper = await readXlsxFile(blob, { sheet: "C Report Grouper" }); //254 mb
const TotalAdjustments = await readXlsxFile(blob, {
  sheet: "Total Adjustments",
}); //228 mb
const WWSpendingActual = await readXlsxFile(blob, {
  sheet: "WW Spending Actual",
}); //317mb
const WWSpendingProjected = await readXlsxFile(blob, {
  sheet: "WW Spending Projected",
}); //297mb
const WWSpendingTotal = await readXlsxFile(blob, {
  sheet: "WW Spending Total",
}); //333mb
const MemMonActual = await readXlsxFile(blob, { sheet: "MemMon Actual" }); //327mb
const MemMonProjected = await readXlsxFile(blob, { sheet: "MemMon Projected" }); //334mb
const MemMonTotal = await readXlsxFile(blob, { sheet: "MemMon Total" }); //338mb
const SummaryTC = await readXlsxFile(blob, { sheet: "Summary TC" }); //345mb
const Dropdowns = await readXlsxFile(blob, { sheet: "Dropdowns" }); //357mb

function excelColumnRow(excelColumnRow, rows) {
  const match = excelColumnRow.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error("Invalid Excel column-row format");
  }
  const columnLetters = match[1];
  const rowNumber = parseInt(match[2], 10) - 1;

  let columnNumber = 0;
  for (let i = 0; i < columnLetters.length; i++) {
    columnNumber *= 26;
    columnNumber += columnLetters.charCodeAt(i) - "A".charCodeAt(0);
  }

  return rows[rowNumber][columnNumber];
}

function error1() {
  const A100 = excelColumnRow("A100", CReport);
  const A200 = excelColumnRow("A200", CReport);
  console.log("A100:", A100);
  console.log("A200:", A200);
  if (A100 !== "Waiver Name" || A200 !== "Waiver Name") {
    return "Waiver data is not pasted into correct location";
  }
  return null;
}

function error2() {
  const k2 = excelColumnRow("K2", CReport);
  if (k2 === "") {
    return "The 'Reporting DY' value is missing.";
  }
  return null;
}

function error3() {
  const k3 = excelColumnRow("K3", CReport);
  if (k3 === "") {
    return "The 'Reporting Quarter' value is missing.";
  }
  return null;
}

function error4()
{
  //TODO 
  return null;
}

function error5() {
  const H2 = excelColumnRow("H2", CReport);
  if (H2 === "") {
    return "'Data Pulled On:' field is blank";
  }
  return null;
}

function error6() {
   const H3 = excelColumnRow("H3", CReport);
  if (H3 === "") {
    return " 'For the Time Period Through:' field is blank";
  }
  return null;
}

function error7() {
  const k3 = parseInt(Number(excelColumnRow("K3", CReport)));   //parseInt("123+456") will return 123, but Number("123+456") will return NaN, which is what we want.
  if ( isNaN(k3) || k3 < 1 || k3 > 4) {
    return "The 'Reporting Quarter' value is non-numerical, or beyond of the range from 1 to 4.";
  }
  return null;
}

function error8() {
  //TODO: Missing column D
  return null;
}

function error9() {
  //TODO: Missing column D
  return null;
}

function error10() {
  //TODO: Missing column D
  return null;
}

function error11() {
  //TODO: Missing column D
  return null;
}

function error12() {
  //Use meta-data to check template version against upload
  return null;
}


function error13() {
  //BN template has never been uploaded for the demonstration, or has been uploaded but removed later

  return null;
}

const validations = [error1, error2, error3, error4, error5, error6, error7, error8, error9, error10, error11, error12, error13]

const errors = validations.map((validation) => validation()).filter((error) => error !== null);

if (errors.length > 0) {
  console.log("Validation errors found:");
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
} else {
  console.log("No validation errors found.");
} 