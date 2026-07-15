"""Copy files between buckets on the same S3-compatible service.

Rows are read from Postgres using discrete Postgres environment variables.
The query must return: old_path and new_path.
Only rows with `flag = true` are copied.
"""

import os
from typing import TYPE_CHECKING, List, TypedDict

import boto3
from dotenv import load_dotenv

from duckdb_connection_manager import create_duckdb_conn, DEMOS_DDB_ATTACH_NAME
from logger_utils import get_logger

if TYPE_CHECKING:  # pragma: no cover
    from duckdb import DuckDBPyConnection as DuckConn
    from mypy_boto3_s3 import S3Client

load_dotenv()

SELECT_UNMIGRATED_FILES_QUERY = f"""
    SELECT
        old_path, new_path
    FROM
        {DEMOS_DDB_ATTACH_NAME}.legacy_pmda_staging.system_file_migration_queue
    WHERE
        flag = TRUE
"""
MARK_FILE_MIGRATED_QUERY = f"""
    UPDATE
        {DEMOS_DDB_ATTACH_NAME}.legacy_pmda_staging.system_file_migration_queue
    SET
        flag = false
    WHERE
        old_path = $old_path
        AND new_path = $new_path
        AND flag = TRUE
"""

logger = get_logger(__name__)


class CopyRow(TypedDict):
    """A queued file copy record."""

    old_path: str
    new_path: str


def get_unmigrated_files(connection: "DuckConn") -> List[CopyRow]:
    """Read unmigrated file mappings from Postgres.

    Args:
        connection ("DuckConn"): The DuckDB connection with Postgres attached.

    Returns:
        List[CopyRow]: A list of the rows to copy.
    """
    rows = connection.execute(SELECT_UNMIGRATED_FILES_QUERY).fetchall()
    return [{"old_path": row[0], "new_path": row[1]} for row in rows]


def mark_row_copied(connection: "DuckConn", row: CopyRow) -> None:
    """Mark one row as copied in Postgres.

    Args:
        connection ("DuckConn"): The DuckDB connection with Postgres attached.
        row (CopyRow): The migrated row to mark as copied.
    """
    connection.execute(
        MARK_FILE_MIGRATED_QUERY,
        {"old_path": row["old_path"], "new_path": row["new_path"]},
    )
    return None


def copy_s3_object(
    s3_client: "S3Client",
    source_bucket: str,
    destination_bucket: str,
    old_path: str,
    new_path: str,
) -> None:
    """Copy one object within the same S3-compatible service.

    Args:
        s3_client ("S3Client"): The S3 client used to perform the copy.
        source_bucket (str): The bucket containing the source object.
        destination_bucket (str): The bucket receiving the copied object.
        old_path (str): The source object key.
        new_path (str): The destination object key.
    """
    s3_client.copy(
        {"Bucket": source_bucket, "Key": old_path},
        destination_bucket,
        new_path,
    )
    return None


def migrate_file(
    connection: "DuckConn",
    row: CopyRow,
    s3_client: "S3Client",
) -> None:
    """Copy one row from the source bucket to the destination bucket.

    Args:
        connection ("DuckConn"): The DuckDB connection with Postgres attached.
        row (CopyRow): The queued row describing the source and destination keys.
        s3_client ("S3Client"): The S3 client used to perform the copy.
    """
    source_bucket = os.environ["PMDA_S3_BUCKET"]
    destination_bucket = os.environ["DEMOS_S3_BUCKET"]
    if os.environ["FILE_MIGRATION_PRODUCTION_MODE"] == "1":
        logger.info(f"Copying s3://{source_bucket}/{row['old_path']} -> s3://{destination_bucket}/{row['new_path']}")
        copy_s3_object(
            s3_client,
            source_bucket,
            destination_bucket,
            row["old_path"],
            row["new_path"],
        )
        mark_row_copied(connection, row)
    else:
        logger.info(
            f"Would have copied s3://{source_bucket}/{row['old_path']} -> s3://{destination_bucket}/{row['new_path']}"
        )
    return None


def main() -> None:
    """Execute main program function."""
    db_connection = create_duckdb_conn()
    s3_client = boto3.Session().client("s3")
    copied_count = 0
    unmigrated_files = get_unmigrated_files(db_connection)

    while copied_count < len(unmigrated_files):
        logger.info(f"Processing {unmigrated_files[copied_count]['old_path']}")
        migrate_file(db_connection, unmigrated_files[copied_count], s3_client)
        copied_count += 1

    return None


if __name__ == "__main__":  # pragma: no cover
    main()
