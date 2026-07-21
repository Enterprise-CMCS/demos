"""Load configured tables from legacy_pmda_staged to demos_app."""

import argparse
import os
from logging import getLogger
from typing import TYPE_CHECKING, List, Tuple, TypedDict

from dotenv import load_dotenv

from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, create_duckdb_conn
from logger_utils import config_logger

if TYPE_CHECKING:
    from argparse import Namespace

logger = config_logger(getLogger(__name__))

load_dotenv()
STAGING_SCHEMA = os.environ["STAGING_SCHEMA"]
APP_SCHEMA = os.environ["APP_SCHEMA"]


class TableMigrationConfiguration(TypedDict):
    """The configuration of a single table moving from staged to app."""

    staged_table: str
    target_table: str
    column_list: List[str]


class GeneratedInsertStatement(TypedDict):
    """The generated insert statement from a TableMigrationConfiguration."""

    target_table: str
    sql_query: str


MIGRATION_CONFIGURATION: Tuple[TableMigrationConfiguration, ...] = (
    {
        "staged_table": "cleaned_demos_app_person",
        "target_table": "person",
        "column_list": ["id", "person_type_id", "email", "first_name", "last_name", "created_at", "updated_at"],
    },
    {
        "staged_table": "cleaned_demos_app_users",
        "target_table": "users",
        "column_list": [
            "id",
            "person_type_id",
            "cognito_subject",
            "username",
            "is_migrated_from_pmda",
            "has_logged_in",
            "created_at",
            "updated_at",
        ],
    },
    {
        "staged_table": "cleaned_demos_app_person_state",
        "target_table": "person_state",
        "column_list": ["person_id", "state_id"],
    },
    {
        "staged_table": "cleaned_demos_app_system_role_assignment",
        "target_table": "system_role_assignment",
        "column_list": ["person_id", "role_id", "person_type_id", "grant_level_id"],
    },
)


def parse_args() -> "Namespace":
    """Create argument parser and parse incoming arguments.

    Returns:
        Namespace: The parsed argument namespace.
    """
    argparser = argparse.ArgumentParser()
    argparser.add_argument("--dry-run", "-d", action="store_true", help="Print generated SQL to console but do not run")
    return argparser.parse_args()


def generate_table_migration_sql(table_to_migrate: TableMigrationConfiguration) -> GeneratedInsertStatement:
    """Generate an INSERT statement to migrate a table from a configuration.

    Args:
        table_to_migrate (TableMigrationConfiguration): The table configuration to be migrated.

    Returns:
        str: The SQL query to be executed.
    """
    logger.info(f"Generating insert statement for {table_to_migrate['target_table']}")
    formatted_col_list = ", ".join(table_to_migrate["column_list"])
    query = f"""
        INSERT INTO
            {DEMOS_DDB_ATTACH_NAME}.{APP_SCHEMA}.{table_to_migrate["target_table"]}
            ({formatted_col_list})
        SELECT
            {formatted_col_list}
        FROM
            {DEMOS_DDB_ATTACH_NAME}.{STAGING_SCHEMA}.{table_to_migrate["staged_table"]};
    """
    return {"target_table": table_to_migrate["target_table"], "sql_query": query}


def main(args: "Namespace") -> None:
    """Main program function."""
    generated_inserts: List[GeneratedInsertStatement] = []
    for config in MIGRATION_CONFIGURATION:
        result = generate_table_migration_sql(config)
        generated_inserts.append(result)
        if args.dry_run:
            logger.info(result["sql_query"])
    if not args.dry_run:
        conn = create_duckdb_conn()
        for insert_statement in generated_inserts:
            logger.info(f"Executing insert statement for {insert_statement['target_table']}")
            conn.execute(insert_statement["sql_query"])


if __name__ == "__main__":
    args = parse_args()
    main(args)
