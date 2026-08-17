"""Migrate files from PMDA to DEMOS S3 buckets based on staged data in PostgreSQL."""

import os
import sys
from dataclasses import dataclass, replace
from logging import getLogger
from typing import TYPE_CHECKING, List

import boto3
from dotenv import load_dotenv

from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, attach_demos_to_conn, create_duckdb_conn
from logger_utils import config_logger

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn
    from mypy_boto3_s3 import S3Client

load_dotenv()
PMDA_S3_BUCKET = os.environ["PMDA_S3_BUCKET"]
DEMOS_S3_BUCKET = os.environ["DEMOS_S3_BUCKET"]
STAGING_SCHEMA = os.environ["STAGING_SCHEMA"]

logger = config_logger(getLogger(__name__))


@dataclass(frozen=True)
class FileMigrationTrackerRecord:
    """A file migration tracker record for a single file being migrated."""

    final_file_id: str
    final_file_s3_path: str
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
            final_file_id::TEXT,
            final_file_s3_path,
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
            final_file_id = $final_file_id;
    """
    if not file_record._local_file_has_been_moved:
        logger.warning(
            f"Attempted to mark {file_record.final_file_id} migrated in DB "
            "without local migration marked complete; no action was taken"
        )
        return file_record
    try:
        connection.execute(query, {"final_file_id": file_record.final_file_id})
    except Exception as e:
        logger.error(
            f"Exception {e} encountered while attempting to mark {file_record.final_file_id} completed in database"
        )
        return file_record
    updated_file_record = replace(file_record, file_has_been_moved=True)
    logger.debug(f"Marked {file_record.final_file_id} as migrated in database")
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
            file_record.final_file_s3_path,
            ExtraArgs={
                "MetadataDirective": "REPLACE",
                "ContentType": file_record.file_mime_type,
            },
        )
    except Exception as e:
        logger.error(f"Exception {e} encountered while attempting to move file {file_record.final_file_id} in S3")
        return file_record
    updated_file_record = replace(file_record, _local_file_has_been_moved=True)
    logger.debug(f"Migrated {file_record.final_file_id} in S3 from PMDA to DEMOS")
    return updated_file_record


def migrate_file(
    connection: "DuckConn",
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
    migration_result = []
    for i, file_record in enumerate(unmigrated_files):
        migration_result.append(migrate_file(db_connection, s3_client, file_record))
        if ((i + 1) % 100) == 0:
            logger.info(f"Migrated {i + 1} files")
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


if __name__ == "__main__":
    main()
