import { describe, expect, it, vi } from "vitest";

const { readExcelFile } = vi.hoisted(() => ({ readExcelFile: vi.fn() }));

vi.mock("read-excel-file/universal", () => ({ default: readExcelFile }));

import { excelColumnRow, parseBNFile } from "./index.js";
import { BN_WORKBOOK_FIELDS } from "./extractors/index.js";

describe("parseBNFile date values", () => {
  it("preserves native dates and timestamps for field-specific interpretation", async () => {
    const calendarDate = new Date("2026-07-14T00:00:00.000Z");
    const timestamp = new Date("2026-07-14T00:00:00.000Z");
    readExcelFile.mockResolvedValue([{
      sheet: "C Report",
      data: [
        [],
        [null, null, null, calendarDate],
        [null, null, null, new Date("2026-07-15T12:00:00.000Z"), null, null, null, timestamp],
      ],
    }]);

    const result = await parseBNFile(new Blob());

    expect(excelColumnRow("D2", "C Report", result)).toBe(calendarDate);
    expect(excelColumnRow("D3", "C Report", result)).toEqual(new Date("2026-07-15T12:00:00.000Z"));
    expect(excelColumnRow("H3", "C Report", result)).toBe(timestamp);

    const dataPulledOn = BN_WORKBOOK_FIELDS.find(({ key }) => key === "dataPulledOn")!.extractor;
    const periodThrough = BN_WORKBOOK_FIELDS.find(({ key }) => key === "periodThrough")!.extractor;
    expect(dataPulledOn(result)).toEqual(new Map([["dataPulledOn", "2026-07-14"]]));
    expect(periodThrough(result)).toEqual(new Map([["periodThrough", "2026-07-15"]]));
  });
});