"""Perform load actions based on a configuration from a data migration schema into demos_app."""

import argparse
import os
from dataclasses import dataclass
from logging import getLogger
from typing import Set, Tuple, assert_never, cast, get_args

from dotenv import load_dotenv

from duckdb_connection_manager import (
    DemosDbConfigurationName,
    attach_demos_db_to_conn,
    create_duckdb_conn,
    get_attach_name_from_db_config_name,
)
from load_data_to_demos_app_configs import (
    AVAILABLE_DATA_LOAD_CONFIGURATIONS,
)
from load_data_to_demos_app_types import (
    ArbitraryActionConfiguration,
    ArbitrarySqlGenerationContext,
    DataLoadConfiguration,
    DataLoadConfigurationName,
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

logger = config_logger(getLogger(__name__))

load_dotenv()
DATA_LOAD_CONFIGS = get_args(DataLoadConfigurationName.__value__)
DEMOS_DB_CONFIGS = get_args(DemosDbConfigurationName.__value__)


@dataclass(frozen=True)
class CommandLineArguments:
    """The command line arguments passed into the program."""

    db_config: DemosDbConfigurationName
    data_load_config: DataLoadConfigurationName
    dry_run: bool


def _parse_args() -> CommandLineArguments:
    """Create argument parser and parse incoming arguments.

    Returns:
        CommandLineArguments: The parsed argument namespace.
    """
    parser = argparse.ArgumentParser(
        description="Run data loads as part of the migration process",
        formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50),
    )
    parser.add_argument("db_config", choices=DEMOS_DB_CONFIGS, help="The DEMOS DB config to use")
    parser.add_argument("config_name", choices=DATA_LOAD_CONFIGS, help="The data load configuration to run")
    parser.add_argument("--dry-run", "-d", action="store_true", help="Print generated SQL to console but do not run")
    parsed_args = parser.parse_args()
    return CommandLineArguments(
        db_config=cast(DemosDbConfigurationName, parsed_args.db_config),
        data_load_config=cast(DataLoadConfigurationName, parsed_args.config_name),
        dry_run=cast(bool, parsed_args.dry_run),
    )


def _generate_table_insert_sql(
    source_schema: str,
    target_schema: str,
    db_config: DemosDbConfigurationName,
    insert_config: TableInsertActionConfiguration,
) -> GeneratedInsertActionSql:
    """Generate an insert statement from a TableInsertActionConfiguration.

    Args:
        source_schema (str): The schema to load from.
        target_schema (str): The schema to load to.
        db_config (DemosDbConfiguration_name): The DB configuration to be used.
        insert_config (TableInsertActionConfiguration): The table configuration to be loaded.

    Returns:
        GeneratedInsertActionSql: The SQL query to be executed.
    """
    attach_name = get_attach_name_from_db_config_name(db_config)
    logger.info(f"Generating insert statement for {insert_config.source_table} to {insert_config.target_table}")
    formatted_col_list = ", ".join(insert_config.column_list)
    query = f"""
        INSERT INTO
            {attach_name}.{target_schema}.{insert_config.target_table}
            ({formatted_col_list})
        SELECT
            {formatted_col_list}
        FROM
            {attach_name}.{source_schema}.{insert_config.source_table};
    """
    return GeneratedInsertActionSql(insert_config, query)


def _generate_trigger_action_sql(
    db_config: DemosDbConfigurationName,
    trigger_config: TriggerActionConfiguration,
) -> GeneratedTriggerActionSql:
    """Generate an trigger action statement from a TriggerActionConfiguration.

    Args:
        db_config (DemosDbConfiguration_name): The DB configuration to be used.
        trigger_config (TriggerActionConfiguration): The trigger configuration to generate.

    Returns:
        GeneratedTriggerActionSql: The SQL query to be executed.
    """
    attach_name = get_attach_name_from_db_config_name(db_config)
    logger.info(
        f"Generating control statement to {trigger_config.action_type} trigger "
        f"{trigger_config.trigger_table}.{trigger_config.trigger_name}"
    )

    if trigger_config.action_type == "disable":
        alter_statement = (
            f"ALTER TABLE {trigger_config.trigger_schema}.{trigger_config.trigger_table} "
            f"DISABLE TRIGGER {trigger_config.trigger_name};"
        )
    elif trigger_config.action_type == "enable":
        alter_statement = (
            f"ALTER TABLE {trigger_config.trigger_schema}.{trigger_config.trigger_table} "
            f"ENABLE TRIGGER {trigger_config.trigger_name};"
        )
    else:
        # This guards against the allowed values of a field expanding and causes it to be caught by type checking
        assert_never(trigger_config.action_type)

    # DuckDB has no concept of triggers, so we need to use the postgres_execute() function
    query = f"CALL postgres_execute('{attach_name}', '{alter_statement}')"
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
    db_config: DemosDbConfigurationName, arbitrary_action_config: ArbitraryActionConfiguration
) -> GeneratedArbitraryActionSql:
    """Generate an arbitrary action statement from an ArbitraryActionConfiguration.

    Args:
        db_config (DemosDbConfiguration_name): The DB configuration to be used.
        arbitrary_action_config (ArbitraryActionConfiguration): The arbitrary action configuration to generate.

    Returns:
        GeneratedArbitraryActionSql: The SQL query to be executed.
    """
    attach_name = get_attach_name_from_db_config_name(db_config)
    app_schema = os.environ["APP_SCHEMA"]
    sql_input = ArbitrarySqlGenerationContext(attach_name, app_schema)
    sql_query = arbitrary_action_config.sql_generator(sql_input)
    return GeneratedArbitraryActionSql(arbitrary_action_config, sql_query)


