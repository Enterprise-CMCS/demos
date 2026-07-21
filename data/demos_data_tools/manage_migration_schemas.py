"""Manage schemas used in migration. Currently for development use only inside the devcontainer."""

import argparse
import os
from logging import getLogger
from typing import TYPE_CHECKING, Literal

from dotenv import load_dotenv

from check_if_in_devcontainer import check_if_in_devcontainer
from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, create_duckdb_conn
from logger_utils import config_logger

if TYPE_CHECKING:
    from argparse import Namespace

    from duckdb import DuckDBPyConnection as DuckConn

logger = config_logger(getLogger(__name__))

load_dotenv()
RAW_SCHEMA = os.environ["RAW_SCHEMA"]
STAGING_SCHEMA = os.environ["STAGING_SCHEMA"]

MigrationSchemaType = Literal["raw", "staging"]


def _parse_args() -> "Namespace":
    """Create argument parser and parse incoming arguments.

    Returns:
        Namespace: The parsed argument namespace.
    """
    parser = argparse.ArgumentParser(description="Manage migration schemas for development use")
    parser.add_argument("action", choices=["create", "drop"], help="Schema action to perform")
    parser.add_argument("schema", choices=["raw", "staging"], help="Migration schema to manage")
    return parser.parse_args()


def _create_schema(conn: "DuckConn", which: MigrationSchemaType) -> None:
    """Create one of the migration schemas.

    Args:
        conn (DuckConn): A DuckDB connection to the DEMOS database.
        which (MigrationSchemaType): Which schema to create (one of "raw", "staging").
    """
    match which:
        case "raw":
            schema = RAW_SCHEMA
        case "staging":
            schema = STAGING_SCHEMA

    logger.info(f"Attempting to create schema {schema}")
    conn.execute(f"""
        CREATE SCHEMA IF NOT EXISTS {DEMOS_DDB_ATTACH_NAME}.{schema};
    """)
    logger.info(f"Created schema {schema} successfully")


def _drop_schema(conn: "DuckConn", which: MigrationSchemaType) -> None:
    """Drop one of the migration schemas.

    Args:
        conn (DuckConn): A DuckDB connection to the DEMOS database.
        which (MigrationSchemaType): Which schema to drop (one of "raw", "staging").
    """
    match which:
        case "raw":
            schema = RAW_SCHEMA
        case "staging":
            schema = STAGING_SCHEMA

    logger.info(f"Attempting to drop schema {schema}")
    conn.execute(f"""
        DROP SCHEMA IF EXISTS {DEMOS_DDB_ATTACH_NAME}.{schema} CASCADE;
    """)
    logger.info(f"Dropped schema {schema} successfully")


def main(args: "Namespace") -> None:
    """Main program function."""
    check_if_in_devcontainer()
    conn = create_duckdb_conn()
    if args.action == "create":
        _create_schema(conn, args.schema)
    elif args.action == "drop":
        _drop_schema(conn, args.schema)


if __name__ == "__main__":
    args = _parse_args()
    main(args)
