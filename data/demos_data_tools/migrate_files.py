"""Copy files between buckets on the same S3-compatible service.

Rows are read from Postgres using discrete Postgres environment variables.
The query must return: old_path and new_path.
Only rows with `flag = true` are copied.
"""

import os
from pathlib import Path
from typing import TYPE_CHECKING, Any, Iterator, TypedDict

import boto3
import duckdb
from dotenv import load_dotenv

if TYPE_CHECKING:  # pragma: no cover
    from duckdb import DuckDBPyConnection as DuckConn


ENV_FILE = Path(__file__).with_name(".env")
DUCKDB_POSTGRES_DB_NAME = "postgres_db"
SELECT_UNMIGRATED_FILES_QUERY = """
SELECT old_path, new_path
FROM postgres_db.public.file_migration_queue
WHERE flag = true
"""
MARK_FILE_MIGRATED_QUERY = """
UPDATE postgres_db.public.file_migration_queue
SET flag = false
WHERE old_path = ? AND new_path = ? AND flag = true
"""


class CopyRow(TypedDict):
    """A queued file copy record."""

    old_path: str
    new_path: str


def create_duckdb_postgres_conn() -> "DuckConn":
    """Create a DuckDB connection with the Postgres database attached.

    Returns:
        "DuckConn": A DuckDB connection configured to query Postgres.
    """
    conn = duckdb.connect(":memory:")
    conn.install_extension("postgres")
    conn.load_extension("postgres")

    clean_postgres_pwd = os.environ["POSTGRES_PASSWORD"].replace("'", "''")
    conn.execute(f"""
        CREATE SECRET (
            TYPE postgres,
            HOST '{os.environ["POSTGRES_HOST"]}',
            PORT {os.environ["POSTGRES_PORT"]},
            DATABASE '{os.environ["POSTGRES_DATABASE"]}',
            USER '{os.environ["POSTGRES_USER"]}',
            PASSWORD '{clean_postgres_pwd}'
        );
    """)
    conn.execute(f"ATTACH 'sslmode={os.environ['POSTGRES_SSLMODE']}' AS {DUCKDB_POSTGRES_DB_NAME} (TYPE postgres);")
    return conn


def get_unmigrated_files(connection: "DuckConn") -> Iterator[CopyRow]:
    """Read unmigrated file mappings from Postgres.

    Args:
        connection ("DuckConn"): The DuckDB connection with Postgres attached.

    Yields:
        CopyRow: One row to copy.
    """
    rows = connection.execute(SELECT_UNMIGRATED_FILES_QUERY).fetchall()
    for row in rows:
        yield {
            "old_path": row[0],
            "new_path": row[1],
        }


def mark_row_copied(connection: "DuckConn", row: CopyRow) -> None:
    """Mark one row as copied in Postgres.

    Args:
        connection ("DuckConn"): The DuckDB connection with Postgres attached.
        row (CopyRow): The migrated row to mark as copied.
    """
    connection.execute(
        MARK_FILE_MIGRATED_QUERY,
        [row["old_path"], row["new_path"]],
    )


def copy_s3_object(
    s3_client: Any,
    source_bucket: str,
    destination_bucket: str,
    old_path: str,
    new_path: str,
) -> None:
    """Copy one object within the same S3-compatible service.

    Args:
        s3_client (Any): The S3 client used to perform the copy.
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


def migrate_file(
    connection: "DuckConn",
    row: CopyRow,
    s3_client: Any,
) -> None:
    """Copy one row from the source bucket to the destination bucket.

    Args:
        connection ("DuckConn"): The DuckDB connection with Postgres attached.
        row (CopyRow): The queued row describing the source and destination keys.
        s3_client (Any): The S3 client used to perform the copy.
    """
    source_bucket = os.environ["SOURCE_BUCKET"]
    destination_bucket = os.environ["DESTINATION_BUCKET"]
    print(f"Copying s3://{source_bucket}/{row['old_path']} -> s3://{destination_bucket}/{row['new_path']}")
    if os.environ["PRODUCTION"] == "1":
        copy_s3_object(
            s3_client,
            source_bucket,
            destination_bucket,
            row["old_path"],
            row["new_path"],
        )
        mark_row_copied(connection, row)


def main() -> None:
    """Execute main program function.

    Returns:
        None: This function does not return a value.
    """
    load_dotenv(ENV_FILE)

    db_connection = create_duckdb_postgres_conn()
    session = boto3.Session()
    s3_client = session.client("s3")
    copied_count = 0
    try:
        for row_number, row in enumerate(get_unmigrated_files(db_connection), start=1):
            print(f"Processing row {row_number}.")
            migrate_file(db_connection, row, s3_client)
            copied_count += 1
    finally:
        db_connection.close()

    print(f"{'Copied' if os.environ['PRODUCTION'] == '1' else 'Would copy'} {copied_count} file(s).")
    return None


if __name__ == "__main__":  # pragma: no cover
    main()
