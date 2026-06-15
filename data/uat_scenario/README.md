# UAT Demonstration Clone Workflow

This folder contains the scripts used to clone a demonstration from one environment to another.

The top-level entry point is `run_clone.sh`. It performs these steps in order:

1. Export the source demonstration and related rows to CSV files.
2. Remap UUID-based synthetic identifiers.
3. Import the remapped data into the target database.
4. Optionally copy document objects from source S3 to target S3.

## Files

- `run_clone.sh`: top-level export, remap, import, and optional S3 copy
- `export.sql`: exports the demonstration slice to `output/*.csv`
- `remap_ids.py`: rewrites synthetic UUIDs and generates mapping files
- `import.sql`: imports the remapped CSVs into the target database
- `copy_s3_paths_localstack.sh`: copies document objects using `output/s3_path_mapping.csv`

## Prerequisites

- `psql` must be installed and available on `PATH`
- `python3` must be installed and available on `PATH`
- `aws` CLI must be installed if you use `--copy-s3`
- database credentials must be available through environment variables
- AWS credentials must be available through environment variables or AWS profiles if you use real AWS S3

## `run_clone.sh` Usage

```sh
./run_clone.sh <source_demonstration_id> [options]
```

Options:

- `--source-schema NAME`: source database schema. Required unless `SOURCE_DB_SCHEMA` is set
- `--target-schema NAME`: target database schema. Required unless `TARGET_DB_SCHEMA` is set
- `--copy-s3`: after DB import, copy document objects using `output/s3_path_mapping.csv`
- `--source-real-aws`: pass through to the S3 copy step for real AWS source access
- `--target-real-aws`: pass through to the S3 copy step for real AWS target access
- `--real-aws`: pass through to the S3 copy step for real AWS on both sides
- `--help`: show help

Environment:

- `SOURCE_DATABASE_URL`: source database connection string for export
- `TARGET_DATABASE_URL`: target database connection string for import
- `SOURCE_DB_SCHEMA`: source database schema if `--source-schema` is not passed
- `TARGET_DB_SCHEMA`: target database schema if `--target-schema` is not passed

## S3 Environment Variables

If `--copy-s3` is used, the S3 copy helper reads these environment variables.

- `MAPPING_FILE`: mapping CSV path if `--mapping-file` is not passed when running the S3 helper directly

Source-side variables:

- `SOURCE_BUCKET`
- `SOURCE_AWS_REGION`
- `SOURCE_AWS_PROFILE`
- `SOURCE_AWS_ENDPOINT`

Target-side variables:

- `TARGET_BUCKET`
- `TARGET_AWS_REGION`
- `TARGET_AWS_PROFILE`
- `TARGET_AWS_ENDPOINT`

These values are intended to be explicit. Buckets and regions must always be supplied.
Endpoints must also be supplied unless that side is explicitly marked with `--source-real-aws`, `--target-real-aws`, or `--real-aws`.

## Outputs

Running `run_clone.sh` writes or updates these files under `output/`:

- `*.csv`: exported and remapped data files
- `uuid_remap.json`: old-to-new UUID mapping
- `s3_path_mapping.csv`: old-to-new S3 key mapping for documents

## Notes About Import Behavior

The import is intentionally strict for cloned business data.

These cases still use conflict handling by design:

- `application_date`
- `application_phase`

Those rows may already exist because inserting an application can trigger automatic creation.

- `tag_name`
- `tag`

Those are global reference rows and are ignored if they already exist in the target database.

Environment-specific user ownership is rewritten during import:

- the demonstration gets a generated local `Project Officer`
- deliverables are assigned to that same local user as `cmsOwner`
- documents are assigned to that same local user as `owner_user_id`

If no valid target-side CMS user exists for the imported demonstration state, the import fails.

## S3-Only Usage

If the database clone has already been run and you only need the S3 object copy step:

```sh
cd /workspaces/demos/data/uat_scenario && \
./copy_s3_paths_localstack.sh \
  --mapping-file output/s3_path_mapping.csv \
  --source-bucket clean-bucket \
  --target-bucket clean-bucket \
  --source-region us-east-1 \
  --target-region us-east-1 \
  --source-endpoint http://localstack:4566 \
  --target-endpoint http://localstack:4566
```

Dry run:

```sh
cd /workspaces/demos/data/uat_scenario && \
./copy_s3_paths_localstack.sh --mapping-file output/s3_path_mapping.csv --dry-run
```

## Running SQL Standalone

If you run `export.sql` or `import.sql` directly with `psql`, `db_schema` must now be supplied explicitly.

Examples:

```sh
psql "$SOURCE_DATABASE_URL" -v demonstration_id="$DEMONSTRATION_ID" -v db_schema="demos_app" -f export.sql
```

```sh
psql "$TARGET_DATABASE_URL" -v db_schema="demos_app" -f import.sql
```
