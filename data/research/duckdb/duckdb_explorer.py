"""Test out various DuckDB functions that may be useful for the project."""

import configparser

from typing import List, Tuple
import duckdb


DATA_CONVERSIONS = {
    "datetime": "timestamp",
    "float": "real",
    "int": "integer",
    "longtext": "text",
    "mediumtext": "text",
    "timestamp": "timestamptz",
    "tinyint": "smallint",
}


def parse_config() -> dict:
    """Parse the configuration file and return a dictionary.

    Returns:
        dict: A dictionary containing the database configuration(s).
    """
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
    return config


def create_duckdb_conn(config: dict) -> duckdb.DuckDBPyConnection:
    """Take the config and create a proper DuckDB connection.

    Args:
        config (dict): A configuration for the two databases being connected.

    Returns:
        duckdb.DuckDBPyConnection: A configured DuckDB connection.
    """
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
    conn.execute(f"ATTACH '{postgres_attach_str}' AS postgres_db (TYPE postgres);")

    mysql_attach_str = (
        f"host={config['dev-mysql']['host']} "
        + f"port={config['dev-mysql']['port']} "
        + f"user={config['dev-mysql']['user']} "
        + f"passwd={config['dev-mysql']['password']} "
        + f"db={config['dev-mysql']['database']}"
    )
    conn.execute(f"ATTACH '{mysql_attach_str}' AS mysql_db (TYPE mysql);")
    return conn


def get_table_list(conn: duckdb.DuckDBPyConnection, schema: str) -> List[str]:
    """Retrieve MySQL tables in a schema.

    Args:
        conn (duckdb.DuckDBPyConnection): The connection to use.
        schema (str): The schema to obtain tables from.

    Returns:
        List[str]: A list of the tables in the schema.
    """
    query = "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = $schema"
    result = conn.execute(query, {"schema": schema}).fetchall()
    result = [x[0] for x in result]
    return result


def get_column_details(conn: duckdb.DuckDBPyConnection, schema: str, tbl_list: List[str]) -> dict:
    """Retrieve column data from MySQL for a list of tables.

    Args:
        conn (duckdb.DuckDBPyConnection): The connection to use.
        schema (str): The schema of the tables.
        tbl_list (List[str]): The tables to get column information for.

    Returns:
        dict: A dictionary with results for every table.
    """
    # Pull columns table to local DuckDB to improve processing speed
    col_copy_qry = """
        CREATE TABLE mysql_columns AS
        SELECT * FROM mysql_db.information_schema.COLUMNS;
    """
    conn.execute(col_copy_qry)

    col_info_qry = """
        SELECT
            TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, COLUMN_DEFAULT, IS_NULLABLE, DATA_TYPE, COLUMN_TYPE
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
    return result


def generate_postgres_ddl(mysql_col_info: List[Tuple]) -> str:
    """Generate a PostgreSQL DDL from MySQL column info.

    Args:
        mysql_col_info (List[Tuple]): Column info from MySQL for the table.

    Returns:
        str: The DDL for an equivalent PostgreSQL table.
    """
    tbl_name = mysql_col_info[0][0]
    print(tbl_name)
    return "Being implemented"


config = parse_config()
duck_conn = create_duckdb_conn(config)
tbl_list = get_table_list(duck_conn, "cma_dev_11_1_000")
tbl_details = get_column_details(
    duck_conn,
    "cma_dev_11_1_000",
    tbl_list
)

# for x in tbl_details[tbl_list[0]]:
#     print(x)
