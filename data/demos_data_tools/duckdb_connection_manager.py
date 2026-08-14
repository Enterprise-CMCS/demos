"""Shared utility for initializing a duckdb connection with both PMDA mysql and DEMOS postgres."""

import os
from logging import getLogger
from typing import TYPE_CHECKING, Literal, assert_never

import duckdb

from logger_utils import config_logger

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn


logger = config_logger(getLogger(__name__))

PMDA_DDB_ATTACH_NAME = "ddb_pmda"
DEMOS_DDB_ATTACH_NAME = "ddb_demos"

type ConfigurationType = Literal["PMDA", "DEMOS"]


def _load_db_config_from_env(requested_config: ConfigurationType) -> dict:
    """Load the requested DB configuration from the environment.

    Args:
        requested_config (ConfigurationType): Which DB configuration to attempt to load.

    Returns:
        dict: A dictionary containing the requested database configuration.

    Raises:
        KeyError: When loading from the environment fails due to a KeyError (missing env var).
        RuntimeError: When loading from the environment fails for non-KeyError reasons.
    """
    logger.info(f"Attempting to load {requested_config} config from environment")

    try:
        if requested_config == "PMDA":
            config = {
                "host": os.environ["PMDA_MYSQL_HOST"],
                "port": os.environ["PMDA_MYSQL_PORT"],
                "user": os.environ["PMDA_MYSQL_USER"],
                "pwd": os.environ["PMDA_MYSQL_PWD"],
                "db": os.environ["PMDA_MYSQL_DB"],
            }
        elif requested_config == "DEMOS":
            config = {
                "host": os.environ["DEMOS_PGSQL_HOST"],
                "port": os.environ["DEMOS_PGSQL_PORT"],
                "user": os.environ["DEMOS_PGSQL_USER"],
                "pwd": os.environ["DEMOS_PGSQL_PWD"],
                "db": os.environ["DEMOS_PGSQL_DB"],
                "sslmode": os.environ["DEMOS_PGSQL_SSLMODE"],
            }
        else:
            assert_never(requested_config)
    except KeyError:
        err_msg = f"A KeyError occurred while loading the {requested_config} credentials from the environment."
        logger.error(err_msg)
        raise KeyError(err_msg) from None
    except Exception:
        err_msg = (
            f"An unhandled exception occurred while loading the {requested_config} credentials from the environment."
        )
        logger.error(err_msg)
        raise RuntimeError(err_msg) from None

    logger.info(f"Loaded {requested_config} config from environment")
    return config


def create_duckdb_conn() -> "DuckConn":
    """Create a proper DuckDB connection with an in-memory DB and extensions mounted.

    Note: this no longer mounts the databases as this is done in separate functions.

    Returns:
        DuckConn: An instantiated DuckDB connection.
    """
    logger.info("Creating DuckDB database")
    conn = duckdb.connect(":memory:", config={"memory_limit": "2GB", "threads": 2})
    conn.install_extension("postgres")
    conn.install_extension("mysql")
    return conn


def attach_pmda_to_conn(conn: "DuckConn") -> "DuckConn":
    """Attach the PMDA database to a DuckDB connection.

    Args:
        conn (DuckConn): A DuckDB connection to which the PMDA database should be attached.

    Returns:
        DuckConn: The DuckDB connection with the attached PMDA database.

    Raises:
        RuntimeError: Generally raised if any connection issues occur; done to block leaking credentials in logs.
    """
    conn.load_extension("mysql")
    ddb_pmda_config = _load_db_config_from_env("PMDA")
    clean_pmda_pwd = ddb_pmda_config["pwd"].replace("'", "''")

    try:
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
    except Exception:
        err_msg = "An error occurred while attempting to attach the PMDA database."
        logger.error(err_msg)
        raise RuntimeError(err_msg) from None

    logger.info(f"Attached PMDA MySQL database AS {PMDA_DDB_ATTACH_NAME}")
    return conn


def attach_demos_to_conn(conn: "DuckConn") -> "DuckConn":
    """Attach the DEMOS database to a DuckDB connection.

    Args:
        conn (DuckConn): A DuckDB connection to which the DEMOS database should be attached.

    Returns:
        DuckConn: The DuckDB connection with the attached DEMOS database.

    Raises:
        RuntimeError: Generally raised if any connection issues occur; done to block leaking credentials in logs.
    """
    conn.load_extension("postgres")
    ddb_demos_config = _load_db_config_from_env("DEMOS")
    clean_demos_pwd = ddb_demos_config["pwd"].replace("'", "''")

    try:
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
    except Exception:
        err_msg = "An error occurred while attempting to attach the DEMOS database."
        logger.error(err_msg)
        raise RuntimeError(err_msg) from None

    logger.info(f"Attached DEMOS PostgreSQL database AS {DEMOS_DDB_ATTACH_NAME}")
    return conn
