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

## Setup / Commands

Ensure you have rebuilt your `devcontainer` recently so that the Python setup is in place. Copy `profiles.yml.example` to `profiles.yml` and configure the `dev` connection as needed. You should be able to use the local copy of the database as long as you have a copy of PMDA in `legacy_pmda_raw` (see the `demos_data_tools` package for how to get this).

You will also need a staging schema to work in. On your local DB copy, run `CREATE SCHEMA legacy_pmda_staged` - this will eventually be automated as part of the `demos_data_tools` packaging.

Run `dbt deps` to install the packages used in this project, and then `dbt debug` to check that your setup is functioning. Once it is, you can just use `dbt build` to rebuild the project.

Note that if you are editing models and you remove them, `dbt` **_does not_** clean up old tables. So you should regularly drop the contents of `legacy_pmda_staged` to ensure that you remove old tables.

You can use `dbt-codegen` to generate a sources.yml style file for a schema. Note that if you point directly at the existing sources.yml file, you will overwrite what is there! So be careful.

```sh
dbt --quiet run-operation generate_source --args '{"schema_name": "legacy_pmda_raw", "generate_columns": true}' > _legacy_pmda_raw_source.yml
dbt --quiet run-operation generate_source --args '{"schema_name": "demos_app", "generate_columns": true}' > _demos_app_source.yml
```

This is a useful command to show which of the sources are in use (so you can make sure they are tagged as `source_in_use`, which makes it easier to filter the graph view.) That tag is added automatically to all seeds as well.

```sh
dbt ls --select "resource_type:source,+resource_type:model" \
                "resource_type:source,+resource_type:test" \
       --output name
```

## Documentation

You can generate `dbt` documentation using `dbt docs generate --static` for a static file, or `dbt docs generate && dbt docs serve`. However, when serving, the `devcontainer` hasn't been configured yet to make that port available and visible, so it's usually simpler to just do the static generation, and then look in `target/` for the `static_index.html` file.

You can use `--select` option on the Lineage Graph to only look at things that are in use by using `+tag:source_in_use+` as the argument. This gives you everything upstream and downstream of things tagged with `source_in_use` (hence the command discussed above). All the seeds already have this tag by default, but they need to be added to sources.

## Development Tooling

To help keep the SQL code in this project clean, there is a pre-commit hook that runs `sqlfluff lint`. This is also available on the command line, as is `sqlfluff fix`. Running it fixes most linter issues, though some may be unfixable automatically and will require you to fix them manually. The `sqlfluff` config lives in `data/.sqlfluff`.

## Conventions / Styling

Often in the final cleaned tables there is use for additional metadata columns which will not be exported to DEMOS. For instance, a record of the original ID used in PMDA assists with joining dependent tables. For these columns, we should denote their metadata status by prefixing an underscore to the column name. Ex: final_demos_app_person._legacy_id
