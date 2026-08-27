"""Shared utility for initializing a DuckDB connection."""

import os
from logging import getLogger
from typing import TYPE_CHECKING, assert_never

import duckdb
from dotenv import load_dotenv

from logger_utils import config_logger
from types_constants import DatabaseConfigurationName, DuckDbAttachName

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn

logger = config_logger(getLogger(__name__))

load_dotenv()


def _load_db_params_from_env(db_config_name: DatabaseConfigurationName) -> dict:
    """Load the requested DB configuration from the environment.

    Args:
        db_config_name (DatabaseConfigurationName): The name of the DB config to attempt to load.

    Returns:
        dict: A dictionary containing the requested database configuration.

    Raises:
        KeyError: When loading from the environment fails due to a KeyError (missing env var).
        RuntimeError: When loading from the environment fails for non-KeyError reasons.
    """
    logger.info(f"Attempting to load {db_config_name} DB config from environment")

    try:
        if db_config_name == "demos-localstack":
            config = {
                "host": os.environ["DEMOS_LOCALSTACK_HOST"],
                "port": os.environ["DEMOS_LOCALSTACK_PORT"],
                "user": os.environ["DEMOS_LOCALSTACK_USER"],
                "pwd": os.environ["DEMOS_LOCALSTACK_PWD"],
                "db": os.environ["DEMOS_LOCALSTACK_DB"],
                "sslmode": os.environ["DEMOS_LOCALSTACK_SSLMODE"],
            }
        elif db_config_name == "demos-aws":
            config = {
                "host": os.environ["DEMOS_AWS_HOST"],
                "port": os.environ["DEMOS_AWS_PORT"],
                "user": os.environ["DEMOS_AWS_USER"],
                "pwd": os.environ["DEMOS_AWS_PWD"],
                "db": os.environ["DEMOS_AWS_DB"],
                "sslmode": os.environ["DEMOS_AWS_SSLMODE"],
            }
        else:
            assert_never(db_config_name)
    except KeyError:
        err_msg = f"A KeyError occurred while loading the {db_config_name} DB config from the environment."
        logger.error(err_msg)
        raise KeyError(err_msg) from None
    except Exception:
        err_msg = f"An unhandled exception occurred while loading the {db_config_name} DB config from the environment."
        logger.error(err_msg)
        raise RuntimeError(err_msg) from None

    logger.info(f"Loaded {db_config_name} DB config from environment")
    return config


def create_duckdb_conn() -> "DuckConn":
    """Create a proper DuckDB connection with an in-memory DB and extensions mounted.

    Returns:
        DuckConn: An instantiated DuckDB connection.
    """
    logger.info("Creating DuckDB database")
    conn = duckdb.connect(":memory:", config={"memory_limit": "2GB", "threads": 2})
    conn.install_extension("postgres")
    return conn


def get_attach_name_from_db_config_name(db_config_name: DatabaseConfigurationName) -> DuckDbAttachName:
    """Get the correct DuckDB attach name back from a DB config name.

    Note: Using this approach enforces that all db_config_name values have mappings.

    Args:
        db_config_name (DatabaseConfigurationName): The name of the DB config to get the attach name for.

    Returns:
        DuckDbAttachName: The DuckDB attach name for the named DB config.
    """
    attach_name: DuckDbAttachName
    match db_config_name:
        case "demos-localstack":
            attach_name = "ddb_demos_localstack"
        case "demos-aws":
            attach_name = "ddb_demos_aws"
        case _:
            assert_never(db_config_name)
    return attach_name


def attach_db_to_duckdb_conn(conn: "DuckConn", db_config_name: DatabaseConfigurationName) -> "DuckConn":
    """Attach a database to a DuckDB connection.

    Args:
        conn (DuckConn): A DuckDB connection to which the database should be attached.
        db_config_name (DatabaseConfigurationName): The name of the DB config to attach.

    Returns:
        DuckConn: The DuckDB connection with the attached DEMOS database.

    Raises:
        RuntimeError: Generally raised if any connection issues occur; done to block leaking credentials in logs.
    """
    conn.load_extension("postgres")
    ddb_demos_config = _load_db_params_from_env(db_config_name)
    clean_demos_pwd = ddb_demos_config["pwd"].replace("'", "''")
    attach_name = get_attach_name_from_db_config_name(db_config_name)

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
        conn.execute(f"ATTACH 'sslmode={ddb_demos_config['sslmode']}' AS {attach_name} (TYPE postgres);")
        conn.execute("SET pg_null_byte_replacement=''")  # This was previously necessary to handle NULLs from MySQL
    except Exception:
        err_msg = "An error occurred while attempting to attach the DEMOS database."
        logger.error(err_msg)
        raise RuntimeError(err_msg) from None

    logger.info(f"Attached DEMOS database AS {attach_name}")
    return conn
