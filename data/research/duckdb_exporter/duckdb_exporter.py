"""Testing out using DuckDB to ETL data from legacy system to new legacy schema."""

import argparse
import configparser
import logging
import sys
import types
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, List, Optional, Tuple, Type

import duckdb

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
DUCKDB_MYSQL_DB_NAME = "mysql_db"
DUCKDB_POSTGRES_DB_NAME = "postgres_db"
PG_SCHEMA = "legacy_pmda_raw"
MYSQL_SCHEMA = "cma_dev_11_1_000"

Path("logs").mkdir(parents=True, exist_ok=True)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
log_file = f"logs/log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
file_handler = logging.FileHandler(log_file)

log_formatter = logging.Formatter(
    "[%(asctime)s] %(levelname)-8s - %(funcName)s() in %(name)s[%(lineno)d]: %(message)s",
    "%Y-%m-%d %H:%M:%S %z"
)
console_handler.setFormatter(log_formatter)
file_handler.setFormatter(log_formatter)

logger.addHandler(console_handler)
logger.addHandler(file_handler)


def parse_config() -> dict:
    """Parse the configuration file and return a dictionary.

    Returns:
        dict: A dictionary containing the database configuration(s).
    """
    logger.info("Parsing config file")
    parser = configparser.ConfigParser()
    parser.read("dbinfo.ini")
    config = {}
    for section in ["dev-mysql", "dev-postgresql"]:
        config[section] = {
            "host": parser.get(section, "host"),
            "port": parser.get(section, "port"),
            "user": parser.get(section, "user"),
            "password": parser.get(section, "password"),
            "database": parser.get(section, "database"),
        }
    logger.info("Parsed config file successfully")
    return config


def create_duckdb_conn(config: dict) -> "DuckConn":
    """Take the config and create a proper DuckDB connection.

    Args:
        config (dict): A configuration for the two databases being connected.

    Returns:
        "DuckConn": A configured DuckDB connection.
    """
    logger.info("Creating DuckDB database")
    # In-memory DB
    conn = duckdb.connect(":memory:", config={"memory_limit": "8GB", "threads": 8})
    conn.install_extension("mysql")
    conn.load_extension("mysql")
    conn.install_extension("postgres")
    conn.load_extension("postgres")

    postgres_attach_str = (
        f"host={config['dev-postgresql']['host']} "
        + f"port={config['dev-postgresql']['port']} "
        + f"user={config['dev-postgresql']['user']} "
        + f"password={config['dev-postgresql']['password']} "
        + f"dbname={config['dev-postgresql']['database']}"
    )
    conn.execute(f"ATTACH '{postgres_attach_str}' AS {DUCKDB_POSTGRES_DB_NAME} (TYPE postgres);")
    conn.execute("SET pg_null_byte_replacement=''")  # This is necessary to handle nulls from MySQL
    logger.info(f"Attached PostgreSQL database AS {DUCKDB_POSTGRES_DB_NAME}")

    mysql_attach_str = (
        f"host={config['dev-mysql']['host']} "
        + f"port={config['dev-mysql']['port']} "
        + f"user={config['dev-mysql']['user']} "
        + f"passwd={config['dev-mysql']['password']} "
        + f"db={config['dev-mysql']['database']}"
    )
    conn.execute(f"ATTACH '{mysql_attach_str}' AS {DUCKDB_MYSQL_DB_NAME} (TYPE mysql);")
    logger.info(f"Attached MySQL database AS {DUCKDB_MYSQL_DB_NAME}")
    return conn


def get_table_list(conn: "DuckConn", schema: str = MYSQL_SCHEMA) -> List[str]:
    """Retrieve MySQL tables in a schema.

    Args:
        conn ("DuckConn"): The connection to use.
        schema (str, optional): The schema to obtain tables from.

    Returns:
        List[str]: A list of the tables in the schema.
    """
    logger.info(f"Querying table names from database for schema {schema}")
    query = "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = $schema"
    result = conn.execute(query, {"schema": schema}).fetchall()
    result = [x[0] for x in result]
    logger.info(f"Returned {len(result)} table names from database for schema {schema}")
    return result


