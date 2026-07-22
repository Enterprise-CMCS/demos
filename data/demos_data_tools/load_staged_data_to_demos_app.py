"""Load configured tables from legacy_pmda_staged to demos_app."""

import argparse
import os
from dataclasses import dataclass
from logging import getLogger
from typing import TYPE_CHECKING, List, Literal, Set, Tuple, assert_never

from dotenv import load_dotenv

from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, create_duckdb_conn
from logger_utils import config_logger

if TYPE_CHECKING:
    from argparse import Namespace

logger = config_logger(getLogger(__name__))

load_dotenv()
STAGING_SCHEMA = os.environ["STAGING_SCHEMA"]
APP_SCHEMA = os.environ["APP_SCHEMA"]


@dataclass(frozen=True)
class TableInsertActionConfiguration:
    """A configuration for a table insert migration action."""

    source_table: str
    destination_table: str
    column_list: List[str]


@dataclass(frozen=True)
class GeneratedInsertActionSql:
    """The generated SQL statement from a TableInsertActionConfiguration."""

    action_configuration: TableInsertActionConfiguration
    sql_query: str


@dataclass(frozen=True)
class TriggerActionConfiguration:
    """A configuration for a trigger migration action."""

    action_type: Literal["disable", "enable"]
    target_table: str
    target_trigger_name: str

    def __post_init__(self) -> None:
        """Validate field contents after initialization.

        Raises:
            ValueError: If identifiers contain invalid characters.
        """
        for field_name in ("target_table", "target_trigger_name"):
            value = getattr(self, field_name)
            if not value.isidentifier():
                raise ValueError(f"{field_name} must be a bare SQL identifier: {value!r}")


@dataclass(frozen=True)
class GeneratedTriggerActionSql:
    """The generated SQL statement from a TriggerActionConfiguration."""

    action_configuration: TriggerActionConfiguration
    sql_query: str


@dataclass(frozen=True)
class TransactionActionConfiguration:
    """A configuration for a transaction migration action."""

    action_type: Literal["begin", "commit"]


@dataclass(frozen=True)
class GeneratedTransactionActionSql:
    """The generated SQL statement from a TransactionActionConfiguration."""

    action_configuration: TransactionActionConfiguration
    sql_query: str


@dataclass(frozen=True)
class ArbitraryActionSql:
    """A class for arbitrary SQL to execute."""

    action_configuration: str
    sql_query: str


type MigrationConfiguration = Tuple[
    TableInsertActionConfiguration | TriggerActionConfiguration | TransactionActionConfiguration | ArbitraryActionSql,
    ...,
]
type SqlStatement = (
    GeneratedInsertActionSql | GeneratedTriggerActionSql | GeneratedTransactionActionSql | ArbitraryActionSql
)
type MigrationSql = List[SqlStatement]

