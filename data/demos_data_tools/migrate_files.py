"""Migrate files from PMDA to DEMOS S3 buckets based on staged data in PostgreSQL."""

import argparse
import os
import sys
from dataclasses import dataclass, replace
from logging import getLogger
from typing import TYPE_CHECKING, List

import boto3
from dotenv import load_dotenv

from duckdb_connection_manager import (
    attach_db_to_duckdb_conn,
    create_duckdb_conn,
    get_attach_name_from_db_config_name,
)
from load_data_to_demos_app_configs import get_data_load_configuration
from logger_utils import config_logger
from types_constants import (
    DB_CONFIG_NAMES,
    DL_CONFIG_NAMES,
    DatabaseConfigurationName,
    DataLoadConfiguration,
    DataLoadConfigurationName,
    DuckDbAttachName,
    FileMigrationTrackerRecord,
)

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn
    from mypy_boto3_s3 import S3Client

logger = config_logger(getLogger(__name__))

load_dotenv()
PMDA_S3_BUCKET = os.environ["PMDA_S3_BUCKET"]
DEMOS_S3_BUCKET = os.environ["DEMOS_S3_BUCKET"]


@dataclass(frozen=True)
class CommandLineArguments:
    """The command line arguments passed into the program."""

    db_config_name: DatabaseConfigurationName
    dl_config_name: DataLoadConfigurationName


def _parse_args() -> CommandLineArguments:
    """Create argument parser and parse incoming arguments.

    Returns:
        CommandLineArguments: The parsed argument namespace.
    """
    parser = argparse.ArgumentParser(
        description="Rename and migrate files between buckets as part of the migraiton process",
        formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50),
    )
    parser.add_argument("db_config_name", choices=DB_CONFIG_NAMES, help="The name of the DB config to use")
    parser.add_argument("dl_config_name", choices=DL_CONFIG_NAMES, help="The name of the data load config to use")
    parsed_args = parser.parse_args()
    return CommandLineArguments(
        db_config_name=parsed_args.db_config_name,
        dl_config_name=parsed_args.dl_config_name,
    )


def _get_s3_client() -> "S3Client":
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


def _get_unmigrated_files(
    attach_name: DuckDbAttachName, dl_config: DataLoadConfiguration, conn: "DuckConn"
) -> List[FileMigrationTrackerRecord]:
    """Get a list of unmigrated files from the target schema of a data load configuration.

    Args:
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        dl_config (DataLoadConfiguration): The data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.

    Returns:
        List[FileMigrationTrackerRecord]: A list of the unmigrated files.
    """
    logger.info(
        f"Getting list of unmigrated files from {attach_name}.{dl_config.target_schema}.system_file_move_tracker"
    )
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
            {attach_name}.{dl_config.target_schema}.system_file_move_tracker
        WHERE
            NOT file_has_been_moved;
    """
    query_rows = conn.execute(query).fetchall()
    logger.info("Retrieved list of unmigrated files from database")
    return [FileMigrationTrackerRecord(*row) for row in query_rows]


def _mark_file_migrated_in_db(
    attach_name: DuckDbAttachName,
    dl_config: DataLoadConfiguration,
    conn: "DuckConn",
    file_record: FileMigrationTrackerRecord,
) -> FileMigrationTrackerRecord:
    """Mark one file migrated in the database and return the updated record.

    The table is assumed to be in the target_schema of the named DataLoadConfiguration.

    Args:
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        dl_config (DataLoadConfiguration): The data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.
        file_record (FileMigrationTrackerRecord): The migrated file to mark as migrated.

    Returns:
        FileMigrationTrackerRecord: The updated file record.
    """
    query = f"""
        UPDATE
            {attach_name}.{dl_config.target_schema}.system_file_move_tracker
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
        conn.execute(query, {"final_file_id": file_record.final_file_id})
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


def _migrate_file(
    attach_name: DuckDbAttachName,
    dl_config: DataLoadConfiguration,
    conn: "DuckConn",
    s3_client: "S3Client",
    file_record: FileMigrationTrackerRecord,
) -> FileMigrationTrackerRecord:
    """Perform all migration steps for a single record.

    Args:
        attach_name (DuckDbAttachName): The DuckDB attach name to use.
        dl_config (DataLoadConfiguration): The data load configuration to use.
        conn (DuckConn): The DuckDB connection with the proper DB attached.
        s3_client (S3Client): The S3 client used to perform the migration.
        file_record (FileMigrationTrackerRecord): A file to migrate.

    Returns:
        FileMigrationTrackerRecord: An updated record reflecting the migration.
    """
    updated_record = _mark_file_migrated_in_db(
        attach_name, dl_config, conn, _migrate_file_in_s3(s3_client, file_record)
    )
    return updated_record


def main(args: CommandLineArguments) -> None:
    """Main program function."""
    db_conn = attach_db_to_duckdb_conn(create_duckdb_conn(), args.db_config_name)
    s3_client = _get_s3_client()
    attach_name = get_attach_name_from_db_config_name(args.db_config_name)
    dl_config = get_data_load_configuration(args.dl_config_name)
    unmigrated_files = _get_unmigrated_files(attach_name, dl_config, db_conn)
    migration_result = []
    for i, file_record in enumerate(unmigrated_files):
        migration_result.append(_migrate_file(attach_name, dl_config, db_conn, s3_client, file_record))
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
    args = _parse_args()
    main(args)
