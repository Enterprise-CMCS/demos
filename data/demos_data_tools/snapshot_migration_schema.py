"""Snapshot the migration schema into a timestamped schema."""

import argparse
from dataclasses import dataclass
from datetime import datetime
from logging import getLogger
from typing import TYPE_CHECKING, List
from zoneinfo import ZoneInfo

from duckdb_connection_manager import (
    attach_db_to_duckdb_conn,
    create_duckdb_conn,
    get_attach_name_from_db_config_name,
)
from load_data_to_demos_app_configs import get_data_load_configuration
from logger_utils import config_logger
from types_constants import DB_CONFIG_NAMES, DL_CONFIG_NAMES, DatabaseConfigurationName, DataLoadConfigurationName

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn

logger = config_logger(getLogger(__name__))


@dataclass(frozen=True)
class CommandLineArguments:
    """The command line arguments passed into the program."""

    db_config_name: DatabaseConfigurationName
    dl_config_name: DataLoadConfigurationName


def _parse_args() -> CommandLineArguments:
    """Create argument parser and parse incoming arguments.

    Returns:
        CommandLineArguments: The parsed argument namespace.
    """
    parser = argparse.ArgumentParser(
        description="Snapshot a target schema for a data load into a timestamped schema",
        formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50),
    )
    parser.add_argument("db_config_name", choices=DB_CONFIG_NAMES, help="The name of the DB config to use")
    parser.add_argument("dl_config_name", choices=DL_CONFIG_NAMES, help="The name of the data load config to use")
    parsed_args = parser.parse_args()
    return CommandLineArguments(
        db_config_name=parsed_args.db_config_name,
        dl_config_name=parsed_args.dl_config_name,
    )


def _get_list_of_snapshot_tables(
    db_config_name: DatabaseConfigurationName, dl_config_name: DataLoadConfigurationName, conn: "DuckConn"
) -> List[str]:
    """Get a list of tables to snapshot.

    The target_schema of the named DataLoadConfiguration is the one to be snapshotted.

    Args:
        db_config_name (DatabaseConfigurationName): The name of the DB config to use.
        dl_config_name (DataLoadConfigurationName): The name of the data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.

    Returns:
        List[str]: A list of the tables to snapshot.
    """
    attach_name = get_attach_name_from_db_config_name(db_config_name)
    data_load_config = get_data_load_configuration(dl_config_name)
    query = f"""
        SELECT
            table_name
        FROM
            {attach_name}.information_schema.tables
        WHERE
            table_schema = $data_schema;
    """
    logger.info("Getting list of tables to snapshot")
    result = conn.execute(query, {"data_schema": data_load_config.target_schema}).fetchall()
    return [row[0] for row in result]


def _create_snapshot_schema(
    db_config_name: DatabaseConfigurationName, dl_config_name: DataLoadConfigurationName, conn: "DuckConn"
) -> str:
    """Create a schema to place the snapshot tables in, using the current timestamp.

    Args:
        db_config_name (DatabaseConfigurationName): The name of the DB config to use.
        dl_config_name (DataLoadConfigurationName): The name of the data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.

    Returns:
        str: The schema that was created for snapshots.
    """
    attach_name = get_attach_name_from_db_config_name(db_config_name)
    data_load_config = get_data_load_configuration(dl_config_name)
    schema_name = (
        f"{data_load_config.target_schema}_{datetime.now(ZoneInfo('America/New_York')).strftime('%Y%m%d_%H%M%S_et')}"
    )
    logger.info(f"Creating snapshot schema {schema_name}")
    query = f"""
        CREATE SCHEMA {attach_name}.{schema_name};
    """
    conn.execute(query)
    return schema_name


def _select_table_into_snapshot_schema(
    db_config_name: DatabaseConfigurationName,
    dl_config_name: DataLoadConfigurationName,
    conn: "DuckConn",
    table_name: str,
    snapshot_schema: str,
) -> None:
    """Select a table from the staging schema into the snapshot schema.

    Args:
        db_config_name (DatabaseConfigurationName): The name of the DB config to use.
        dl_config_name (DataLoadConfigurationName): The name of the data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.
        table_name (str): The table to be snapshot into the snapshot schema.
        snapshot_schema (str): The snapshot schema where the table should be placed.
    """
    attach_name = get_attach_name_from_db_config_name(db_config_name)
    data_load_config = get_data_load_configuration(dl_config_name)
    query = f"""
        CREATE TABLE {attach_name}.{snapshot_schema}.{table_name} AS
        SELECT * FROM {attach_name}.{data_load_config.target_schema}.{table_name};
    """
    logger.info(f"Snapshotting table {table_name} into {snapshot_schema}")
    conn.execute(query)


def main(args: CommandLineArguments) -> None:
    """Main program function."""
    db_conn = attach_db_to_duckdb_conn(create_duckdb_conn(), args.db_config_name)
    snapshot_schema = _create_snapshot_schema(args.db_config_name, args.dl_config_name, db_conn)
    tables_to_snapshot = _get_list_of_snapshot_tables(args.db_config_name, args.dl_config_name, db_conn)
    for tbl in tables_to_snapshot:
        _select_table_into_snapshot_schema(args.db_config_name, args.dl_config_name, db_conn, tbl, snapshot_schema)


if __name__ == "__main__":
    args = _parse_args()
    main(args)
