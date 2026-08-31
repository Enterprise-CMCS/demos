"""Copy a migration data schema from AWS to localstack for development purposes."""

import argparse
from dataclasses import dataclass

from duckdb_connection_manager import create_duckdb_conn, attach_db_to_duckdb_conn
from duckdb_utilities import get_table_list_for_schema, select_table_from_source_to_target
from types_constants import MIGRATION_SCHEMA_SHORT_NAMES, MigrationSchemaName
from manage_migration_schemas import get_migration_schema_name_from_short_name


@dataclass(frozen=True)
class CommandLineArguments:
    """The command line arguments passed into the program."""

    schema_to_copy: MigrationSchemaName


def _parse_args() -> CommandLineArguments:
    """Create argument parser and parse incoming arguments.

    Returns:
        CommandLineArguments: The parsed argument namespace.
    """
    parser = argparse.ArgumentParser(
        description="Copy a migration schema from AWS to localstack.",
        formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50),
    )
    parser.add_argument(
        "schema_to_copy", choices=MIGRATION_SCHEMA_SHORT_NAMES, help="The name of the migration schema to copy"
    )
    parsed_args = parser.parse_args()
    return CommandLineArguments(
        schema_to_copy=get_migration_schema_name_from_short_name(parsed_args.schema_to_copy),
    )


def main(args: CommandLineArguments):
    """Main program function."""
    db_conn = attach_db_to_duckdb_conn(attach_db_to_duckdb_conn(create_duckdb_conn(), "demos-aws"), "demos-localstack")
    tables_to_copy = get_table_list_for_schema("ddb_demos_aws", args.schema_to_copy, db_conn)
    for table_to_copy in tables_to_copy.table_list:
        select_table_from_source_to_target(
            source_attach_name="ddb_demos_aws",
            target_attach_name="ddb_demos_localstack",
            source_schema_name=tables_to_copy.schema_name,
            target_schema_name=tables_to_copy.schema_name,
            table_name=table_to_copy,
            conn=db_conn,
        )


if __name__ == "__main__":  # pragma: nocover
    args = _parse_args()
    main(args)