def _generate_data_load_sql(
    db_config: DemosDbConfigurationName, data_load_config: DataLoadConfiguration
) -> DataLoadSql:
    """Generate all the SQL for the data_load.

    Args:
        db_config (DemosDbConfiguration_name): The DB configuration to be used.
        data_load_config (DataLoadConfiguration): The full data load configuration.

    Returns:
        DataLoadSql: The SQL generated from the configuration.
    """
    generated_sql: DataLoadSql = []
    result: GeneratedSqlStatement
    disabled_triggers: Set[Tuple[str, str, str]] = set()
    for action_config in data_load_config.data_load_actions:
        if isinstance(action_config, TableInsertActionConfiguration):
            result = _generate_table_insert_sql(
                data_load_config.source_schema, data_load_config.target_schema, db_config, action_config
            )
        elif isinstance(action_config, TriggerActionConfiguration):
            if action_config.action_type == "disable":
                disabled_triggers.add(
                    (action_config.trigger_schema, action_config.trigger_table, action_config.trigger_name)
                )
            elif action_config.action_type == "enable":
                disabled_triggers.remove(
                    (action_config.trigger_schema, action_config.trigger_table, action_config.trigger_name)
                )
            else:
                assert_never(action_config.action_type)
            result = _generate_trigger_action_sql(db_config, action_config)
        elif isinstance(action_config, TransactionActionConfiguration):
            result = _generate_transaction_action_sql(action_config)
        elif isinstance(action_config, ArbitraryActionConfiguration):
            result = _generate_arbitrary_action_sql(db_config, action_config)
        else:
            assert_never(action_config)
        generated_sql.append(result)
    if len(disabled_triggers) > 0:
        logger.warning("Note! Current configuration leaves some triggers disabled! Enabling them")
        for trigger in disabled_triggers:
            result = _generate_trigger_action_sql(
                db_config, TriggerActionConfiguration("enable", trigger[0], trigger[1], trigger[2])
            )
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
            f"to {sql_executed.action_configuration.target_table}"
        )
    elif isinstance(sql_executed, GeneratedTriggerActionSql):
        return (
            f"Executing SQL to {sql_executed.action_configuration.action_type} trigger "
            f"{sql_executed.action_configuration.trigger_schema}."
            f"{sql_executed.action_configuration.trigger_table}."
            f"{sql_executed.action_configuration.trigger_name}"
        )
    elif isinstance(sql_executed, GeneratedTransactionActionSql):
        return f"Executing {sql_executed.action_configuration.action_type} transaction statement"
    elif isinstance(sql_executed, GeneratedArbitraryActionSql):
        return f"Executing arbitrary SQL statement: {sql_executed.action_configuration.action_name}"
    else:
        assert_never(sql_executed)


def main(args: CommandLineArguments) -> None:
    """Main program function."""
    load_configuration = AVAILABLE_DATA_LOAD_CONFIGURATIONS[args.data_load_config]
    generated_sql = _generate_data_load_sql(args.db_config, load_configuration)
    if args.dry_run:
        for query in generated_sql:
            logger.info(query.sql_query)
    else:
        conn = attach_demos_db_to_conn(create_duckdb_conn(), args.db_config)
        for query in generated_sql:
            logger.info(_create_log_execution_message_for_sql(query))
            conn.execute(query.sql_query)


if __name__ == "__main__":
    args = _parse_args()
    main(args)
