"""Shared utility for initializing a duckdb connection with both PMDA mysql and DEMOS postgres."""

from __future__ import annotations

import os

import duckdb
from logger import get_logger

from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from duckdb import DuckDBPyConnection as DuckConn


logger = get_logger(__name__)

PMDA_DDB_ATTACH_NAME = "ddb_pmda"
DEMOS_DDB_ATTACH_NAME = "ddb_demos"


def load_db_configs_from_env() -> dict:
    """Load the DB configurations from the environment.

    Returns:
        dict: A dictionary containing the database configuration(s).
    """
    logger.info("Reading environment variables")
    config = {
        PMDA_DDB_ATTACH_NAME: {
            "host": os.environ["PMDA_MYSQL_HOST"],
            "port": os.environ["PMDA_MYSQL_PORT"],
            "user": os.environ["PMDA_MYSQL_USER"],
            "pwd": os.environ["PMDA_MYSQL_PWD"],
            "db": os.environ["PMDA_MYSQL_DB"],
        },
        DEMOS_DDB_ATTACH_NAME: {
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


def create_duckdb_conn(config: dict | None = None) -> "DuckConn":
    """Take the config and create a proper DuckDB connection.

    Args:
        config (dict | None): A configuration for the two databases being connected.
            When omitted, the configuration is loaded from environment variables.

    Returns:
        "DuckConn": A configured DuckDB connection.
    """
    logger.info("Creating DuckDB database")

    if config is None:
        config = load_db_configs_from_env()

    # In-memory DB
    conn = duckdb.connect(":memory:", config={"memory_limit": "8GB", "threads": 8})

    # DEMOS PostgreSQL Connection
    conn.install_extension("postgres")
    conn.load_extension("postgres")

    ddb_demos_config = config[DEMOS_DDB_ATTACH_NAME]
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

    conn.execute(f"ATTACH 'sslmode={ddb_demos_config['sslmode']}' AS {DEMOS_DDB_ATTACH_NAME} (TYPE postgres);")
    conn.execute("SET pg_null_byte_replacement=''")  # This is necessary to handle nulls from MySQL
    logger.info("Attached DEMOS PostgreSQL database AS %s", DEMOS_DDB_ATTACH_NAME)

    # PMDA MySQL Connection
    conn.install_extension("mysql")
    conn.load_extension("mysql")

    ddb_pmda_config = config[PMDA_DDB_ATTACH_NAME]
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

    conn.execute(f"ATTACH '' AS {PMDA_DDB_ATTACH_NAME} (TYPE mysql);")
    logger.info("Attached PMDA MySQL database AS %s", PMDA_DDB_ATTACH_NAME)
    return conn
