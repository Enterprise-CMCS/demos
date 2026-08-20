"""Manage schemas used in migration."""

import argparse
import os
from dataclasses import dataclass
from logging import getLogger
from typing import TYPE_CHECKING, Literal, assert_never, cast, get_args

from dotenv import load_dotenv

from duckdb_connection_manager import (
    DDB_CONFIG_ATTACH_NAMES,
    DemosDbConfigurationName,
    attach_demos_db_to_conn,
    create_duckdb_conn,
)
from logger_utils import config_logger

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn

logger = config_logger(getLogger(__name__))

load_dotenv()
RAW_SCHEMA = os.environ["RAW_SCHEMA"]
STAGING_SCHEMA = os.environ["STAGING_SCHEMA"]
REV01_SCHEMA = os.environ["REV01_SCHEMA"]

type MigrationSchemaName = Literal["raw", "staging", "rev01"]
type MigrationSchemaAction = Literal["create", "drop"]
MIGRATION_SCHEMAS = get_args(MigrationSchemaName)
MIGRATION_SCHEMA_ACTIONS = get_args(MigrationSchemaAction)
DEMOS_DB_CONFIGS = get_args(DemosDbConfigurationName)


@dataclass(frozen=True)
class CommandLineArguments:
    """The command line arguments passed into the program."""

    db_config: DemosDbConfigurationName
    schema_action: MigrationSchemaAction
    schema_name: MigrationSchemaName


def _parse_args() -> CommandLineArguments:
    """Create argument parser and parse incoming arguments.

    Returns:
        CommandLineArguments: The parsed command line arguments.
    """
    parser = argparse.ArgumentParser(description="Manage migration schemas for development use")
    parser.add_argument("db_config", choices=DEMOS_DB_CONFIGS, help="The DEMOS DB config to use")
    parser.add_argument("schema_action", choices=MIGRATION_SCHEMA_ACTIONS, help="Schema action to perform")
    parser.add_argument("schema_name", choices=MIGRATION_SCHEMAS, help="Migration schema to manage")
    parsed_args = parser.parse_args()

    return CommandLineArguments(
        db_config=cast(DemosDbConfigurationName, parsed_args.db_config),
        schema_action=cast(MigrationSchemaAction, parsed_args.schema_action),
        schema_name=cast(MigrationSchemaName, parsed_args.schema_name),
    )


def _create_schema(conn: "DuckConn", db_config: DemosDbConfigurationName, schema: MigrationSchemaName) -> None:
    """Create one of the migration schemas.

    Args:
        conn (DuckConn): A DuckDB connection with a DEMOS DB attached.
        db_config (DemosDbConfigurationName): The DEMOS DB configuration to be used for the command.
        schema (MigrationSchemaName): Which schema to create.
    """
    match schema:
        case "raw":
            schema_to_create = RAW_SCHEMA
        case "staging":
            schema_to_create = STAGING_SCHEMA
        case "rev01":
            schema_to_create = REV01_SCHEMA
        case _:
            assert_never(schema)
    demos_ddb_attach_name = DDB_CONFIG_ATTACH_NAMES[db_config]

    logger.info(f"Attempting to create schema {schema_to_create}")
    conn.execute(f"""
        CREATE SCHEMA {demos_ddb_attach_name}.{schema_to_create};
    """)
    logger.info(f"Created schema {schema_to_create} successfully")


def _drop_schema(conn: "DuckConn", db_config: DemosDbConfigurationName, schema: MigrationSchemaName) -> None:
    """Drop one of the migration schemas.

    Args:
        conn (DuckConn): A DuckDB connection with a DEMOS DB attached.
        db_config (DemosDbConfigurationName): The DEMOS DB configuration to be used for the command.
        schema (MigrationSchemaName): Which schema to drop.
    """
    match schema:
        case "raw":
            schema_to_drop = RAW_SCHEMA
        case "staging":
            schema_to_drop = STAGING_SCHEMA
        case "rev01":
            schema_to_drop = REV01_SCHEMA
        case _:
            assert_never(schema)
    demos_ddb_attach_name = DDB_CONFIG_ATTACH_NAMES[db_config]

    logger.info(f"Attempting to drop schema {schema_to_drop}")
    conn.execute(f"""
        DROP SCHEMA IF EXISTS {demos_ddb_attach_name}.{schema_to_drop} CASCADE;
    """)
    logger.info(f"Dropped schema {schema_to_drop} successfully")


def main(args: CommandLineArguments) -> None:
    """Main program function."""
    conn = attach_demos_db_to_conn(create_duckdb_conn(), args.db_config)
    if args.schema_action == "create":
        _create_schema(conn, args.db_config, args.schema_name)
    elif args.schema_action == "drop":
        _drop_schema(conn, args.db_config, args.schema_name)
    else:
        assert_never(args.schema_action)


if __name__ == "__main__":
    args = _parse_args()
    main(args)
