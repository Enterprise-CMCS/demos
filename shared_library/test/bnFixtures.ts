import { strToU8, zipSync } from "fflate";
import { excelColumnToNumber, type CellValue, type ExcelData } from "../src/BN/index.js";

export function setCell(data: ExcelData, sheet: string, address: string, value: CellValue | null): void {
  const entry = data.find((entry) => entry.sheet === sheet)!;
  const [, column, row] = /^([A-Z]+)(\d+)$/.exec(address)!;
  const index = Number(row) - 1;
  entry.data[index] ??= [];
  entry.data[index]![excelColumnToNumber(column!)] = value;
}

export function workbookParts(calcPr = "", summary?: string): Record<string, string> {
  return {
    "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
    "_rels/.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Summary" sheetId="1" r:id="rId1"/><sheet name="Program Spending Limits" sheetId="2" r:id="rId2"/><sheet name="Ignored" sheetId="3" r:id="rId3"/><sheet name="C Report" sheetId="4" r:id="rId4"/></sheets>${calcPr}</workbook>`,
    "xl/_rels/workbook.xml.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${summary ?? '<row r="1"><c r="B1" t="str"><f>"TOTAL"</f><v>TOTAL</v></c><c r="E1"><f t="shared" si="0" ref="E1:E2">SUM(1,2)</f><v>3</v></c></row><row r="2"><c r="B2" t="inlineStr"><is><t>TOTAL</t></is></c><c r="E2"><f t="shared" si="0"/><v>4</v></c><c r="AS2"><v>7</v></c></row>'}</sheetData></worksheet>`,
    "xl/worksheets/sheet2.xml": '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="AQ1"><f>1</f><v>1</v></c></row></sheetData></worksheet>',
    "xl/worksheets/sheet3.xml": '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1"><v>9</v></c></row></sheetData></worksheet>',
    "xl/worksheets/sheet4.xml": '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData></worksheet>',
    "xl/vbaProject.bin": "Not a real macro; ignored by the formula reader.",
  };
}

export function zipWorkbook(parts = workbookParts()): Uint8Array {
  return zipSync(Object.fromEntries(Object.entries(parts).map(([name, text]) => [name, strToU8(text)])));
}
