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
from duckdb_utilities import get_table_list_for_schema, select_table_from_source_to_target
from load_data_to_demos_app_configs import get_data_load_configuration
from logger_utils import config_logger
from types_constants import (
    DB_CONFIG_NAMES,
    DL_CONFIG_NAMES,
    DatabaseConfigurationName,
    DataLoadConfiguration,
    DataLoadConfigurationName,
    DuckDbAttachName,
    SnapshotSchemaName,
)

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
    attach_name: DuckDbAttachName, dl_config: DataLoadConfiguration, conn: "DuckConn"
) -> List[str]:
    """Get a list of tables to snapshot.

    The target_schema of the named DataLoadConfiguration is the one to be snapshotted.

    Args:
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        dl_config (DataLoadConfiguration): The data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.

    Returns:
        List[str]: A list of the tables to snapshot.
    """
    logger.info("Getting list of tables to snapshot")
    result = get_table_list_for_schema(attach_name, dl_config.target_schema, conn)
    return result.table_list


def _create_snapshot_schema(
    attach_name: DuckDbAttachName, dl_config: DataLoadConfiguration, conn: "DuckConn"
) -> SnapshotSchemaName:
    """Create a schema to place the snapshot tables in, using the current timestamp.

    Args:
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        dl_config (DataLoadConfiguration): The data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.

    Returns:
        SnapshotSchemaName: The schema that was created for snapshots.
    """
    schema_name = f"{dl_config.target_schema}_{datetime.now(ZoneInfo('America/New_York')).strftime('%Y%m%d_%H%M%S_et')}"
    logger.info(f"Creating snapshot schema {schema_name}")
    query = f"""
        CREATE SCHEMA {attach_name}.{schema_name};
    """
    conn.execute(query)
    return SnapshotSchemaName(schema_name)


def _select_table_into_snapshot_schema(
    attach_name: DuckDbAttachName,
    dl_config: DataLoadConfiguration,
    conn: "DuckConn",
    table_name: str,
    snapshot_schema: SnapshotSchemaName,
) -> None:
    """Select a table from the staging schema into the snapshot schema.

    Args:
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        dl_config (DataLoadConfiguration): The data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.
        table_name (str): The table to be snapshot into the snapshot schema.
        snapshot_schema (SnapshotSchemaName): The snapshot schema where the table should be placed.
    """
    logger.info(f"Snapshotting table {table_name} into {snapshot_schema}")
    select_table_from_source_to_target(
        source_attach_name=attach_name,
        target_attach_name=attach_name,
        source_schema_name=dl_config.target_schema,
        target_schema_name=snapshot_schema,
        table_name=table_name,
        conn=conn,
    )


def main(args: CommandLineArguments) -> None:
    """Main program function."""
    db_conn = attach_db_to_duckdb_conn(create_duckdb_conn(), args.db_config_name)
    attach_name = get_attach_name_from_db_config_name(args.db_config_name)
    dl_config = get_data_load_configuration(args.dl_config_name)
    snapshot_schema = _create_snapshot_schema(attach_name, dl_config, db_conn)
    tables_to_snapshot = _get_list_of_snapshot_tables(attach_name, dl_config, db_conn)
    for tbl in tables_to_snapshot:
        _select_table_into_snapshot_schema(attach_name, dl_config, db_conn, tbl, snapshot_schema)


if __name__ == "__main__":
    args = _parse_args()
    main(args)
