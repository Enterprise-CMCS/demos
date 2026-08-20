"""Perform load actions based on a configuration from a data migration schema into demos_app."""

import argparse
import dataclasses
import os
from logging import getLogger
from typing import TYPE_CHECKING, Set, Tuple, assert_never

from dotenv import load_dotenv

from duckdb_connection_manager import (
    DEMOS_DDB_ATTACH_NAME,
    DemosDbConfigurationName,
    attach_demos_to_conn,
    create_duckdb_conn,
)
from load_data_to_demos_app_configs import (
    AVAILABLE_DATA_LOAD_CONFIGURATIONS,
)
from load_data_to_demos_app_types import (
    ArbitraryActionConfiguration,
    DataLoadConfiguration,
    DataLoadSql,
    GeneratedArbitraryActionSql,
    GeneratedInsertActionSql,
    GeneratedSqlStatement,
    GeneratedTransactionActionSql,
    GeneratedTriggerActionSql,
    TableInsertActionConfiguration,
    TransactionActionConfiguration,
    TriggerActionConfiguration,
)
from logger_utils import config_logger

if TYPE_CHECKING:
    from argparse import Namespace

logger = config_logger(getLogger(__name__))

load_dotenv()


def _parse_args() -> "Namespace":
    """Create argument parser and parse incoming arguments.

    Returns:
        Namespace: The parsed argument namespace.
    """
    available_configs = [field.name for field in dataclasses.fields(AVAILABLE_DATA_LOAD_CONFIGURATIONS)]
    argparser = argparse.ArgumentParser()
    argparser.add_argument(
        "config_name",
        choices=available_configs,
        help="The name of a data load configuration specified in data_load_configurations.py",
    )
    argparser.add_argument("--dry-run", "-d", action="store_true", help="Print generated SQL to console but do not run")
    return argparser.parse_args()


def _generate_table_insert_sql(
    source_schema: str, target_schema: str, insert_config: TableInsertActionConfiguration
) -> GeneratedInsertActionSql:
    """Generate an insert statement from a TableInsertActionConfiguration.

    Args:
        source_schema (str): The schema to load from.
        target_schema (str): The schema to load to.
        insert_config (TableInsertActionConfiguration): The table configuration to be loaded.

    Returns:
        GeneratedInsertActionSql: The SQL query to be executed.
    """
    logger.info(f"Generating insert statement for {insert_config.source_table} to {insert_config.destination_table}")
    formatted_col_list = ", ".join(insert_config.column_list)
    query = f"""
        INSERT INTO
            {DEMOS_DDB_ATTACH_NAME}.{target_schema}.{insert_config.destination_table}
            ({formatted_col_list})
        SELECT
            {formatted_col_list}
        FROM
            {DEMOS_DDB_ATTACH_NAME}.{source_schema}.{insert_config.source_table};
    """
    return GeneratedInsertActionSql(insert_config, query)


def _generate_trigger_action_sql(trigger_config: TriggerActionConfiguration) -> GeneratedTriggerActionSql:
    """Generate an trigger action statement from a TriggerActionConfiguration.

    Note: By design, this will always run against the APP_SCHEMA, as the other schemas do not have triggers.

    Args:
        trigger_config (TriggerActionConfiguration): The trigger configuration to generate.

    Returns:
        GeneratedTriggerActionSql: The SQL query to be executed.
    """
    app_schema = os.environ["APP_SCHEMA"]
    logger.info(
        f"Generating control statement to {trigger_config.action_type} trigger "
        f"{trigger_config.target_table}.{trigger_config.target_trigger_name}"
    )

    if trigger_config.action_type == "disable":
        alter_statement = (
            f"ALTER TABLE {app_schema}.{trigger_config.target_table} "
            f"DISABLE TRIGGER {trigger_config.target_trigger_name};"
        )
    elif trigger_config.action_type == "enable":
        alter_statement = (
            f"ALTER TABLE {app_schema}.{trigger_config.target_table} "
            f"ENABLE TRIGGER {trigger_config.target_trigger_name};"
        )
    else:
        # This guards against the allowed values of a field expanding and causes it to be caught by type checking
        assert_never(trigger_config.action_type)

    # DuckDB has no concept of triggers, so we need to use the postgres_execute() function
    query = f"CALL postgres_execute('{DEMOS_DDB_ATTACH_NAME}', '{alter_statement}')"
    return GeneratedTriggerActionSql(trigger_config, query)


