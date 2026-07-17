"""Testing out using DuckDB to ETL data from legacy system to new legacy schema."""

import argparse
import logging
import os
import sys
import types
from pathlib import Path
from typing import TYPE_CHECKING, List, Optional, Tuple, Type

from dotenv import load_dotenv

from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, PMDA_DDB_ATTACH_NAME, create_duckdb_conn
from logger_utils import get_logger

if TYPE_CHECKING:  # pragma: no cover
    from duckdb import DuckDBPyConnection as DuckConn

DATA_CONVERSIONS = {
    "datetime": "timestamp",
    "float": "real",
    "int": "integer",
    "longtext": "text",
    "mediumtext": "text",
    "smallint": "smallint",  # Putting this here avoids issues with unsigned items in MySQL
    "timestamp": "timestamptz",
    "tinyint": "smallint",
}

DDL_DIR = Path(Path(__file__).parent.parent, "migration", "pmda_ddls")
DDL_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv()

logger = get_logger(__name__)


def get_pmda_table_list(conn: "DuckConn", source_schema: str) -> List[str]:
    """Get a list of the PMDA tables in a given schema.

    Args:
        conn ("DuckConn"): The connection to use.
        source_schema (str): The schema to obtain tables from.

    Returns:
        List[str]: A list of the tables in the schema.
    """
    logger.info(f"Querying PMDA table names from database for schema {source_schema}")
    # Note: query runs against DuckDB information_schema
    query = """
        SELECT
            TABLE_NAME
        FROM
            information_schema.TABLES
        WHERE
            TABLE_CATALOG = $catalog
            AND TABLE_SCHEMA = $schema
    """
    result = conn.execute(query, {"catalog": PMDA_DDB_ATTACH_NAME, "schema": source_schema}).fetchall()
    result = [x[0] for x in result]
    logger.info(f"Returned {len(result)} table names from PMDA database for schema {source_schema}")
    return result


def get_pmda_column_details(conn: "DuckConn", tbl_list: List[str], source_schema: str) -> dict:
    """Retrieve column data from PMDA for a list of tables.

    Args:
        conn ("DuckConn"): The connection to use.
        tbl_list (List[str]): The tables to get column information for.
        source_schema (str): The schema of the tables.

    Returns:
        dict: A dictionary with results for every table.
    """
    # Pull columns table to local DuckDB to improve processing speed
    logger.info("Copying PMDA columns table down to local DuckDB instance")
    col_copy_qry = f"""
        CREATE TABLE mysql_columns AS
        SELECT * FROM {PMDA_DDB_ATTACH_NAME}.information_schema.COLUMNS;
    """
    conn.execute(col_copy_qry)
    logger.info("Local copy created")

    col_info_qry = """
        SELECT
            TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE, COLUMN_TYPE
        FROM
            mysql_columns
        WHERE
            TABLE_SCHEMA = $schema
            AND TABLE_NAME = $name
        ORDER BY
            ORDINAL_POSITION;
    """
    result = {}
    for tbl in tbl_list:
        result[tbl] = conn.execute(col_info_qry, {"schema": source_schema, "name": tbl}).fetchall()
    logger.info(f"Queried PMDA column info for {len(tbl_list)} tables")
    return result


def make_postgresql_column_definition(col_info: Tuple) -> str:
    """Generate a PostgreSQL column definition from a tuple of MySQL info.

    Args:
        col_info (Tuple): A tuple of information for a MySQL column.

    Returns:
        str: A line of a DDL defining that column.
    """
    logger.debug(f"Generating PostgreSQL column definition line for column {col_info[0]}.{col_info[1]}")
    col_name = col_info[1].lower()
    col_type = DATA_CONVERSIONS.get(col_info[3], col_info[4]).upper()

    # Put together the line and return
    result = f"    {col_name} {col_type}"
    logger.debug("Generated column definition line")
    return result


def sanitize_table_name(tbl: str) -> str:
    """Sanitize a table name to make it safe for one of the databases.

    Note that DuckDB requires use of double-quotes, regardless of MySQL behavior.

    Args:
        tbl (str): The table name.

    Returns:
        str: The safe table name.
    """
    if "-" in tbl:
        logger.warning(f"Dashes found in table name {tbl}! Properly escaping it")
        tbl = '"' + tbl + '"'
    return tbl


