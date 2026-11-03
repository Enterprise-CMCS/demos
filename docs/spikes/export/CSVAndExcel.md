# Table Export Decision: Excel

## Decision

The CSV/Excel comparison is complete. The Types table uses `documonster/excel` for native `.xlsx` downloads. The CSV button and custom CSV serialization helper have been removed.

The client already declares `documonster@^0.20.1`. The shared library uses `read-excel-file` for BN imports; it does not provide workbook writing. The backend's `@cj-tech-master/excelts` dependency is deprecated, so it is not being added to the client for consistency.

## Implementation

`client/src/components/table/tables/TypesTable.tsx` renders one standard `CircleButton` with the accessible label "Export Types as Excel" and tooltip "Export Excel". The spike's filled blue and red styles are removed.

The export includes Type, Status, Approval Status, Effective Date, and Expiration Date. Dates retain their source strings. It uses `table.getRowModel().rows`, preserving sorting and filtering and exporting only the active page, rather than selected rows or all pages. Read-only users retain the existing behavior of having no table action buttons.

The `client/src/components/table/exportExcel.ts` helper uses `Workbook.create`, `Workbook.addWorksheet`, and `Worksheet.addRows` to create one "Demonstration Types" worksheet. It makes the header row bold with `Row.setFont` and fits column widths to the headers and data using `Worksheet.autoFitColumns`, then serializes the workbook with `Workbook.toBuffer` and downloads the XLSX Blob through a temporary anchor, then removes the anchor and revokes the object URL. The table calls:

```ts
await downloadExcel({
  filename: "demonstration-types.xlsx",
  sheetName: "Demonstration Types",
  rows: types,
  columns: EXPORT_COLUMNS,
});
```

The button is disabled while the export is pending, with tooltip "Exporting Excel…". Failures log the underlying error and display "Failed to export demonstration types to Excel. Please try again." The button is re-enabled in `finally` so the user can retry.

Each table supplies its own row type and `ExcelColumn<T>[]` definitions, pairing each header with a typed value accessor. The generic helper builds header and data rows, while the caller owns the filename, worksheet name, loading state, and error messages. Accessor results use Documonster's `CellValue` type.

## Formula Handling

Exported strings are written as text cells, including values beginning with `=`. The integration does not create formula cells, hyperlinks, or macros. Keep user-provided values as strings rather than formula or hyperlink objects.

## Validation

The Types table tests cover filtered export data and filename, absence of a CSV button, pending download state, error reporting, and retry behavior. Component tests mock the download helper. A separate helper test generates and reads a real XLSX workbook, checking values, formula-like strings, the download filename, and object URL cleanup. These tests do not run the Excel application.
