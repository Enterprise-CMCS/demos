"""Snapshot the migration schema into a timestamped schema."""

import os
from logging import getLogger
from typing import TYPE_CHECKING, List
from datetime import datetime
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, attach_demos_to_conn, create_duckdb_conn
from logger_utils import config_logger

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn


logger = config_logger(getLogger(__name__))

load_dotenv()
STAGING_SCHEMA = os.environ["STAGING_SCHEMA"]


def get_list_of_snapshot_tables(conn: "DuckConn") -> List[str]:
    """Get a list of tables to snapshot.

    Args:
        conn (DuckConn): A DuckDB connection configured to connect to DEMOS.

    Returns:
        List[str]: A list of the tables to snapshot.
    """
    query = f"""
        SELECT
            table_name
        FROM
            {DEMOS_DDB_ATTACH_NAME}.information_schema.tables
        WHERE
            table_schema = $staging_schema;
    """
    logger.info("Getting list of tables to snapshot")
    result = conn.execute(query, {"staging_schema": STAGING_SCHEMA}).fetchall()
    return [row[0] for row in result]


def create_snapshot_schema(conn: "DuckConn") -> str:
    """Create a schema to place the snapshot tables in, using the current timestamp.

    Args:
        conn (DuckConn): The DuckDB connection to use to create the schema.

    Returns:
        str: The schema that was created for snapshots.
    """
    schema_name = f"{STAGING_SCHEMA}_{datetime.now(ZoneInfo('America/New_York')).strftime('%Y%m%d_%H%M%S_ET')}"
    logger.info(f"Creating snapshot schema {schema_name}")
    query = f"""
        CREATE SCHEMA {DEMOS_DDB_ATTACH_NAME}.{schema_name};
    """
    conn.execute(query)
    return schema_name


def select_table_into_snapshot_schema(conn: "DuckConn", table_name: str, snapshot_schema: str) -> None:
    """Select a table from the staging schema into the snapshot schema.

    Args:
        conn (DuckConn): The DuckDB connection to use for the snapshot.
        table_name (str): The table to be snapshot into the snapshot schema.
        snapshot_schema (str): The snapshot schema where the table should be placed.
    """
    query = f"""
        CREATE TABLE {DEMOS_DDB_ATTACH_NAME}.{snapshot_schema}.{table_name} AS
        SELECT * FROM {DEMOS_DDB_ATTACH_NAME}.{STAGING_SCHEMA}.{table_name};
    """
    logger.info(f"Snapshotting table {table_name} into {snapshot_schema}")
    conn.execute(query)


def main() -> None:
    """Main program function."""
    db_conn = attach_demos_to_conn(create_duckdb_conn())
    snapshot_schema = create_snapshot_schema(db_conn)
    tables_to_snapshot = get_list_of_snapshot_tables(db_conn)
    for tbl in tables_to_snapshot:
        select_table_into_snapshot_schema(db_conn, tbl, snapshot_schema)


if __name__ == "__main__":
    main()
