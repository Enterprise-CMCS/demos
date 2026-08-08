# Migration Runbook

This is the overall runbook for the actual production migration of data from PMDA to DEMOS. This is intended to help guide the execution on the day of the migration, as well as to provide guidance for DevOps as they implement the code.

## Starting State Assumptions

This runbook assumes that the process starts from the following state; the assumption is that the environment is production unless otherwise specified.

- A MySQL instance is running which contains a schema called `cma_pro_11_1_000` with all the PMDA data to be migrated.
  - A user is available for the migration which can read all the tables in the `cma_pro_11_1_000` schema.
- A PostgreSQL instance is running which is hosting the `demos_app` schema. There may be other schemas, but notably, there are no schemas prefixed with `legacy_pmda_`.
  - A user is available for the migration which can:
    - read all data in `demos_app`;
    - create and use new schemas (and by extension, create new tables in those schemas), and;
    - read system views like `information_schema`.
- An S3 bucket is available which contains all the files from PMDA.
  - In this bucket, a file called `s3_file_list.csv` has been created which contains a list of all the files in the bucket. It has the column headers of `file_path`, `size_bytes`, and `etag`.
- An S3 bucket is available for clean files to be loaded to; this will be the standard bucket used by the DEMOS application.
- The environment variables defined in `/workspaces/demos/data/demos_data_tools/.env.example` have been configured in the execution environment.
  - The `PMDA DB Details` should point to the MySQL instance running with `cma_pro_11_1_000` using the correct user.
  - The `DEMOS DB Details` should point to the PostgreSQL instance running with `demos_app` using the correct user.
  - The `PMDA Exporter Settings` should be set with the source as `cma_pro_11_1_000` and the target as `legacy_pmda_raw`.
  - The `Schemas` section should be configured with raw pointing to the target schema environment variable, staging pointing to `legacy_pmda_staged`, and app pointing to `demos_app`.
  - The `S3 Settings` should be set pointing to the correct buckets for PMDA and DEMOS as described above.
- The file `/workspaces/demos/data/migration/stage_pmda_for_migration/profiles.yml` has been created from `profiles.yml.example`.
  - The environment variables in `profiles.yml` have been configured in the execution environment to point to the same configuration as the `DEMOS DB Details` as described above.
- The environment variable `DEVCONTAINER` is either unset or set to a value other than `"true"`. This controls the specific AWS environment that the code attempts to interact with.

## General Migration Steps

This is the general flow of the migration process.

1. The schemas `legacy_pmda_raw` and `legacy_pmda_staged` are created on the PostgreSQL DEMOS instance.
2. Data is loaded from the MySQL PMDA copy to the `legacy_pmda_raw` schema on the PostgreSQL DEMOS instance.
3. The `demos_app` database is reset using Prisma so it is in a fresh state with no data except for constraints in it.
4. The `s3_file_list.csv` file is copied from the PMDA S3 bucket to `/workspaces/demos/data/migration/stage_pmda_for_migration/seeds/raw_pmda_s3_file_list.csv`.
5. A data build tool ("dbt") project called `stage_pmda_for_migration` is run, which loads multiple tables into `legacy_pmda_staged`. Dependencies are installed first.
6. Files are copied between S3 buckets based on tables in `legacy_pmda_staged`.
7. Data is copied from the final tables in `legacy_pmda_staged` into `demos_app`.
8. A snapshot of the contents of `legacy_pmda_staged` is taken into a timestamped schema so a record of what was migrated is kept.

## Specific Commands

Below are the specific commands that would execute each of these steps. This assumes the following:

- Execution starts from the `data/` folder within the project.
- A Python virtual environment called `demos-data` has been installed at `/opt/demos-data`, based on the `requirements.txt` file found in `.devcontainer/python`.

A devcontainer-specific version of this for local testing is available in `data/migration/scripts/full_test_runner_for_devcontainer.sh`.

```bash
#!/usr/bin/bash
# Stop on any errors
set -e

# Activate the Python virtual environment; the path may be different when running in production
source /opt/demos-data/bin/activate

# STEP 1: Create the required schemas
cd demos_data_tools
python manage_migration_schemas.py create raw
python manage_migration_schemas.py create staging

# STEP 2: Load data from PMDA to DEMOS
python pmda_exporter.py

# STEP 3: Reset the application database
cd ../../server
npm run migrate:reset
npm run dbrefresh

# STEP 4: Copy file from S3 to dbt project
cd ../data/migration/stage_pmda_for_migration/seeds
rm -f raw_pmda_s3_file_list.csv
aws s3 cp s3://${PMDA_S3_BUCKET}/s3_file_list.csv raw_pmda_s3_file_list.csv

# STEP 5: Run the data build tool project
cd ..
dbt deps
dbt build --target prod

# STEP 6: Copy files between buckets
cd ../../demos_data_tools
python migrate_files.py

# STEP 7: Copy data from staging to app schema
python load_staged_data_to_demos_app.py

# STEP 8: Take a snapshot of the migration data
python snapshot_migration_schema.py
```
