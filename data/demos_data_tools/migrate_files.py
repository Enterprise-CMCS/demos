<<<<<<< HEAD
"""Copy files between buckets on the same S3-compatible service.

Rows are read from Postgres using discrete Postgres environment variables.
The query must return: old_path and new_path.
Only rows with `flag = true` are copied.
"""

import os
from logging import getLogger
from typing import TYPE_CHECKING, List, TypedDict
=======
"""Migrate files from PMDA to DEMOS S3 buckets based on staged data in PostgreSQL."""

import os
import sys
from dataclasses import dataclass, replace
from logging import getLogger
from typing import TYPE_CHECKING, List
>>>>>>> main

import boto3
from dotenv import load_dotenv

<<<<<<< HEAD
from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, create_duckdb_conn, attach_demos_to_conn
=======
from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, attach_demos_to_conn, create_duckdb_conn
>>>>>>> main
from logger_utils import config_logger

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn
    from mypy_boto3_s3 import S3Client

load_dotenv()
<<<<<<< HEAD

SELECT_UNMIGRATED_FILES_QUERY = f"""
    SELECT
        old_path, new_path
    FROM
        {DEMOS_DDB_ATTACH_NAME}.{os.environ["STAGING_SCHEMA"]}.system_file_migration_queue
    WHERE
        flag = TRUE
"""
MARK_FILE_MIGRATED_QUERY = f"""
    UPDATE
        {DEMOS_DDB_ATTACH_NAME}.{os.environ["STAGING_SCHEMA"]}.system_file_migration_queue
    SET
        flag = false
    WHERE
        old_path = $old_path
        AND new_path = $new_path
        AND flag = TRUE
"""
=======
PMDA_S3_BUCKET = os.environ["PMDA_S3_BUCKET"]
DEMOS_S3_BUCKET = os.environ["DEMOS_S3_BUCKET"]
STAGING_SCHEMA = os.environ["STAGING_SCHEMA"]
>>>>>>> main

logger = config_logger(getLogger(__name__))


<<<<<<< HEAD
class CopyRow(TypedDict):
    """A queued file copy record."""

    old_path: str
    new_path: str


def get_unmigrated_files(connection: "DuckConn") -> List[CopyRow]:
    """Read unmigrated file mappings from Postgres.

    Args:
        connection (DuckConn): The DuckDB connection with Postgres attached.

    Returns:
        List[CopyRow]: A list of the rows to copy.
    """
    rows = connection.execute(SELECT_UNMIGRATED_FILES_QUERY).fetchall()
    return [{"old_path": row[0], "new_path": row[1]} for row in rows]


