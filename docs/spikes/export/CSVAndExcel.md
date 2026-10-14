# CSV and Excel Export Spike

## Spike Scope

The Types table provides both CSV and native Excel (`.xlsx`) exports for comparison. CSV uses a shared helper without an export dependency; Excel uses the client dependency `write-excel-file@^4.1.1`. A broader table-export standard remains a follow-up decision.

## Types Table Implementation

The buttons live in `client/src/components/table/tables/TypesTable.tsx`:

| Button | Tooltip | Download |
| --- | --- | --- |
| Blue | Export CSV | `demonstration-types.csv` |
| Red | Export Excel | `demonstration-types.xlsx` |

Both use `getExportRows` to produce the same columns: Type, Status, Approval Status, Effective Date, and Expiration Date. Dates retain their source strings rather than the table's display formatting. Both buttons have format-specific accessible labels and are hidden with the other table actions for read-only users.

## CSV Implementation

The shared helper lives at `client/src/components/table/exportCsv.ts`.

`downloadCsv(filename, rows)` accepts a filename and an array of rows. Individual tables map their own domain data to header and value rows; the helper owns CSV serialization and triggering the browser download.

The helper:

- Quotes all values and doubles embedded quotes, so commas, quotes, and new lines remain valid CSV data.
- Converts `null` and `undefined` values to empty fields.
- Prefixes values starting with `=`, `+`, `-`, or `@` with an apostrophe to mitigate CSV formula injection when a spreadsheet opens the export.
- Uses `Blob`, `URL.createObjectURL`, and a temporary anchor element, so no download library is required.

## TanStack Table Integration

TanStack Table is headless and does not provide an official CSV or Excel export plugin. It does expose the row models needed to decide what to export.

| Requirement | Row model |
| --- | --- |
| Rows currently visible after sorting, filters, and pagination | `table.getRowModel().rows` |
| All matching rows after sorting and filtering, across every page | `table.getPrePaginationRowModel().rows` |
| Only selected rows | `table.getSelectedRowModel().rows` |

The Types table currently exports `table.getRowModel().rows`, which matches the rows displayed on the active page.

## Excel Implementation

The Types table imports `writeXlsxFile` from `write-excel-file/browser` and creates a single worksheet from the shared export rows:

```ts
await writeXlsxFile(getExportRows(types)).toFile("demonstration-types.xlsx");
```

The spike exports plain tabular values without custom formatting, formulas, or multiple sheets. The Excel button is disabled while its download is being generated; CSV remains available. If Excel generation or download fails, the handler logs the underlying error and shows: "Failed to export demonstration types to Excel. Please try again." The button is re-enabled in `finally`.

### Dependency Choice

The shared library already uses `read-excel-file` to parse uploaded BN workbooks in `shared_library/src/BN/index.ts`. Excel writing uses the separate `write-excel-file` client dependency; the existing reader does not generate the export.

`exceljs` and SheetJS `xlsx` were considered as alternatives but are not used by this spike. Maintenance, security, licensing, required features, and browser bundle-size impact remain review criteria before adopting the Excel approach more broadly.

## Validation and Follow-up

Client lint and TypeScript checks passed, and all 16 existing `TypesTable` tests passed in the devcontainer. The host test runner could not start because its Rolldown native binding was missing. These existing tests do not verify downloaded CSV or workbook contents.

Before applying exports broadly:

- Add CSV coverage for quoting, formula-prefix handling, and download filenames.
- Verify Excel workbook contents, filename, in-progress state, and error reporting.
- Verify both formats respect filtering, sorting, and active-page pagination, and confirm whether exporting only the active page is the desired behavior.
- Complete browser download checks and compare the dependency and bundle-size tradeoffs before choosing a shared export approach.
