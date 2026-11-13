import { describe, expect, it } from "vitest";
import { workbookParts, zipWorkbook } from "../../test/bnFixtures.js";
import { FORMULA_SHEETS, FormulaReadError, MAX_UNCOMPRESSED_BYTES, readFormulaInfo } from "./formulas.js";

describe("readFormulaInfo", () => {
  it("records plain, shared master, and shared follower formulas, but not values or other sheets", () => {
    const parts = workbookParts();
    parts["xl/worksheets/sheet3.xml"] = "not XML";
    const info = readFormulaInfo(zipWorkbook(parts));
    expect([...info.formulaCells.keys()]).toEqual([...FORMULA_SHEETS]);
    expect(info.formulaCells.get("Summary")).toEqual(new Set(["B1", "E1", "E2"]));
    expect(info.formulaCells.get("Program Spending Limits")).toEqual(new Set(["AQ1"]));
    expect(info.fullCalcOnLoad).toBe(false);
  });

  it.each([[' fullCalcOnLoad="1"', true], [' fullCalcOnLoad="true"', true], [' fullCalcOnLoad="false"', false], [' fullCalcOnLoad="0"', false], ["", false]] as const)("reads calcPr%s", (attribute, expected) => {
    expect(readFormulaInfo(zipWorkbook(workbookParts(`<calcPr${attribute}/>`))).fullCalcOnLoad).toBe(expected);
  });

  it("resolves relative, parent-relative and absolute targets and decodes sheet attributes", () => {
    const parts = workbookParts();
    parts["xl/workbook.xml"] = parts["xl/workbook.xml"]!.replace('name="Summary"', 'name="Summ&#97;ry"');
    parts["xl/_rels/workbook.xml.rels"] = parts["xl/_rels/workbook.xml.rels"]!.replace('Target="worksheets/sheet1.xml"', 'Target="../xl/worksheets/sheet1.xml"');
    expect(readFormulaInfo(zipWorkbook(parts)).formulaCells.get("Summary")?.size).toBe(3);
  });

  it("allows an absent optional sheet", () => {
    const parts = workbookParts();
    parts["xl/workbook.xml"] = parts["xl/workbook.xml"]!.replace(/<sheet name="Program Spending Limits"[^>]+\/>/, "");
    expect([...readFormulaInfo(zipWorkbook(parts)).formulaCells.keys()]).toEqual(["Summary"]);
  });

  it.each(["xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"])("rejects missing selected part %s", (part) => {
    const parts = workbookParts();
    delete parts[part];
    expect(() => readFormulaInfo(zipWorkbook(parts))).toThrow(FormulaReadError);
  });

  it.each([
    '<row><c><v>1</v></c></row>',
    '<row><c r="A0"><f>1</f></c></row>',
    '<row><c r="A1"></row></c>',
    '<row><c r="A1" bad></c></row>',
  ])("fails closed on malformed worksheet XML %s", (xml) => {
    expect(() => readFormulaInfo(zipWorkbook(workbookParts("", xml)))).toThrow(FormulaReadError);
  });

  it("rejects a formula element that is not a direct cell child", () => {
    expect(() => readFormulaInfo(zipWorkbook(workbookParts("", '<row><c r="A1"><v><f>1</f></v></c></row>'))))
      .toThrow("not a direct child of a cell");
  });

  it("ignores formula elements in Excel data-validation metadata outside cells", () => {
    const parts = workbookParts();
    parts["xl/worksheets/sheet1.xml"] = parts["xl/worksheets/sheet1.xml"]!.replace("</worksheet>",
      '<extLst><ext uri="synthetic"><x14:formula1 xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><xm:f xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main">A1</xm:f></x14:formula1></ext></extLst></worksheet>');
    expect(readFormulaInfo(zipWorkbook(parts)).formulaCells.get("Summary")).toEqual(new Set(["B1", "E1", "E2"]));
    expect(readFormulaInfo(zipWorkbook(workbookParts("", '<row><f>1</f></row>'))).formulaCells.get("Summary"))
      .toEqual(new Set());
  });

  it("normalizes prefixed metadata and worksheet tags and resets closed cells", () => {
    const parts = workbookParts("<m:calcPr fullCalcOnLoad=\"true\"/>",
      '<x:row><x:c r="B1"><x:f>1</x:f></x:c><x:f>ignored</x:f><x:c r="E1"><x:f>2</x:f></x:c></x:row>');
    parts["xl/workbook.xml"] = parts["xl/workbook.xml"]!
      .replace("<workbook ", '<m:workbook xmlns:m="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ')
      .replaceAll("<sheets>", "<m:sheets>")
      .replaceAll("</sheets>", "</m:sheets>")
      .replaceAll("<sheet ", "<m:sheet ")
      .replaceAll("</workbook>", "</m:workbook>");
    parts["xl/_rels/workbook.xml.rels"] = parts["xl/_rels/workbook.xml.rels"]!
      .replace("<Relationships ", '<p:Relationships xmlns:p="http://schemas.openxmlformats.org/package/2006/relationships" ')
      .replaceAll("<Relationship ", "<p:Relationship ")
      .replaceAll("</Relationships>", "</p:Relationships>");
    parts["xl/worksheets/sheet1.xml"] = parts["xl/worksheets/sheet1.xml"]!
      .replace("<worksheet ", '<x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ')
      .replaceAll("<sheetData>", "<x:sheetData>")
      .replaceAll("</sheetData>", "</x:sheetData>")
      .replaceAll("</worksheet>", "</x:worksheet>");

    const info = readFormulaInfo(zipWorkbook(parts));

    expect(info.fullCalcOnLoad).toBe(true);
    expect(info.formulaCells.get("Summary")).toEqual(new Set(["B1", "E1"]));
  });

  it.each([
    ['Id="rId1"', 'Id="missing"'],
    ['Target="worksheets/sheet1.xml"', 'TargetMode="External" Target="https://example.com/sheet.xml"'],
    ['Target="worksheets/sheet1.xml"', 'Target="../../../sheet.xml"'],
  ])("rejects unusable relationships %s", (from, to) => {
    const parts = workbookParts();
    parts["xl/_rels/workbook.xml.rels"] = parts["xl/_rels/workbook.xml.rels"]!.replace(from, to);
    expect(() => readFormulaInfo(zipWorkbook(parts))).toThrow(FormulaReadError);
  });

  it("rejects duplicate selected sheet names and duplicate relationship IDs", () => {
    for (const part of ["xl/workbook.xml", "xl/_rels/workbook.xml.rels"]) {
      const parts = workbookParts();
      parts[part] = parts[part]!.replace(part.endsWith("rels") ? 'Id="rId2"' : 'name="Ignored"', part.endsWith("rels") ? 'Id="rId1"' : 'name="Summary"');
      expect(() => readFormulaInfo(zipWorkbook(parts))).toThrow(FormulaReadError);
    }
  });

  it("rejects invalid archives", () => {
    expect(() => readFormulaInfo(new Uint8Array([0, 1, 2]))).toThrow(FormulaReadError);
  });

  it("enforces the aggregate declared uncompressed size before inflation, only for selected entries", () => {
    const inflateDeclaredSize = (target: string, size: number) => {
      const bytes = zipWorkbook();
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const decoder = new TextDecoder();
      for (let offset = 0; offset < bytes.length - 46; offset++) {
        if (view.getUint32(offset, true) !== 0x02014b50) continue;
        const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + view.getUint16(offset + 28, true)));
        if (name === target) view.setUint32(offset + 24, size, true);
      }
      return bytes;
    };
    for (const part of ["xl/workbook.xml", "xl/worksheets/sheet1.xml"]) {
      expect(() => readFormulaInfo(inflateDeclaredSize(part, MAX_UNCOMPRESSED_BYTES))).toThrow("uncompressed size limit");
    }
    expect(readFormulaInfo(inflateDeclaredSize("xl/vbaProject.bin", 0xffffffff)).formulaCells.size).toBe(2);
  });
});