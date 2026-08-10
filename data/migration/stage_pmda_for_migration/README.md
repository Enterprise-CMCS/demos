# Stage PMDA for Migration

This is a simple `dbt` project intended to take data from `legacy_pmda_raw` and stage it for insert into `demos_app`. It is a work in progress.

## Patterns

### Models

Models are organized into `cleaned`, `errors`, and domains like `users`. Model names are prefixed with their folder so they are easier to inspect in the database.

### Cleaned

The `cleaned/final` folder contains tables that are intended to be essentially 1:1 with `demos_app`. The `cleaned` models above them are generally unioned together to create the final product.

### Errors

Records being filtered out of final products due to data quality reasons should be placed in a corresponding `errors` table. Then, the final product should be filtered using the contents of those tables.

### Tests & Contracts

In general, tests should be written at the `error` level to start, and then lowered to `warn` if it makes sense. In `dbt`, if you do not configure the severity, it will default to `error`.

A general pattern is that `final` objects have tests that must error, as they are at the end of the process and all invalid data should have been filtered out by then. In contrast, `errors` objects should have tests that warn, so that when filtering is occurring due to data quality issues, it is surfaced in logs.

Tests should also be written to validate things that might normally be enforced by a database, since PMDA did not have as many constraints actually enabled. These can be either `warn` or `error` depending on how the downstream code will control for these issues. In addition, it is a good idea to write tests on crosswalk tables to ensure that they accurately map the data in `legacy_pmda_raw`.

Try to name your tests in a descriptive manner, either by naming the file with something like `assert_xyz` or using the `name:` parameter in the YAML file.

Contracts are enforced on the `cleaned/final` models and the documentation in `models.yml` should conform to the data types in `demos_app`. This enforcement prevents the SQL from creating incompatible data types.

## Local Development Setup / Commands

### Credentials and Configuration

You can use the scripts found in `data/migration/scripts` to help set up and run things locally. You'll need to set up your credentials in a few places.

- Ensure you've rebuilt your `devcontainer` recently to ensure that you have the correct Python setup (which includes `dbt`).
- Copy `data/demos_data_tools/.env.example` to `data/demos_data_tools/.env` and fill in the credentials accordingly. All the Python scripts in `demos_data_tools` rely on the configuration in this `.env` file.
- Copy `data/migration/stage_pmda_for_migration/profiles.yml.example` to `data/migration/stage_pmda_for_migration/profiles.yml` and configure the `dev` connection correctly.
- Obtain a set of short-lived AWS credentials and put them into `~/.aws/credentials`, replacing the `[default]` section. The `devcontainer` configures these with fake credentials by default to support the `localstack` tooling; however, you will need actual credentials to connect to S3 and pull the file list from there. These generally will expire on a short timeframe, so you will need to get them regularly.
  - Remember: the contents of `~/.aws/credentials` are overwritten whenever you rebuild your `devcontainer`, so you will need to get the keys again if you rebuild. Since they are not long-lived anyway, this is unlikely to come up frequently.

### Migration Scripts

There are scripts in `data/migration/scripts` to enable common local development tasks.

- `full_reset_and_end_to_end_run.sh` is a way to run the entire process end to end; since this involves pulling the raw data over from the PMDA MySQL copy, it takes longer, so you probably won't want to do this regularly. Remember, you'll need the short-lived AWS credentials for this script to work.
- `reset_from_raw.sh` is a way to reset your local environment to a fresh state. It removes existing tables and then recreates the raw and staging schemas, resets the application database, and removes the local file containing the S3 file list.
- `reset_from_staging.sh` is the command you'll use most often. It drops existing tables and then recreates the staging schema (where `dbt` operates), resets the application database, and removes and downloads the local file containing the S3 file list, which is loaded in as a seed (and not committed to Git).
  - Note that if you are editing models and you remove them, `dbt` **_does not_** clean up old tables. So you should regularly clean up the contents of `legacy_pmda_staged` to ensure that you remove old tables. Running ./reset_from_staging.sh` is an easy way to do this without wiping out the raw schema and requiring a longer load of data from MySQL to PostgreSQL.
  - Remember, like the full reset, you'll need the short-lived AWS credentials for this script to work.

### Getting Started

Run `dbt deps` to install the packages used in this project, and then `dbt debug` to check that your setup is functioning. Once it is, you can just use `dbt build` to rebuild the project. For your initial run, you can use `./full_reset_and_end_to_end_run.sh` since you need to make a copy of PMDA into the raw schema.

### Regular Development

Whenever you want to start fresh from staging without reloading the raw data, use `./reset_from_staging.sh` to do so. You'll need to do this any time you've loaded data into `demos_app` and want to try again, since otherwise, DEMOS will block duplicates of certain types of records.

You can use `dbt build` to rebuild the project, which loads data into `legacy_pmda_staged`. `dbt` does a drop and reload each time, so you can just run this command as many times as you want, keeping in mind the note above about `dbt` not cleaning up old tables.

When you want to load data from the staging schema into `demos_app`, use the `load_staged_data_to_demos_app.py` script in `data/demos_data_tools`.

### Other Useful Commands

You can use `dbt-codegen` to generate a sources.yml style file for a schema. Note that if you point directly at the existing sources.yml file, you will overwrite what is there! So be careful.

```sh
dbt --quiet run-operation generate_source --args '{"schema_name": "legacy_pmda_raw", "generate_columns": true}' > _legacy_pmda_raw_source.yml
dbt --quiet run-operation generate_source --args '{"schema_name": "demos_app", "generate_columns": true}' > _demos_app_source.yml
```

This is a useful command to show which of the sources are in use (so you can make sure they are tagged as `source_in_use`, which makes it easier to filter the graph view.) That tag is added automatically to all seeds as well.

```sh
dbt ls --select "resource_type:source,+resource_type:model" "resource_type:source,+resource_type:test" --output name
```

## Documentation

You can generate `dbt` documentation using `dbt docs generate --static` for a static file, or `dbt docs generate && dbt docs serve`. However, when serving, the `devcontainer` hasn't been configured yet to make that port available and visible, so it's usually simpler to just do the static generation, and then look in `target/` for the `static_index.html` file.

You can use `--select` option on the Lineage Graph to only look at things that are in use by using `+tag:source_in_use+` as the argument. This gives you everything upstream and downstream of things tagged with `source_in_use` (hence the command discussed above). All the seeds already have this tag by default, but they need to be added to sources.

## Development Tooling

To help keep the SQL code in this project clean, there is a pre-commit hook that runs `sqlfluff lint`. This is also available on the command line, as is `sqlfluff fix`. Running it fixes most linter issues, though some may be unfixable automatically and will require you to fix them manually. The `sqlfluff` config lives in `data/.sqlfluff`.

## Conventions / Styling

Often in the final cleaned tables there is use for additional metadata columns which will not be exported to DEMOS. For instance, a record of the original ID used in PMDA assists with joining dependent tables. For these columns, we should denote their metadata status by prefixing an underscore to the column name. Ex: final_demos_app_person._legacy_users_id
