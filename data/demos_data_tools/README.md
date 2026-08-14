# DEMOS Data Tools

This is the `demos_data_tools` Python module, which contains various data-related Python scripts for development and migration use. Many of these are likely to be somewhat fragile as they are intended to assist developers in their work, rather than to be deployed as production code themselves.

Read and understand the script you're using before you use it!

# Specific Scripts

## `pmda_exporter.py`

This is a DuckDB-based tool to grab a full copy of the data in a PMDA instance and move it to a schema called `legacy_pmda_raw` in PostgreSQL.

## `history_trigger_generator.py`

This tool generates the triggers necessary to populate hsitory tables with changes in DEMOS. It outputs to `server/sql/history_triggers.sql`.

Note that as new tables are added and have corresponding history tables, the script will need to be updated so as to add those tables to the global variable `TBL_FOLDERS`.

When column changes occur in tables with history, the script needs to be run to generate updated triggers.

Also, note that this script depends on specific formatting being in place for the Prisma files (namely, having only one `@@` statement on the history schema file, which corresponds to the `map` statement).
