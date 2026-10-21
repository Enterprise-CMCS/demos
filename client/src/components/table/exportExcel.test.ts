import { afterEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { Workbook, Row, Column, Cell } from "documonster/excel";
import { downloadExcel } from "./exportExcel";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("downloadExcel", () => {
  it("downloads a real workbook and preserves formula-like values as text", async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:excel-export");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const rows = [
      { label: '=HYPERLINK("https://example.com","link")', count: 3 },
      { label: "+1+1", count: 2 },
      { label: "@SUM(A1)", count: 1 },
    ];

    await downloadExcel({
      filename: "types.xlsx",
      sheetName: "Custom Sheet",
      rows,
      columns: [
        { header: "Count", value: (row) => row.count },
        { header: "Label", value: (row) => row.label },
      ],
    });

    const link = click.mock.instances[0] as HTMLAnchorElement;
    expect(link.download).toBe("types.xlsx");
    expect(link.href).toBe("blob:excel-export");
    expect(document.body.contains(link)).toBe(false);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
    const workbook = Workbook.create();
    await Workbook.read(workbook, new Uint8Array(bytes));
    const sheet = Workbook.getWorksheet(workbook, "Custom Sheet")!;
    expect([1, 2, 3, 4].map((index) => Row.getValues(sheet, index))).toEqual([
      ["Count", "Label"],
      [3, '=HYPERLINK("https://example.com","link")'],
      [2, "+1+1"],
      [1, "@SUM(A1)"],
    ]);
    expect(Cell.getFont(sheet, "A1")?.bold).toBe(true);
    expect(Cell.getFont(sheet, "B1")?.bold).toBe(true);
    expect(Cell.getFont(sheet, "A2")?.bold).not.toBe(true);
    expect(Column.getWidth(sheet, 1)).toBeGreaterThan(5);
    expect(Column.getWidth(sheet, 2)).toBeGreaterThan(Column.getWidth(sheet, 1)!);
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:excel-export"), {
      timeout: 2000,
    });
  });
});