def get_column_details(conn: "DuckConn", tbl_list: List[str], schema: str = MYSQL_SCHEMA) -> dict:
    """Retrieve column data from MySQL for a list of tables.

    Args:
        conn ("DuckConn"): The connection to use.
        tbl_list (List[str]): The tables to get column information for.
        schema (str, optional): The schema of the tables.

    Returns:
        dict: A dictionary with results for every table.
    """
    # Pull columns table to local DuckDB to improve processing speed
    logger.info("Copying columns table down to local DuckDB instance")
    col_copy_qry = f"""
        CREATE TABLE mysql_columns AS
        SELECT * FROM {DUCKDB_MYSQL_DB_NAME}.information_schema.COLUMNS;
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
        result[tbl] = conn.execute(col_info_qry, {"schema": schema, "name": tbl}).fetchall()
    logger.info(f"Queried column info for {len(tbl_list)} tables")
    return result


def make_column_definition(col_info: Tuple) -> str:
    """Generate a PostgreSQL column definition from a tuple of MySQL info.

    Args:
        col_info (Tuple): A tuple of information for a MySQL column.

    Returns:
        str: A line of a DDL defining that column.
    """
    logger.debug(f"Generating column definition line for column {col_info[0]}.{col_info[1]}")
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
    if '-' in tbl:
        logger.warning(f"Dashes found in table name {tbl}! Properly escaping it")
        tbl = '"' + tbl + '"'
    return tbl


def generate_postgres_ddl(tbl: str, col_info: List[Tuple], schema: str = PG_SCHEMA) -> dict:
    """Generate a PostgreSQL DDL from MySQL column info.

    Args:
        tbl (str): The name of the table to be created.
        col_info (List[Tuple]): Column info from MySQL for the table.
        schema (str, optional): Schema in which the new table should be created.

    Returns:
        dict: A dictionary with the DuckDB and regular versions of the DB.
    """
    logger.debug(f"Producing PostgreSQL DDL for table {tbl} in schema {schema}")
    col_lines = ",\n".join([make_column_definition(col) for col in col_info])
    tbl = sanitize_table_name(tbl)
    duckdb_first_line = f"DROP TABLE IF EXISTS {DUCKDB_POSTGRES_DB_NAME}.{schema}.{tbl};\n"
    duckdb_second_line = f"CREATE TABLE {DUCKDB_POSTGRES_DB_NAME}.{schema}.{tbl} (\n"
    regular_first_line = f"CREATE TABLE {schema}.{tbl} (\n"
    last_line = "\n);"
    result = {
        "duckdb": duckdb_first_line + duckdb_second_line + col_lines + last_line,
        "regular": regular_first_line + col_lines + last_line
    }
    logger.debug("PostgreSQL DDLs created successfully")
    return result


def save_ddl(tbl: str, ddl: str) -> None:
    """Save a DDL to a SQL file.

    Args:
        tbl (str): The table name (which will be used for the file name).
        ddl (str): The DDL to write out.
    """
    logger.debug(f"Saving DDL for table {tbl}")
    with open("ddls/" + tbl + ".sql", "w") as sql_file:
        sql_file.write(ddl)
    logger.debug("DDL saved successfully")
    return None


def transfer_table(conn: "DuckConn", tbl: str, mysql_schema: str = MYSQL_SCHEMA, pg_schema: str = PG_SCHEMA) -> None:
    """Transfer the contents of a MySQL table to a PostgreSQL table.

    Args:
        conn ("DuckConn"): The connection to use.
        tbl (str): The table name to be transferred.
        mysql_schema (str, optional): The MySQL schema from which to read.
        pg_schema (str, optional): The PostgreSQL schema to which data is written.
    """
    logger.debug(f"Attempting to transfer data for table {tbl}")
    tbl = sanitize_table_name(tbl)
    transfer_qry = f"""
        INSERT INTO
            {DUCKDB_POSTGRES_DB_NAME}.{pg_schema}.{tbl}
        SELECT
            *
        FROM
            {DUCKDB_MYSQL_DB_NAME}.{mysql_schema}.{tbl}
    """
    conn.execute(transfer_qry)
    logger.debug("Data transfer successful")
    return None


def main() -> None:
    """Execute main program function."""
    db_config = parse_config()
    duck_conn = create_duckdb_conn(db_config)
    tbl_list = get_table_list(duck_conn)
    tbl_details = get_column_details(
        duck_conn,
        tbl_list
    )
    tbl_ddls = {}
    for tbl, col_data in tbl_details.items():
        tbl_ddls[tbl] = generate_postgres_ddl(tbl, col_data)

    for tbl, ddl in tbl_ddls.items():
        save_ddl(tbl, ddl["regular"])
        logger.debug(f"Attempting to create PostgreSQL table {tbl}")
        duck_conn.execute(ddl["duckdb"])
    for tbl in tbl_ddls.keys():
        transfer_table(duck_conn, tbl)
    return None


def custom_excepthook(e_type: Type[BaseException], val: BaseException, trace: Optional[types.TracebackType]) -> None:  # pragma: no cover # noqa: E501
    """Log exceptions via the logger rather than stderr.

    Args:
        e_type (Type[BaseException]): The type of the exception.
        val (BaseException): The exception instance.
        trace (Optional[types.TracebackType]): The traceback object.
    """
    logger.error(
        "Unhandled exception",
        exc_info=(e_type, val, trace)
    )
    return None


sys.excepthook = custom_excepthook

if __name__ == "__main__":  # pragma: no cover
    argparser = argparse.ArgumentParser()
    argparser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    args = argparser.parse_args()
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    main()