def mark_row_copied(connection: "DuckConn", row: CopyRow) -> None:
    """Mark one row as copied in Postgres.

    Args:
        connection (DuckConn): The DuckDB connection with Postgres attached.
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
        s3_client (S3Client): The S3 client used to perform the copy.
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
=======
@dataclass(frozen=True)
class FileMigrationTrackerRecord:
    """A file migration tracker record for a single file being migrated."""

    final_document_id: str
    final_document_s3_path: str
    _internal_pmda_s3_file_id: int
    legacy_pmda_s3_path: str
    legacy_pmda_file_extension: str
    file_mime_type: str
    file_has_been_moved: bool
    _local_file_has_been_moved: bool


def get_s3_client() -> "S3Client":
    """Get an appropriate boto3 S3Client depending on environment.

    Returns:
        S3Client: A boto3 S3Client.
    """
    is_devcontainer = os.environ.get("DEVCONTAINER", "false") == "true"
    if is_devcontainer:
        logger.info("Instantiating localstack S3 client")
        s3_client = boto3.client("s3", endpoint_url="http://localstack:4566")
    else:
        logger.info("Instantiating regular S3 client")
        s3_client = boto3.client("s3")
    logger.info("S3 client instantiated")
    return s3_client


def get_unmigrated_files(connection: "DuckConn") -> List[FileMigrationTrackerRecord]:
    """Get a list of unmigrated files from PostgreSQL.

    Args:
        connection (DuckConn): The DuckDB connection with PostgreSQL attached.

    Returns:
        List[FileMigrationTrackerRecord]: A list of the unmigrated files.
    """
    logger.info("Getting list of unmigrated files from PostgreSQL")
    query = f"""
        SELECT
            final_document_id::TEXT,
            final_document_s3_path,
            _internal_pmda_s3_file_id,
            legacy_pmda_s3_path,
            legacy_pmda_file_extension,
            file_mime_type,
            file_has_been_moved,
            FALSE AS _local_file_has_been_moved
        FROM
            {DEMOS_DDB_ATTACH_NAME}.{STAGING_SCHEMA}.system_file_move_tracker
        WHERE
            NOT file_has_been_moved;
    """
    query_rows = connection.execute(query).fetchall()
    logger.info("Retrieved list of unmigrated files from database")
    return [FileMigrationTrackerRecord(*row) for row in query_rows]


def _mark_file_migrated_in_db(
    connection: "DuckConn", file_record: FileMigrationTrackerRecord
) -> FileMigrationTrackerRecord:
    """Mark one file migrated in PostgreSQL and return the updated record.

    Args:
        connection (DuckConn): The DuckDB connection with PostgreSQL attached.
        file_record (FileMigrationTrackerRecord): The migrated file to mark as migrated.

    Returns:
        FileMigrationTrackerRecord: The updated file record.
    """
    query = f"""
        UPDATE
            {DEMOS_DDB_ATTACH_NAME}.{STAGING_SCHEMA}.system_file_move_tracker
        SET
            file_has_been_moved = TRUE
        WHERE
            final_document_id = $final_document_id;
    """
    if not file_record._local_file_has_been_moved:
        logger.warning(
            f"Attempted to mark {file_record.final_document_id} migrated in DB "
            "without local migration marked complete; no action was taken"
        )
        return file_record
    try:
        connection.execute(query, {"final_document_id": file_record.final_document_id})
    except Exception as e:
        logger.error(
            f"Exception {e} encountered while attempting to mark {file_record.final_document_id} completed in database"
        )
        return file_record
    updated_file_record = replace(file_record, file_has_been_moved=True)
    logger.debug(f"Marked {file_record.final_document_id} as migrated in database")
    return updated_file_record


def _migrate_file_in_s3(s3_client: "S3Client", file_record: FileMigrationTrackerRecord) -> FileMigrationTrackerRecord:
    """Migrate one file in S3 from PMDA to DEMOS.

    Args:
        s3_client (S3Client): The S3 client used to perform the migration.
        file_record (FileMigrationTrackerRecord): A file to migrate.

    Returns:
        FileMigrationTrackerRecord: The updated file record.
    """
    try:
        s3_client.copy(
            {"Bucket": PMDA_S3_BUCKET, "Key": file_record.legacy_pmda_s3_path},
            DEMOS_S3_BUCKET,
            file_record.final_document_s3_path,
            ExtraArgs={
                "MetadataDirective": "REPLACE",
                "ContentType": file_record.file_mime_type,
            },
        )
    except Exception as e:
        logger.error(f"Exception {e} encountered while attempting to move file {file_record.final_document_id} in S3")
        return file_record
    updated_file_record = replace(file_record, _local_file_has_been_moved=True)
    logger.debug(f"Migrated {file_record.final_document_id} in S3 from PMDA to DEMOS")
    return updated_file_record
>>>>>>> main


def migrate_file(
    connection: "DuckConn",
<<<<<<< HEAD
    row: CopyRow,
    s3_client: "S3Client",
) -> None:
    """Copy one row from the source bucket to the destination bucket.

    Args:
        connection (DuckConn): The DuckDB connection with Postgres attached.
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
    db_connection = attach_demos_to_conn(create_duckdb_conn())
    s3_client = boto3.Session().client("s3")
    copied_count = 0
    unmigrated_files = get_unmigrated_files(db_connection)

    while copied_count < len(unmigrated_files):
        logger.info(f"Processing {unmigrated_files[copied_count]['old_path']}")
        migrate_file(db_connection, unmigrated_files[copied_count], s3_client)
        copied_count += 1

    return None
=======
    s3_client: "S3Client",
    file_record: FileMigrationTrackerRecord,
) -> FileMigrationTrackerRecord:
    """Perform all migration steps for a single record.

    Args:
        connection (DuckConn): The DuckDB connection with PostgreSQL attached.
        s3_client (S3Client): The S3 client used to perform the migration.
        file_record (FileMigrationTrackerRecord): A file to migrate.

    Returns:
        FileMigrationTrackerRecord: An updated record reflecting the migration.
    """
    updated_record = _mark_file_migrated_in_db(connection, _migrate_file_in_s3(s3_client, file_record))
    return updated_record


def main() -> None:
    """Main program function."""
    db_connection = attach_demos_to_conn(create_duckdb_conn())
    s3_client = get_s3_client()
    unmigrated_files = get_unmigrated_files(db_connection)
    migration_result = [migrate_file(db_connection, s3_client, file_record) for file_record in unmigrated_files]
    successful_files = [
        file_record
        for file_record in migration_result
        if file_record._local_file_has_been_moved and file_record.file_has_been_moved
    ]
    failed_files = [
        file_record
        for file_record in migration_result
        if not (file_record._local_file_has_been_moved and file_record.file_has_been_moved)
    ]
    logger.info(f"Migrated {len(successful_files)} files successfully")
    if failed_files:
        logger.error(f"Failed to migrate {len(failed_files)} files successfully")
        sys.exit(1)
>>>>>>> main


if __name__ == "__main__":
    main()
