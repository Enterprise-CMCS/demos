"""Testing out using DuckDB to ETL data from legacy system to new legacy schema."""

import argparse
import logging
import os
import sys
import types
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, List, Optional, Tuple, Type

import duckdb
from dotenv import load_dotenv

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
LOG_DIR = Path(Path(__file__).parent, "logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv()

logger = logging.getLogger(__name__)


def _configure_logging(verbose: bool = False) -> None:
    # Configure the log level
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    # Set up the two handlers
    console_handler = logging.StreamHandler()
    log_file = Path(LOG_DIR, f"log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    file_handler = logging.FileHandler(log_file)

    # Format the handlers
    log_formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)-8s - %(funcName)s() in %(name)s[%(lineno)d]: %(message)s",
        "%Y-%m-%d %H:%M:%S %z",
    )
    console_handler.setFormatter(log_formatter)
    file_handler.setFormatter(log_formatter)

    # Add the handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)


def load_db_configs_from_env() -> dict:
    """Load the DB configurations from the environment.

    Returns:
        dict: A dictionary containing the database configuration(s).
    """
    logger.info("Reading environment variables")
    config = {
        "ddb_pmda": {
            "host": os.environ["PMDA_MYSQL_HOST"],
            "port": os.environ["PMDA_MYSQL_PORT"],
            "user": os.environ["PMDA_MYSQL_USER"],
            "pwd": os.environ["PMDA_MYSQL_PWD"],
            "db": os.environ["PMDA_MYSQL_DB"],
        },
        "ddb_demos": {
            "host": os.environ["DEMOS_PGSQL_HOST"],
            "port": os.environ["DEMOS_PGSQL_PORT"],
            "user": os.environ["DEMOS_PGSQL_USER"],
            "pwd": os.environ["DEMOS_PGSQL_PWD"],
            "db": os.environ["DEMOS_PGSQL_DB"],
            "sslmode": os.environ["DEMOS_PGSQL_SSLMODE"],
        },
    }
    logger.info("Loading config from environment successfully")
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

    # DEMOS PostgreSQL Connection
    conn.install_extension("postgres")
    conn.load_extension("postgres")

    ddb_demos_config = config["ddb_demos"]
    clean_demos_pwd = ddb_demos_config["pwd"].replace("'", "''")
    conn.execute(f"""
        CREATE SECRET (
            TYPE postgres,
            HOST '{ddb_demos_config["host"]}',
            PORT {ddb_demos_config["port"]},
            DATABASE {ddb_demos_config["db"]},
            USER '{ddb_demos_config["user"]}',
            PASSWORD '{clean_demos_pwd}'
        );
    """)

    conn.execute(f"ATTACH 'sslmode={ddb_demos_config['sslmode']}' AS ddb_demos (TYPE postgres);")
    conn.execute("SET pg_null_byte_replacement=''")  # This is necessary to handle nulls from MySQL
    logger.info("Attached DEMOS PostgreSQL database AS ddb_demos")

    # PMDA MySQL Connection
    conn.install_extension("mysql")
    conn.load_extension("mysql")

    ddb_pmda_config = config["ddb_pmda"]
    clean_pmda_pwd = ddb_pmda_config["pwd"].replace("'", "''")
    conn.execute(f"""
        CREATE SECRET (
            TYPE mysql,
            HOST '{ddb_pmda_config["host"]}',
            PORT {ddb_pmda_config["port"]},
            DATABASE {ddb_pmda_config["db"]},
            USER '{ddb_pmda_config["user"]}',
            PASSWORD '{clean_pmda_pwd}'
        );
    """)

    conn.execute("ATTACH '' AS ddb_pmda (TYPE mysql);")
    logger.info("Attached PMDA MySQL database AS ddb_pmda")
    return conn


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
            TABLE_CATALOG = 'ddb_pmda'
            AND TABLE_SCHEMA = $schema
    """
    result = conn.execute(query, {"schema": source_schema}).fetchall()
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
    col_copy_qry = """
        CREATE TABLE mysql_columns AS
        SELECT * FROM ddb_pmda.information_schema.COLUMNS;
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
    duckdb_first_line = f"DROP TABLE IF EXISTS ddb_demos.{target_schema}.{tbl};\n"
    duckdb_second_line = f"CREATE TABLE ddb_demos.{target_schema}.{tbl} (\n"
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
            ddb_demos.{target_schema}.{tbl}
        SELECT
            *
        FROM
            ddb_pmda.{source_schema}.{tbl}
    """
    conn.execute(transfer_qry)
    logger.debug("Data transfer successful")
    return None


def main() -> None:
    """Execute main program function."""
    source_schema = os.environ["PMDA_EXPORT_SOURCE_SCHEMA"]
    target_schema = os.environ["PMDA_EXPORT_TARGET_SCHEMA"]
    db_config = load_db_configs_from_env()
    duck_conn = create_duckdb_conn(db_config)
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
    _configure_logging(args.verbose)
    main()
