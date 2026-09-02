"""Basic utility functions using DuckDB."""

from logging import getLogger
from typing import TYPE_CHECKING

from logger_utils import config_logger
from types_constants import DuckDbAttachName, SchemaName, SchemaTableList, SnapshotSchemaName

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn

logger = config_logger(getLogger(__name__))


def get_table_list_for_schema(
    attach_name: DuckDbAttachName, schema_name: SchemaName, conn: "DuckConn"
) -> SchemaTableList:
    """Get a list of tables from a schema.

    Args:
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        schema_name (SchemaName): The schema to retrieve the table list for.
        conn (DuckConn): A DuckDB connection with the appropriate DB attached.

    Returns:
        SchemaTableList: The list of tables in the schema.
    """
    logger.info(f"Retrieving list of tables for schema {schema_name} using {attach_name}")
    query = f"""
        SELECT
            table_name
        FROM
            {attach_name}.information_schema.tables
        WHERE
            table_schema = $schema_name;
    """
    result = conn.execute(query, {"schema_name": schema_name}).fetchall()
    logger.info(f"Retrieved list of tables for schema {schema_name} using {attach_name}")
    return SchemaTableList(schema_name, [row[0] for row in result])


def select_table_from_source_to_target(
    source_attach_name: DuckDbAttachName,
    target_attach_name: DuckDbAttachName,
    source_schema_name: SchemaName,
    target_schema_name: SchemaName | SnapshotSchemaName,
    table_name: str,
    conn: "DuckConn",
) -> None:
    """Select all columns and rows of a table from source to target schema, potentially across databases.

    Args:
        source_attach_name (DuckDbAttachName): The source DuckDB attach name to use.
        target_attach_name (DuckDbAttachName): The target DuckDB attach name to use.
        source_schema_name (SchemaName): The source schema to use.
        target_schema_name (SchemaName | SnapshotSchemaName): The target schema to use.
        table_name (str): The table to be copied from source to target.
        conn (DuckConn): A DuckDB connection with the appropriate DB attached.

    Raises:
        ValueError: If trying to copy between two identical locations.
    """
    fully_qualified_target = f"{target_attach_name}.{target_schema_name}.{table_name}"
    fully_qualified_source = f"{source_attach_name}.{source_schema_name}.{table_name}"
    if fully_qualified_target == fully_qualified_source:
        err_msg = f"Cannot copy {fully_qualified_source} to {fully_qualified_target}; identical locations"
        logger.error(err_msg)
        raise ValueError(err_msg)
    query = f"""
        CREATE TABLE {fully_qualified_target} AS
        SELECT * FROM {fully_qualified_source};
    """
    logger.info(f"Copying {fully_qualified_source} to {fully_qualified_target}")
    conn.execute(query)