MIGRATION_CONFIGURATION: MigrationConfiguration = (
    TriggerActionConfiguration("disable", "application", "create_phases_and_dates_for_new_application"),
    TableInsertActionConfiguration(
        "final_demos_app_person",
        "person",
        ["id", "person_type_id", "email", "first_name", "last_name", "created_at", "updated_at"],
    ),
    TableInsertActionConfiguration(
        "final_demos_app_users",
        "users",
        [
            "id",
            "person_type_id",
            "cognito_subject",
            "username",
            "is_migrated_from_pmda",
            "has_logged_in",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration("final_demos_app_person_state", "person_state", ["person_id", "state_id"]),
    TableInsertActionConfiguration(
        "final_demos_app_system_role_assignment",
        "system_role_assignment",
        ["person_id", "role_id", "person_type_id", "grant_level_id"],
    ),
    TransactionActionConfiguration("begin"),
    ArbitraryActionSql(
        "Set migration_mode to 'on'",
        f"CALL postgres_execute('{DEMOS_DDB_ATTACH_NAME}', 'SET LOCAL demos_app.migration_mode = ''on''')",
    ),
    TableInsertActionConfiguration(
        "final_demos_app_application",
        "application",
        ["id", "application_type_id", "is_migrated_from_pmda"],
    ),
    TableInsertActionConfiguration(
        "final_demos_app_demonstration",
        "demonstration",
        [
            "id",
            "application_type_id",
            "name",
            "description",
            "effective_date",
            "expiration_date",
            "sdg_division_id",
            "signature_level_id",
            "status_id",
            "status_updated_at",
            "current_phase_id",
            "state_id",
            "clearance_level_id",
            "medicaid_id",
            "chip_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        "final_demos_app_demo_role_assignment",
        "demonstration_role_assignment",
        [
            "person_id",
            "demonstration_id",
            "role_id",
            "state_id",
            "person_type_id",
            "grant_level_id",
        ],
    ),
    TableInsertActionConfiguration(
        "final_demos_app_primary_demo_role_assignment",
        "primary_demonstration_role_assignment",
        [
            "person_id",
            "demonstration_id",
            "role_id",
        ],
    ),
    TableInsertActionConfiguration(
        "final_demos_app_application_phase",
        "application_phase",
        [
            "application_id",
            "phase_id",
            "phase_status_id",
            "created_at",
            "updated_at",
        ],
    ),
    ArbitraryActionSql(
        "Set migration_mode to 'off'",
        f"CALL postgres_execute('{DEMOS_DDB_ATTACH_NAME}', 'SET LOCAL demos_app.migration_mode = ''off''')",
    ),
    TransactionActionConfiguration("commit"),
    TableInsertActionConfiguration("final_demos_app_tag_name", "tag_name", ["id", "created_at", "updated_at"]),
    TableInsertActionConfiguration(
        "final_demos_app_tag",
        "tag",
        [
            "tag_name_id",
            "tag_type_id",
            "source_id",
            "status_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        "final_demos_app_demo_type_tag_assignment",
        "demonstration_type_tag_assignment",
        [
            "demonstration_id",
            "tag_name_id",
            "tag_type_id",
            "effective_date",
            "expiration_date",
            "created_at",
            "updated_at",
        ],
    ),
    TriggerActionConfiguration("enable", "application", "create_phases_and_dates_for_new_application"),
)


def parse_args() -> "Namespace":
    """Create argument parser and parse incoming arguments.

    Returns:
        Namespace: The parsed argument namespace.
    """
    argparser = argparse.ArgumentParser()
    argparser.add_argument("--dry-run", "-d", action="store_true", help="Print generated SQL to console but do not run")
    return argparser.parse_args()


def _generate_table_insert_sql(insert_config: TableInsertActionConfiguration) -> GeneratedInsertActionSql:
    """Generate an insert statement from a TableInsertActionConfiguration.

    Args:
        insert_config (TableInsertActionConfiguration): The table configuration to be migrated.

    Returns:
        GeneratedInsertActionSql: The SQL query to be executed.
    """
    logger.info(f"Generating insert statement for {insert_config.source_table} to {insert_config.destination_table}")
    formatted_col_list = ", ".join(insert_config.column_list)
    query = f"""
        INSERT INTO
            {DEMOS_DDB_ATTACH_NAME}.{APP_SCHEMA}.{insert_config.destination_table}
            ({formatted_col_list})
        SELECT
            {formatted_col_list}
        FROM
            {DEMOS_DDB_ATTACH_NAME}.{STAGING_SCHEMA}.{insert_config.source_table};
    """
    return GeneratedInsertActionSql(insert_config, query)


def _generate_trigger_action_sql(trigger_config: TriggerActionConfiguration) -> GeneratedTriggerActionSql:
    """Generate an trigger action statement from a TriggerActionConfiguration.

    Args:
        trigger_config (TriggerActionConfiguration): The trigger configuration to generate.

    Returns:
        GeneratedTriggerActionSql: The SQL query to be executed.
    """
    logger.info(
        f"Generating control statement to {trigger_config.action_type} trigger "
        f"{trigger_config.target_table}.{trigger_config.target_trigger_name}"
    )

    if trigger_config.action_type == "disable":
        alter_statement = (
            f"ALTER TABLE {APP_SCHEMA}.{trigger_config.target_table} "
            f"DISABLE TRIGGER {trigger_config.target_trigger_name};"
        )
    elif trigger_config.action_type == "enable":
        alter_statement = (
            f"ALTER TABLE {APP_SCHEMA}.{trigger_config.target_table} "
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


def _generate_migration_sql(migration_config: MigrationConfiguration) -> MigrationSql:
    """Generate all the SQL for the migration.

    Args:
        migration_config (MigrationConfiguration): The full migration configuration.

    Returns:
        MigrationSql: The SQL generated from the configuration.
    """
    generated_sql: MigrationSql = []
    result: SqlStatement
    disabled_triggers: Set[Tuple[str, str]] = set()
    for config in migration_config:
        if isinstance(config, TableInsertActionConfiguration):
            result = _generate_table_insert_sql(config)
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
        elif isinstance(config, ArbitraryActionSql):
            result = config
        else:
            assert_never(config)
        generated_sql.append(result)
    if len(disabled_triggers) > 0:
        logger.warning("Note! Current configuration leaves some triggers disabled! Enabling them")
        for trigger in disabled_triggers:
            result = _generate_trigger_action_sql(TriggerActionConfiguration("enable", trigger[0], trigger[1]))
            generated_sql.append(result)
    return generated_sql


def _create_log_execution_message_for_sql(sql_executed: SqlStatement) -> str:
    """Create a log execution message for a SQL statement.

    Args:
        sql_executed (SqlStatement): The SQL being executed.

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
    elif isinstance(sql_executed, ArbitraryActionSql):
        return f"Executing arbitrary SQL statement: {sql_executed.action_configuration}"
    else:
        assert_never(sql_executed)


def main(args: "Namespace") -> None:
    """Main program function."""
    generated_sql = _generate_migration_sql(MIGRATION_CONFIGURATION)
    if args.dry_run:
        for query in generated_sql:
            logger.info(query.sql_query)
    else:
        conn = create_duckdb_conn()
        for query in generated_sql:
            logger.info(_create_log_execution_message_for_sql(query))
            conn.execute(query.sql_query)


if __name__ == "__main__":
    args = parse_args()
    main(args)
