import { strToU8, zipSync } from "fflate";
import { excelColumnToNumber, numberToExcelColumn, type CellValue, type ExcelData } from "../src/BN/index.js";

export function setCell(data: ExcelData, sheet: string, address: string, value: CellValue | null): void {
  const entry = data.find((entry) => entry.sheet === sheet)!;
  const [, column, row] = /^([A-Z]+)(\d+)$/.exec(address)!;
  const index = Number(row) - 1;
  entry.data[index] ??= [];
  entry.data[index]![excelColumnToNumber(column!)] = value;
}

export function summaryFixture(extraMegRows = 0, hypotheticals = 1): ExcelData {
  const data: ExcelData = [{ sheet: "Summary", data: [] }];
  const label = (row: number, text: string) => setCell(data, "Summary", `B${row}`, text);
  const values = (row: number) => {
    for (let dy = 1; dy <= 40; dy++) setCell(data, "Summary", `${numberToExcelColumn(3 + dy)}${row}`, row * 100 + dy);
    setCell(data, "Summary", `AS${row}`, row * 1000);
  };
  setCell(data, "Summary", "C4", 27);
  setCell(data, "Summary", "C5", 32);
  label(8, "Actuals + Projected");
  label(12, "MAIN BUDGET NEUTRALITY TEST");
  label(20, "Without-Waiver Total Expenditures");
  label(206, "TOTAL");
  label(220, "With-Waiver Total Expenditures");
  label(249, "TOTAL");
  label(250, "Expenditure Authority Expenditures");
  label(252, "Medicaid Aggregate - WW only");
  for (let row = 253; row <= 270 + extraMegRows; row++) {
    label(row, `MEG ${row - 252}`);
    values(row);
  }
  label(272 + extraMegRows, "TOTAL");
  label(273 + extraMegRows, "Savings Phase-Down (1)");
  label(436 + extraMegRows, "NET VARIANCE");
  label(454 + extraMegRows, "Is a Corrective Action Plan needed?");
  for (const row of [206, 249, 272 + extraMegRows, 436 + extraMegRows]) values(row);
  for (let n = 1; n <= hypotheticals; n++) {
    const shift = (n - 1) * 155 + extraMegRows;
    label(500 + shift, `HYPOTHETICALS TEST ${n}`);
    label(520 + shift, "Without-Waiver Total Expenditures");
    label(555 + shift, "TOTAL");
    label(560 + shift, "With-Waiver Total Expenditures");
    label(598 + shift, "TOTAL");
    label(609 + shift, "Is a Corrective Action Plan needed?");
    label(610 + shift, ` HYPOTHETICALS VARIANCE ${n} `);
    values(555 + shift);
    values(598 + shift);
  }
  return data;
}

export function spendingFixture(programs = 1): ExcelData {
  const data: ExcelData = [{ sheet: "Program Spending Limits", data: [] }];
  for (let index = 0; index < programs; index++) {
    const start = 4 + index * 14;
    const put = (column: string, offset: number, value: CellValue) => setCell(data, "Program Spending Limits", `${column}${start + offset}`, value);
    put("B", 0, "Program Name and Associated MEGs");
    put("B", 1, "Program Name");
    put("B", 2, `Program ${index + 1} `);
    put("AQ", 2, (index + 1) * 1000);
    put("B", 3, "Expenditures Subject to Cap");
    for (let line = 1; line <= 6; line++) {
      put("B", 3 + line, `MEG ${line}`);
      if (line < 6) put("AQ", 3 + line, line * 10);
    }
    put("B", 10, "Variance");
    put("AQ", 10, -5);
    put("B", 11, "Over or Under");
    put("AQ", 11, ".");
  }
  return data;
}

export function workbookParts(calcPr = "", summary?: string): Record<string, string> {
  return {
    "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
    "_rels/.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Summary" sheetId="1" r:id="rId1"/><sheet name="Program Spending Limits" sheetId="2" r:id="rId2"/><sheet name="Ignored" sheetId="3" r:id="rId3"/></sheets>${calcPr}</workbook>`,
    "xl/_rels/workbook.xml.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${summary ?? '<row r="1"><c r="B1" t="str"><f>"TOTAL"</f><v>TOTAL</v></c><c r="E1"><f t="shared" si="0" ref="E1:E2">SUM(1,2)</f><v>3</v></c></row><row r="2"><c r="B2" t="inlineStr"><is><t>TOTAL</t></is></c><c r="E2"><f t="shared" si="0"/><v>4</v></c><c r="AS2"><v>7</v></c></row>'}</sheetData></worksheet>`,
    "xl/worksheets/sheet2.xml": '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="AQ1"><f>1</f><v>1</v></c></row></sheetData></worksheet>',
    "xl/worksheets/sheet3.xml": '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1"><v>9</v></c></row></sheetData></worksheet>',
    "xl/vbaProject.bin": "Not a real macro; ignored by the formula reader.",
  };
}

export function zipWorkbook(parts = workbookParts()): Uint8Array {
  return zipSync(Object.fromEntries(Object.entries(parts).map(([name, text]) => [name, strToU8(text)])));
}