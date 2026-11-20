# DEMOS Data Tools

This is the `demos_data_tools` Python module, which contains various data-related Python scripts for development and migration use. Many of these are likely to be somewhat fragile as they are intended to assist developers in their work, rather than to be deployed as production code themselves.

Read and understand the script you're using before you use it!

# Specific Scripts

## `data_dictionary_to_xlsx.py`

The script turns the [DataConnect reporting contract](../docs/dataconnect_reporting_contract.json) into an [Excel data dictionary](../docs/demos_data_dictionary.xlsx). Use the workbook to look up export column types, field meanings, and source tables.

Start on `Overview` to find the `demonstration_reporting` dataset and its three collection sheets: `applications`, `deliverables`, and `demonstration_types`. Collection fields are listed as paths such as `applications[].application_type`. The [Budget Neutrality snapshot](../../lambdas/dataConnectExport/README.md#budget-neutrality-snapshot) is documented on the `deliverables` sheet. `Source Tables` lists the underlying `demos_app` tables and their purposes by dataset; those tables aren't separate Parquet exports.

### Regenerate the dictionary

Install the Lambda's npm dependencies and make sure `uv` is available. When the export or its documentation changes, run both commands from the repository root:

```sh
(cd lambdas/dataConnectExport && npm run dictionary:contract)
uv run --with openpyxl python data/demos_data_tools/data_dictionary_to_xlsx.py
```
The first command writes the JSON contract. The second reads it and writes the workbook. Neither command needs a database or AWS credentials. Keep the JSON and workbook together when updating the dictionary.

To use a different input or output, pass `--contract <json_path>` or the optional positional `output_path`. Both paths must be inside the repository. The workbook generator requires a version 2 contract.

### Check the dictionary

The first check fails if the JSON is stale. The Python tests check the workbook against the JSON. Run each command from the repository root:

```sh
(cd lambdas/dataConnectExport && npm run dictionary:contract:check)
(cd data/demos_data_tools && uv run --with openpyxl --with pytest python -m pytest -o addopts="" test_data_dictionary_to_xlsx.py)
```

## `read_dataconnect_parquet.py`

Use this script to inspect a downloaded nightly export (`demonstration_reporting/dt=YYYY-MM-DD/part-000.parquet`). It prints the row count and, if there is one, the first record. DuckDB is the default; use PyArrow if you prefer it. You only need to install the engine you use.

From the repository root, run either command with the path to your downloaded file:

```sh
uv run --with duckdb python data/demos_data_tools/read_dataconnect_parquet.py path/to/part-000.parquet
uv run --with pyarrow python data/demos_data_tools/read_dataconnect_parquet.py path/to/part-000.parquet --engine pyarrow
```

Both readers return one Python dictionary per demonstration. They convert `demonstration_id` to a UUID string and decode `applications`, `deliverables`, and `demonstration_types` as lists of dictionaries. Dates and `'-'` placeholders stay as stored. See the [Excel data dictionary](../docs/demos_data_dictionary.xlsx) for field definitions.

The script loads the whole file into memory. For larger datasets, use your engine's batch API instead.

To test both readers, run this from the repository root:

```sh
(cd data/demos_data_tools && uv run --with duckdb --with pyarrow --with pytest python -m pytest -o addopts="" test_read_dataconnect_parquet.py)
```

## `pmda_exporter.py`

This is a DuckDB-based tool to grab a full copy of the data in a PMDA instance and move it to a schema called `legacy_pmda_raw` in PostgreSQL.

## `history_trigger_generator.py`

This tool generates the triggers necessary to populate history tables with changes in DEMOS. It outputs to `server/sql/history_triggers.sql`.

Note that as new tables are added and have corresponding history tables, the script will need to be updated so as to add those tables to the global variable `TBL_FOLDERS`.

When column changes occur in tables with history, the script needs to be run to generate updated triggers.

Also, note that this script depends on specific formatting being in place for the Prisma files (namely, having only one `@@` statement on the history schema file, which corresponds to the `map` statement).
