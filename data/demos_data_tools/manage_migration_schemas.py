"""Manage schemas used in migration."""

import argparse
from dataclasses import dataclass
from logging import getLogger
from typing import TYPE_CHECKING, assert_never

from duckdb_connection_manager import (
    attach_db_to_duckdb_conn,
    create_duckdb_conn,
    get_attach_name_from_db_config_name,
)
from logger_utils import config_logger
from types_constants import (
    DB_CONFIG_NAMES,
    DEMOS_READ_ROLE,
    MIGRATION_SCHEMA_ACTIONS,
    MIGRATION_SCHEMA_SHORT_NAMES,
    DatabaseConfigurationName,
    DuckDbAttachName,
    MigrationSchemaAction,
    MigrationSchemaName,
    MigrationSchemaShortName,
)

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn

logger = config_logger(getLogger(__name__))


@dataclass(frozen=True)
class CommandLineArguments:
    """The command line arguments passed into the program."""

    db_config_name: DatabaseConfigurationName
    schema_action: MigrationSchemaAction
    schema_name: MigrationSchemaName


def get_migration_schema_name_from_short_name(schema_short_name: MigrationSchemaShortName) -> MigrationSchemaName:
    """Map an input name argument to a full MigrationSchemaName.

    Args:
        schema_short_name (MigrationSchemaShortName): The short name of the schema.

    Returns:
        MigrationSchemaName: The name of the schema.
    """
    schema_full_name: MigrationSchemaName
    match schema_short_name:
        case "raw":
            schema_full_name = "legacy_pmda_raw"
        case "staged":
            schema_full_name = "legacy_pmda_staged"
        case "rev01":
            schema_full_name = "legacy_pmda_migration_rev_01"
        case _:
            assert_never(schema_short_name)
    return schema_full_name


def _parse_args() -> CommandLineArguments:
    """Create argument parser and parse incoming arguments.

    Returns:
        CommandLineArguments: The parsed command line arguments.
    """
    parser = argparse.ArgumentParser(
        description="Manage migration schemas for development use",
        formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50),
    )
    parser.add_argument("db_config_name", choices=DB_CONFIG_NAMES, help="The name of the DB config to use")
    parser.add_argument("schema_action", choices=MIGRATION_SCHEMA_ACTIONS, help="The action to perform")
    parser.add_argument(
        "schema_name",
        choices=MIGRATION_SCHEMA_SHORT_NAMES,
        help="The short name of the schema to manage",
    )
    parsed_args = parser.parse_args()

    return CommandLineArguments(
        db_config_name=parsed_args.db_config_name,
        schema_action=parsed_args.schema_action,
        schema_name=get_migration_schema_name_from_short_name(parsed_args.schema_name),
    )


def _grant_read_permissions(conn: "DuckConn", attach_name: DuckDbAttachName, schema_name: MigrationSchemaName) -> None:
    """Run appropriate grants on a schema.

    We need to do this when creating a schema as otherwise the read-only configuration will be missing.

    Args:
        conn (DuckConn): A DuckDB connection with a DB attached.
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        schema_name (MigrationSchemaName): The name of the schema to which the standard grants should be applied.
    """
    logger.info(f"Attempting to run grants on schema {schema_name}")
    grant_queries = [
        f"GRANT USAGE ON SCHEMA {schema_name} TO {DEMOS_READ_ROLE};",
        f"GRANT SELECT ON ALL TABLES IN SCHEMA {schema_name} TO {DEMOS_READ_ROLE};",
        f"ALTER DEFAULT PRIVILEGES IN SCHEMA {schema_name} GRANT SELECT ON TABLES TO {DEMOS_READ_ROLE};",
    ]
    for query in grant_queries:
        conn.execute("CALL postgres_execute(?, ?);", [attach_name, query])
    logger.info(f"Granted read permissions on schema {schema_name} successfully")


def _create_schema(conn: "DuckConn", attach_name: DuckDbAttachName, schema_name: MigrationSchemaName) -> None:
    """Create one of the migration schemas.

    Args:
        conn (DuckConn): A DuckDB connection with a DB attached.
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        schema_name (MigrationSchemaName): The name of the schema to create.
    """
    logger.info(f"Attempting to create schema {schema_name}")
    conn.execute(f"""
        CREATE SCHEMA {attach_name}.{schema_name};
    """)
    logger.info(f"Created schema {schema_name} successfully")


def _drop_schema(conn: "DuckConn", attach_name: DuckDbAttachName, schema_name: MigrationSchemaName) -> None:
    """Drop one of the migration schemas.

    Args:
        conn (DuckConn): A DuckDB connection with a DB attached.
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        schema_name (MigrationSchemaName): The name of the schema to drop.
    """
    logger.info(f"Attempting to drop schema {schema_name}")
    conn.execute(f"""
        DROP SCHEMA IF EXISTS {attach_name}.{schema_name} CASCADE;
    """)
    logger.info(f"Dropped schema {schema_name} successfully")


def main(args: CommandLineArguments) -> None:
    """Main program function."""
    conn = attach_db_to_duckdb_conn(create_duckdb_conn(), args.db_config_name)
    attach_name = get_attach_name_from_db_config_name(args.db_config_name)
    if args.schema_action == "create":
        _create_schema(conn, attach_name, args.schema_name)
        _grant_read_permissions(conn, attach_name, args.schema_name)
    elif args.schema_action == "drop":
        _drop_schema(conn, attach_name, args.schema_name)
    else:
        assert_never(args.schema_action)


if __name__ == "__main__":  # pragma: nocover
    args = _parse_args()
    main(args)
