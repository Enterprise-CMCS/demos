# DataConnect export Lambda

Scheduled Lambda that publishes DEMOS reporting data to the DataConnect bucket as Parquet.

The export is defined by reviewed SQL in `views.ts`, not by an allowlist of physical tables. The reporting contract follows the DEMOS on-demand reports and includes a DataConnect-only Budget Neutrality snapshot. The query absorbs internal schema changes so DataConnect's pipeline does not have to. Raw internal tables, operational metadata, and session data are not exported.

## Dataset: `demonstration_reporting`

One row per demonstration returned by the Demonstration Overview report (demonstrations require a state and a primary Project Officer).

| Column(s)                                                         | Type              | Source                         |
|-------------------------------------------------------------------|-------------------|--------------------------------|
| `demonstration_id`                                                | UUID              | `demonstration.id`; parent key |
| Overview fields (`state_territory` … `application_approval_date`) | VARCHAR / INTEGER | Demonstration Overview report  |
| `applications`                                                    | JSON array        | Application Details report     |
| `deliverables`                                                    | JSON array        | Deliverable Status report plus Budget Neutrality snapshot |
| `demonstration_types`                                             | JSON array        | Demonstration Types report     |

Each collection is aggregated independently per demonstration, so the parent row never multiplies. Each array element contains the corresponding report's fields, including repeated parent fields. Deliverables also contain the DataConnect-only `budget_neutrality_reporting` field. Missing collections are `[]`, never `NULL`.

Report formatting is preserved:

- Dates are `MM/DD/YYYY` strings in `America/New_York`.
- Missing optional report values are `'-'`, except deliverable parent dates, which are JSON `null` as in the report.
- `Extension` applications are labelled `Renewal`.
- Public/private deliverable comments are each limited to 32,000 characters.

Report-visible names, Medicaid/CHIP identifiers, clearance notes, and public/private comments are included unredacted; DataConnect users are authorized to see this data in DEMOS.

See the [Excel data dictionary](../../data/docs/demos_data_dictionary.xlsx) for column order and nested fields.

### Budget Neutrality snapshot

`deliverables[].budget_neutrality_reporting` is `null` if no successfully validated workbook is linked to a submission action. Otherwise, the export uses the workbook with the latest submission timestamp and breaks ties by highest workbook ID. The snapshot, `budget_neutrality_variance`, and `actuals` all use that same workbook.

The snapshot has a `workbook_id` and three arrays: `test_values`, `test_years`, and `spending_limits`. Any of these arrays can be empty, as can the `megs` array in each spending-limit entry. The snapshot stores numbers and booleans as JSON values. The report's variance and actuals are still formatted strings.

### Read the JSON collections

The JSON columns are stored as Parquet strings with DuckDB's JSON logical type, not native nested Parquet structures. To query individual child records, expand them. For example, in DuckDB:

```sql
SELECT r.demonstration_id, app.value ->> 'application_type' AS application_type
FROM read_parquet('demonstration_reporting/dt=2026-10-07/part-000.parquet') AS r,
     json_each(r.applications) AS app;
```

To inspect a downloaded file in Python instead, use the [Parquet reader](../../data/demos_data_tools/README.md#read_dataconnect_parquetpy).

## Execution

1. `index.ts` opens one read-only, repeatable-read snapshot. It takes `ACCESS SHARE` locks on the sorted, deduplicated union of every view's `baseTables`. View names are never lock targets.
2. `parquet/writer.ts` wraps the view's query as `COPY (SELECT <declared columns> FROM (<query>) AS export_view) TO STDOUT`. It streams the CSV to local staging, converts it with DuckDB using the declared types, and verifies the row count.
3. Each dataset is uploaded to `<view>/dt=YYYY-MM-DD/part-000.parquet` and its staging file is removed.
4. After the snapshot commits, `_run/dt=YYYY-MM-DD/_SUCCESS` is written with the run date, snapshot time, and per-dataset row counts. No marker is written if a query, conversion, upload, or commit fails.

Queries come only from reviewed code. They must be a single `SELECT`/`WITH` statement with no trailing `;`, and every physical table they read must be listed in `baseTables`. `views.test.ts` checks that every `demos_app` table the query reads is listed in `baseTables`; the integration test checks that the query runs as a `COPY` subquery.

## Consumer transition

This replaces the earlier raw `demonstration` and `state` exports. New runs publish only `demonstration_reporting/`, and the `_SUCCESS` manifest lists `demonstration_reporting` as its relation. Historical `demonstration/` and `state/` partitions are not deleted. DataConnect must switch once to the new prefix and expand the JSON columns. Later DEMOS model changes should not change this contract; changes to exported fields or collection shapes are explicit consumer-facing changes.

## Data dictionary

The [JSON reporting contract](../../data/docs/dataconnect_reporting_contract.json) is the input to the Excel workbook. To update the dictionary, start with the file that owns the change:

- [`views.ts`](views.ts) defines the SQL, source tables, and export schema, including `collectionSchemas` for JSON arrays.
- [`dataContractMetadata.ts`](dataContractMetadata.ts) documents fields, report labels, formatting, nullability, what each row represents, and keys.
- [`sourceTablePurposes.ts`](sourceTablePurposes.ts) explains why the export reads each source table. Add a purpose when you add a table to `baseTables`; check it against the reporting SQL rather than assuming GraphQL restrictions apply.

The contract generator checks that every field has metadata and every table in `baseTables` has a documented purpose. It checks coverage, not whether the descriptions are correct. After changing any of these files, [regenerate and check the JSON and Excel files](../../data/demos_data_tools/README.md#regenerate-the-dictionary). For changes outside the dictionary, see the [DEMOS contributing guide](../../CONTRIBUTING.md).

## Tests

```sh
npm test
npm run lint
```
