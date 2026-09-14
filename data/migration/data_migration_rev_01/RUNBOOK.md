# Migration Runbook

This is the migration runbook for the first revision migration of data moving from PMDA to DEMOS. This is intended to help guide the execution on the day of the migration, as well as to provide guidance for DevOps as they implement the code.

## Starting State Assumptions

This runbook assumes that the process starts from the following state; the assumption is that the environment is production unless otherwise specified.

- A PostgreSQL instance is running which is hosting the following schemas:
  - `demos_app`
  - `legacy_pmda_raw`
  - `legacy_pmda_staged`
  - `legacy_pmda_migration_rev_01`
  - `legacy_pmda_staged_20260814_162550_et`
- A user is available for the migration which can:
  - read all data in `demos_app`;
  - read all data in `legacy_pmda_raw`;
  - read all data in `legacy_pmda_staged`, and;
  - write to `legacy_pmda_migration_rev_01`.
- An S3 bucket is available with a file list that matches the file list found in `legacy_pmda_staged.raw_pmda_s3_file_list`.
- An S3 bucket is available for clean files to be loaded to; this will be the standard bucket used by the DEMOS application.
- The following environment variables are defined:
  - `DEMOS_AWS_HOST`
  - `DEMOS_AWS_PORT`
  - `DEMOS_AWS_USER`
  - `DEMOS_AWS_PWD`
  - `DEMOS_AWS_DB`
  - `DEMOS_AWS_SSLMODE`
  - `PMDA_S3_BUCKET`
  - `DEMOS_S3_BUCKET`
- The file `/workspaces/demos/data/migration/data_migration_rev_01/profiles.yml` has been created from `profiles.yml.example`.
  - The environment variables in `profiles.yml` have been configured in the execution environment to point to the same configuration as the `DEMOS_` records above.
- The environment variable `DEVCONTAINER` is either unset or set to a value other than `"true"`. This controls the specific AWS environment that the code attempts to interact with.

## General Migration Steps

This is the general flow of the migration process.

1. The dbt project called `data_migration_rev_01` is run, which loads multiple tables into `legacy_pmda_migration_rev_01`.
2. Files are copied between S3 buckets based on tables in `legacy_pmda_migration_rev_01`.
3. Data is copied from the final tables in `legacy_pmda_migration_rev_01` into `demos_app`.
4. A snapshot of the contents of `legacy_pmda_migration_rev_01` is taken into a timestamped schema so a record of what was migrated is kept.
5. A series of small post-migration fixes are manually executed in an interactive SQL session. Specifically, ...


## Specific Commands

Below are the specific commands that would execute each of these steps. This assumes the following:

- Execution starts from the `data/` folder within the project.
- A Python virtual environment called `demos-data` has been installed at `/opt/demos-data`, based on the `requirements.txt` file found in `.devcontainer/python`.

```bash
#!/usr/bin/bash
# Stop on any errors
set -e

# Activate the Python virtual environment; the path may be different when running in production
source /opt/demos-data/bin/activate

# STEP 1: Run the dbt project
cd migration/data_migration_rev_01
dbt deps
dbt build --target prod

# STEP 2: Copy files between buckets
cd ../../demos_data_tools
python migrate_files.py demos-aws rev01

# STEP 3: Copy data between schemas
python load_data_to_demos_app.py demos-aws rev01

# STEP 4: Take a snapshot of the migration
python snapshot_migration_schema.py demos-aws rev01
```