def generate_demos_ddl(tbl: str, col_info: List[Tuple], target_schema: str) -> dict:
    """Generate a DEMOS DDL from PMDA column info.

    Args:
        tbl (str): The name of the table to be created.
        col_info (List[Tuple]): Column info from PMDA for the table.
        target_schema (str): DEMOS schema in which the new table should be created.

    Returns:
        dict: A dictionary with the DuckDB and regular versions of the DB.
    """
    logger.debug(f"Producing DEMOS DDL for table {tbl} in schema {target_schema}")
    col_lines = ",\n".join([make_postgresql_column_definition(col) for col in col_info])
    tbl = sanitize_table_name(tbl)
    duckdb_first_line = f"DROP TABLE IF EXISTS {DEMOS_DDB_ATTACH_NAME}.{target_schema}.{tbl};\n"
    duckdb_second_line = f"CREATE TABLE {DEMOS_DDB_ATTACH_NAME}.{target_schema}.{tbl} (\n"
    regular_first_line = f"CREATE TABLE {target_schema}.{tbl} (\n"
    last_line = "\n);"
    result = {
        "duckdb": duckdb_first_line + duckdb_second_line + col_lines + last_line,
        "regular": regular_first_line + col_lines + last_line,
    }
    logger.debug("DEMOS DDLs created successfully")
    return result


def save_ddl(tbl: str, ddl: str) -> None:
    """Save a DDL to a SQL file.

    Args:
        tbl (str): The table name (which will be used for the file name).
        ddl (str): The DDL to write out.
    """
    logger.debug(f"Saving DDL for table {tbl}")
    with open(Path(DDL_DIR, f"{tbl}.sql"), "w") as sql_file:
        sql_file.write(ddl + "\n")
    logger.debug("DDL saved successfully")
    return None


def transfer_table(conn: "DuckConn", tbl: str, source_schema: str, target_schema: str) -> None:
    """Transfer the contents of a MySQL table to a PostgreSQL table.

    Args:
        conn ("DuckConn"): The connection to use.
        tbl (str): The table name to be transferred.
        source_schema (str): The source PMDA schema from which to read.
        target_schema (str): The target DEMOS scehma to which data is written.
    """
    logger.debug(f"Attempting to transfer data for table {tbl}")
    tbl = sanitize_table_name(tbl)
    transfer_qry = f"""
        INSERT INTO
            {DEMOS_DDB_ATTACH_NAME}.{target_schema}.{tbl}
        SELECT
            *
        FROM
            {PMDA_DDB_ATTACH_NAME}.{source_schema}.{tbl}
    """
    conn.execute(transfer_qry)
    logger.debug("Data transfer successful")
    return None


def main() -> None:
    """Execute main program function."""
    source_schema = os.environ["PMDA_EXPORT_SOURCE_SCHEMA"]
    target_schema = os.environ["PMDA_EXPORT_TARGET_SCHEMA"]
    duck_conn = create_duckdb_conn()
    tbl_list = get_pmda_table_list(duck_conn, source_schema)
    tbl_details = get_pmda_column_details(duck_conn, tbl_list, source_schema)

    tbl_ddls = {}
    for tbl, col_data in tbl_details.items():
        tbl_ddls[tbl] = generate_demos_ddl(tbl, col_data, target_schema)

    for tbl, ddl in tbl_ddls.items():
        save_ddl(tbl, ddl["regular"])
        logger.debug(f"Attempting to create DEMOS table {tbl}")
        duck_conn.execute(ddl["duckdb"])

    for tbl in tbl_ddls.keys():
        transfer_table(duck_conn, tbl, source_schema, target_schema)

    return None


def custom_excepthook(
    e_type: Type[BaseException], val: BaseException, trace: Optional[types.TracebackType]
) -> None:  # pragma: no cover # noqa: E501
    """Log exceptions via the logger rather than stderr.

    Args:
        e_type (Type[BaseException]): The type of the exception.
        val (BaseException): The exception instance.
        trace (Optional[types.TracebackType]): The traceback object.
    """
    logger.error("Unhandled exception", exc_info=(e_type, val, trace))
    return None


sys.excepthook = custom_excepthook

if __name__ == "__main__":  # pragma: no cover
    argparser = argparse.ArgumentParser()
    argparser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    args = argparser.parse_args()
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    main()