def _generate_transaction_action_sql(transact_config: TransactionActionConfiguration) -> GeneratedTransactionActionSql:
    """Generate an transaction action statement from a TriggerActionConfiguration.

    Args:
        transact_config (TransactionActionConfiguration): The transaction configuration to generate.

    Returns:
        GeneratedTransactionActionSql: The SQL query to be executed.
    """
    logger.info(f"Generating transaction statement of type {transact_config.action_type}.")

    if transact_config.action_type == "begin":
        query = "BEGIN;"
    elif transact_config.action_type == "commit":
        query = "COMMIT;"
    else:
        assert_never(transact_config.action_type)

    return GeneratedTransactionActionSql(transact_config, query)


def _generate_arbitrary_action_sql(
    arbitrary_action_config: ArbitraryActionConfiguration, db_config: DemosDbConfigurationName
) -> GeneratedArbitraryActionSql:
    """Generate an arbitrary action statement from an ArbitraryActionConfiguration.

    Args:
        arbitrary_action_config (ArbitraryActionConfiguration): The arbitrary action configuration to generate.

    Returns:
        GeneratedArbitraryActionSql: The SQL query to be executed.
    """
    arbitrary_action_config.sql_generator()
    return GeneratedArbitraryActionSql(arbitrary_action_config, arbitrary_action_config.sql_query)


def _generate_data_load_sql(data_load_config: DataLoadConfiguration) -> DataLoadSql:
    """Generate all the SQL for the data_load.

    Args:
        data_load_config (DataLoadConfiguration): The full data load configuration.

    Returns:
        DataLoadSql: The SQL generated from the configuration.
    """
    generated_sql: DataLoadSql = []
    result: GeneratedSqlStatement
    disabled_triggers: Set[Tuple[str, str]] = set()
    for config in data_load_config.data_load_actions:
        if isinstance(config, TableInsertActionConfiguration):
            result = _generate_table_insert_sql(data_load_config.source_schema, data_load_config.target_schema, config)
        elif isinstance(config, TriggerActionConfiguration):
            if config.action_type == "disable":
                disabled_triggers.add((config.target_table, config.target_trigger_name))
            elif config.action_type == "enable":
                disabled_triggers.remove((config.target_table, config.target_trigger_name))
            else:
                assert_never(config.action_type)
            result = _generate_trigger_action_sql(config)
        elif isinstance(config, TransactionActionConfiguration):
            result = _generate_transaction_action_sql(config)
        elif isinstance(config, ArbitraryActionConfiguration):
            result = _generate_arbitrary_action_sql(config)
        else:
            assert_never(config)
        generated_sql.append(result)
    if len(disabled_triggers) > 0:
        logger.warning("Note! Current configuration leaves some triggers disabled! Enabling them")
        for trigger in disabled_triggers:
            result = _generate_trigger_action_sql(TriggerActionConfiguration("enable", trigger[0], trigger[1]))
            generated_sql.append(result)
    return generated_sql


def _create_log_execution_message_for_sql(sql_executed: GeneratedSqlStatement) -> str:
    """Create a log execution message for a SQL statement.

    Args:
        sql_executed (GeneratedSqlStatement): The SQL being executed.

    Returns:
        str: The log message to be logged.
    """
    if isinstance(sql_executed, GeneratedInsertActionSql):
        return (
            f"Executing insert statement from {sql_executed.action_configuration.source_table} "
            f"to {sql_executed.action_configuration.destination_table}"
        )
    elif isinstance(sql_executed, GeneratedTriggerActionSql):
        return (
            f"Executing SQL to {sql_executed.action_configuration.action_type} trigger "
            f"{sql_executed.action_configuration.target_table}.{sql_executed.action_configuration.target_trigger_name}"
        )
    elif isinstance(sql_executed, GeneratedTransactionActionSql):
        return f"Executing {sql_executed.action_configuration.action_type} transaction statement"
    elif isinstance(sql_executed, GeneratedArbitraryActionSql):
        return f"Executing arbitrary SQL statement: {sql_executed.action_configuration.action_name}"
    else:
        assert_never(sql_executed)


def main(args: "Namespace") -> None:
    """Main program function."""
    load_configuration = getattr(AVAILABLE_DATA_LOAD_CONFIGURATIONS, args.config_name)
    generated_sql = _generate_data_load_sql(load_configuration)
    if args.dry_run:
        for query in generated_sql:
            logger.info(query.sql_query)
    else:
        conn = attach_demos_to_conn(create_duckdb_conn())
        for query in generated_sql:
            logger.info(_create_log_execution_message_for_sql(query))
            conn.execute(query.sql_query)


if __name__ == "__main__":
    args = _parse_args()
    main(args)
