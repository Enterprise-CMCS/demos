"""Tests for the boto copy script."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType
from unittest.mock import MagicMock

def load_index_module(monkeypatch):
	"""Load the script module with stubbed third-party dependencies."""
	boto3_module = ModuleType("boto3")
	boto3_module.Session = MagicMock(name="Session")

	psycopg_module = ModuleType("psycopg")
	psycopg_module.connect = MagicMock(name="connect")

	psycopg_rows_module = ModuleType("psycopg.rows")
	psycopg_rows_module.dict_row = object()

	dotenv_module = ModuleType("dotenv")
	dotenv_module.load_dotenv = MagicMock(name="load_dotenv")

	monkeypatch.setitem(sys.modules, "boto3", boto3_module)
	monkeypatch.setitem(sys.modules, "psycopg", psycopg_module)
	monkeypatch.setitem(sys.modules, "psycopg.rows", psycopg_rows_module)
	monkeypatch.setitem(sys.modules, "dotenv", dotenv_module)

	module_path = Path(__file__).with_name("index.py")
	spec = importlib.util.spec_from_file_location("test_boto_index_module", module_path)
	module = importlib.util.module_from_spec(spec)
	assert spec.loader is not None
	spec.loader.exec_module(module)
	return module


def test_fetch_rows_from_postgres(monkeypatch):
	"""It should execute the configured SQL and return fetched row batches."""
	index = load_index_module(monkeypatch)
	connection = MagicMock()
	cursor = MagicMock()
	rows = [{"old_path": "a", "new_path": "b", "flag": True}]

	index.psycopg.connect.return_value.__enter__.return_value = connection
	connection.cursor.return_value.__enter__.return_value = cursor
	cursor.fetchmany.side_effect = [rows, []]

	result = list(index.fetch_rows_from_postgres("postgresql://example"))

	index.psycopg.connect.assert_called_once_with(
		"postgresql://example",
		row_factory=index.dict_row,
	)
	connection.cursor.assert_called_once_with()
	cursor.execute.assert_called_once_with(index.SQL_QUERY)
	assert cursor.fetchmany.call_count == 2
	cursor.fetchmany.assert_any_call(index.BATCH_SIZE)
	assert result == [rows]


def test_copy_s3_object(monkeypatch):
	"""It should issue a server-side S3 copy request."""
	index = load_index_module(monkeypatch)
	s3_client = MagicMock()

	index.copy_s3_object(s3_client, "source-bucket", "destination-bucket", "old/file.txt", "new/file.txt")

	s3_client.copy.assert_called_once_with(
		{"Bucket": "source-bucket", "Key": "old/file.txt"},
		"destination-bucket",
		"new/file.txt",
	)


def test_copy_rows_copies_each_row(monkeypatch, capsys):
	"""It should copy each row in the provided batch."""
	index = load_index_module(monkeypatch)
	s3_client = MagicMock()
	rows = [
		{"old_path": f"old/{number}.txt", "new_path": f"new/{number}.txt", "flag": True}
		for number in range(12)
	]

	result = index.copy_rows(rows, s3_client, "source-bucket", "destination-bucket", False)

	assert result == 12
	assert s3_client.copy.call_count == 12
	assert "Copying s3://source-bucket/old/0.txt -> s3://destination-bucket/new/0.txt" in capsys.readouterr().out


def test_copy_rows_dry_run(monkeypatch):
	"""It should avoid issuing copy calls during dry run."""
	index = load_index_module(monkeypatch)
	s3_client = MagicMock()
	rows = [
		{"old_path": "old/1.txt", "new_path": "new/1.txt", "flag": True},
		{"old_path": "old/2.txt", "new_path": "new/2.txt", "flag": True},
	]

	result = index.copy_rows(rows, s3_client, "source-bucket", "destination-bucket", True)

	assert result == 2
	s3_client.copy.assert_not_called()


def test_copy_all_files(monkeypatch, capsys):
	"""It should fetch Postgres rows in batches and copy each batch."""
	index = load_index_module(monkeypatch)
	row_batches = [
		[{"old_path": "old/1.txt", "new_path": "new/1.txt", "flag": True}],
		[{"old_path": "old/2.txt", "new_path": "new/2.txt", "flag": True}],
	]
	s3_client = MagicMock()
	index.fetch_rows_from_postgres = MagicMock(return_value=row_batches)
	index.copy_rows = MagicMock(side_effect=[1, 1])

	result = index.copy_all_files(
		"postgresql://example",
		s3_client,
		"source-bucket",
		"destination-bucket",
		True,
	)

	assert result == 2
	index.fetch_rows_from_postgres.assert_called_once_with("postgresql://example")
	assert index.copy_rows.call_count == 2
	output = capsys.readouterr().out
	assert "Processing batch 1 with 1 row(s)." in output
	assert "Processing batch 2 with 1 row(s)." in output


def test_copy_all_files_with_many_rows(monkeypatch, capsys):
	"""It should process many mocked rows across multiple batches."""
	index = load_index_module(monkeypatch)
	s3_client = MagicMock()
	all_rows = [
		{"old_path": f"old/{number}.txt", "new_path": f"new/{number}.txt", "flag": True}
		for number in range(25)
	]
	row_batches = [
		all_rows[0:10],
		all_rows[10:20],
		all_rows[20:25],
	]
	index.fetch_rows_from_postgres = MagicMock(return_value=row_batches)

	result = index.copy_all_files(
		"postgresql://example",
		s3_client,
		"source-bucket",
		"destination-bucket",
		False,
	)

	assert result == 25
	assert s3_client.copy.call_count == 25
	output = capsys.readouterr().out
	assert "Processing batch 1 with 10 row(s)." in output
	assert "Processing batch 2 with 10 row(s)." in output
	assert "Processing batch 3 with 5 row(s)." in output


def test_main_wires_dependencies(monkeypatch, capsys):
	"""It should load config, construct clients, fetch rows, and invoke the copy loop."""
	index = load_index_module(monkeypatch)
	session = MagicMock()
	s3_client = MagicMock()
	session.client.return_value = s3_client
	index.boto3.Session.return_value = session
	index.copy_all_files = MagicMock(return_value=2)

	monkeypatch.setenv("DATABASE_URL", "postgresql://example")
	monkeypatch.setenv("S3_ENDPOINT_URL", "https://s3.example.com")
	monkeypatch.setenv("SOURCE_BUCKET", "source-bucket")
	monkeypatch.setenv("DESTINATION_BUCKET", "destination-bucket")
	monkeypatch.setenv("AWS_REGION", "us-east-1")
	monkeypatch.setenv("AWS_PROFILE", "default")
	monkeypatch.setenv("DRY_RUN", "1")

	result = index.main()

	assert result == 0
	index.load_dotenv.assert_called_once_with(index.ENV_FILE)
	index.boto3.Session.assert_called_once_with(profile_name="default")
	session.client.assert_called_once_with(
		"s3",
		endpoint_url="https://s3.example.com",
		region_name="us-east-1",
	)
	index.copy_all_files.assert_called_once_with(
		"postgresql://example",
		s3_client,
		"source-bucket",
		"destination-bucket",
		True,
	)
	assert "Would copy 2 file(s)." in capsys.readouterr().out