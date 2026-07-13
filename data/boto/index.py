"""Copy files between buckets on the same S3-compatible service.

Rows are read from Postgres using the DATABASE_URL environment variable.
The query must return: old_path, new_path, flag.
Only rows with `flag = true` are copied.
"""

from __future__ import annotations

import os
from pathlib import Path

import boto3
import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row


ENV_FILE = Path(__file__).with_name(".env")
BATCH_SIZE = 10
REQUIRED_ENV_VARS = (
	"DATABASE_URL",
	"S3_ENDPOINT_URL",
	"SOURCE_BUCKET",
	"DESTINATION_BUCKET",
	"AWS_REGION",
	"AWS_PROFILE",
	"DRY_RUN",
)
SQL_QUERY = """
SELECT old_path, new_path, flag
FROM file_migration_queue
WHERE flag = true
"""



def validate_env() -> dict[str, str | bool]:
	"""Validate required environment variables and return normalized values."""
	env = {}
	for env_var in REQUIRED_ENV_VARS:
		value = os.environ[env_var].strip()
		if not value:
			raise ValueError(f"{env_var} must not be empty")
		env[env_var] = value

	if env["DRY_RUN"] not in {"0", "1"}:
		raise ValueError("DRY_RUN must be '0' or '1'")

	env["DRY_RUN"] = env["DRY_RUN"] == "1"
	return env


def fetch_rows_from_postgres(database_url: str):
	"""Read copy rows from Postgres in batches."""
	with psycopg.connect(database_url, row_factory=dict_row) as connection:
		with connection.cursor() as cursor:
			cursor.execute(SQL_QUERY)
			while True:
				rows = list(cursor.fetchmany(BATCH_SIZE))
				if not rows:
					break
				yield rows


def copy_s3_object(
	s3_client,
	source_bucket: str,
	destination_bucket: str,
	old_path: str,
	new_path: str,
) -> None:
	"""Copy one object within the same S3-compatible service."""
	s3_client.copy(
		{"Bucket": source_bucket, "Key": old_path},
		destination_bucket,
		new_path,
	)


def copy_rows(
	rows: list[dict[str, object]],
	s3_client,
	source_bucket: str,
	destination_bucket: str,
	dry_run: bool,
) -> int:
	"""Copy a batch of rows from the source bucket to the destination bucket."""

	copied_count = 0
	for row in rows:
		print(
			f"Copying s3://{source_bucket}/{row['old_path']} -> "
			f"s3://{destination_bucket}/{row['new_path']}"
		)
		if not dry_run:
			copy_s3_object(
				s3_client,
				source_bucket,
				destination_bucket,
				row["old_path"],
				row["new_path"],
			)

		copied_count += 1

	return copied_count


def copy_all_files(
	database_url: str,
	s3_client,
	source_bucket: str,
	destination_bucket: str,
	dry_run: bool,
) -> int:
	"""Fetch Postgres rows in batches and copy each batch."""
	copied_count = 0
	for batch_number, rows in enumerate(fetch_rows_from_postgres(database_url), start=1):
		print(f"Processing batch {batch_number} with {len(rows)} row(s).")
		copied_count += copy_rows(
			rows,
			s3_client,
			source_bucket,
			destination_bucket,
			dry_run,
		)

	return copied_count


def main() -> int:
	"""Run the command line program."""
	load_dotenv(ENV_FILE)
	env = validate_env()

	session = boto3.Session(profile_name=env["AWS_PROFILE"])
	s3_client = session.client(
		"s3",
		endpoint_url=env["S3_ENDPOINT_URL"],
		region_name=env["AWS_REGION"],
	)
	copied_count = copy_all_files(
		env["DATABASE_URL"],
		s3_client,
		env["SOURCE_BUCKET"],
		env["DESTINATION_BUCKET"],
		env["DRY_RUN"],
	)

	print(f'{"Would copy" if env["DRY_RUN"] else "Copied"} {copied_count} file(s).')
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
