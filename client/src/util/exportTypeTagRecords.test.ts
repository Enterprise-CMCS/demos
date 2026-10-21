import { describe, expect, it, vi } from "vitest";
import { downloadExcel } from "components/table/exportExcel";
import { exportTypeTagRecords } from "./exportTypeTagRecords";

vi.mock("components/table/exportExcel", () => ({ downloadExcel: vi.fn() }));

describe("exportTypeTagRecords", () => {
  it("uses the existing Excel exporter with all seven related-record columns", async () => {
    const rows = [
      {
        id: "Demonstration-demo-1",
        tagName: 'Tag, "quoted"',
        approvalStatus: "Unapproved" as const,
        recordType: "Demonstration" as const,
        relatedItemName: "Related demonstration",
        stateName: "Maryland",
        projectOfficerName: "Project Officer",
        href: "/demonstrations/demo-1",
      },
    ];
    await exportTypeTagRecords(rows);
    const [options] = vi.mocked(downloadExcel).mock.calls[0];
    expect(options.filename).toBe("type-tag-associated-records.xlsx");
    expect(options.sheetName).toBe("Associated Records");
    expect(options.columns.map((column) => column.header)).toEqual([
      "Type/Tag Name",
      "Record Type",
      "Related Item Name",
      "State/Territory",
      "Status",
      "Project Officer",
      "Link",
    ]);
    expect(options.rows.map((row) => options.columns.map((column) => column.value(row)))).toEqual([
      [
        'Tag, "quoted"',
        "Demonstration",
        "Related demonstration",
        "Maryland",
        "Pending",
        "Project Officer",
        `${window.location.origin}/demonstrations/demo-1`,
      ],
    ]);
  });
});
