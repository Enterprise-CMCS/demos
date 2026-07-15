"""A module containing tests for the migrate_files.py file."""

import os
from typing import List
from unittest.mock import call

import pytest

import migrate_files


class TestMigrateFiles:
    """A class for the tests for the migrate_files.py file."""

    @pytest.fixture
    def mock_conn(self, mocker):
        """Set up a mock connection for use in testing."""
        mock_conn = mocker.MagicMock()
        mock_row_result = [
            ("old/1.txt", "new/1.txt"),
            ("old/2.txt", "new/2.txt"),
        ]
        mock_conn.execute.return_value.fetchall.return_value = mock_row_result
        return mock_conn

    @pytest.fixture
    def mock_s3_client(self, mocker):
        """Set up a mock S3 client for use in testing."""
        return mocker.MagicMock()

    @pytest.fixture
    def mock_env_nonprod(self, mocker):
        """Set the default non-prod environment variables used by the migration script."""
        mocker.patch.dict(
            os.environ,
            {
                "SOURCE_BUCKET": "source-bucket",
                "DESTINATION_BUCKET": "destination-bucket",
                "FILE_MIGRATION_PRODUCTION_MODE": "0",
            },
        )

    @pytest.fixture
    def mock_env_prod(self, mocker):
        """Set the default prod environment variables used by the migration script."""
        mocker.patch.dict(
            os.environ,
            {
                "SOURCE_BUCKET": "source-bucket",
                "DESTINATION_BUCKET": "destination-bucket",
                "FILE_MIGRATION_PRODUCTION_MODE": "1",
            },
        )

    @pytest.fixture
    def mock_boto3(self, mocker, mock_s3_client):
        """Patch boto3 session creation for the migration script."""
        mock_boto3 = mocker.patch("migrate_files.boto3")
        mock_boto3.Session.return_value.client.return_value = mock_s3_client
        return mock_boto3

    def test_get_unmigrated_files(self, mock_conn):
        """Test migrate_files.py functions.

        ::get_unmigrated_files

        ::It should execute the configured SQL and return fetched rows.
        """
        result = migrate_files.get_unmigrated_files(mock_conn)

        mock_conn.execute.assert_called_once_with(migrate_files.SELECT_UNMIGRATED_FILES_QUERY)
        assert result == [
            {"old_path": "old/1.txt", "new_path": "new/1.txt"},
            {"old_path": "old/2.txt", "new_path": "new/2.txt"},
        ]

    def test_mark_row_copied(self, mock_conn):
        """Test migrate_files.py functions.

        ::mark_row_copied

        ::It should mark the copied row.
        """
        test_row: migrate_files.CopyRow = {"old_path": "old/1.txt", "new_path": "new/1.txt"}
        migrate_files.mark_row_copied(mock_conn, test_row)

        mock_conn.execute.assert_called_once_with(
            migrate_files.MARK_FILE_MIGRATED_QUERY,
            test_row,
        )

    def test_copy_s3_object(self, mock_s3_client):
        """Test migrate_files.py functions.

        ::copy_s3_object

        ::It should issue a server-side S3 copy request.
        """
        migrate_files.copy_s3_object(
            mock_s3_client,
            "source-bucket",
            "destination-bucket",
            "old/file.txt",
            "new/file.txt",
        )

        mock_s3_client.copy.assert_called_once_with(
            {"Bucket": "source-bucket", "Key": "old/file.txt"},
            "destination-bucket",
            "new/file.txt",
        )

    def test_migrate_file_01(self, mocker, mock_conn, mock_s3_client, mock_env_prod, caplog):
        """Test migrate_files.py functions.

        ::migrate_file

        ::It should copy the provided row and move the file if in production.
        """
        test_row: migrate_files.CopyRow = {"old_path": "old/1.txt", "new_path": "new/1.txt"}
        mock_copy_s3_object = mocker.patch("migrate_files.copy_s3_object")
        mock_mark_row_copied = mocker.patch("migrate_files.mark_row_copied")

        migrate_files.migrate_file(mock_conn, test_row, mock_s3_client)

        mock_copy_s3_object.assert_called_once_with(
            mock_s3_client,
            "source-bucket",
            "destination-bucket",
            "old/1.txt",
            "new/1.txt",
        )
        mock_mark_row_copied.assert_called_once_with(mock_conn, test_row)
        assert "Copying s3://source-bucket/old/1.txt -> s3://destination-bucket/new/1.txt" in caplog.messages

    def test_migrate_file_02(self, mocker, mock_conn, mock_s3_client, mock_env_nonprod, caplog):
        """Test migrate_files.py functions.

        ::migrate_file

        ::It should not copy the provided row and not move the file if not in production.
        """
        test_row: migrate_files.CopyRow = {"old_path": "old/1.txt", "new_path": "new/1.txt"}
        mock_copy_s3_object = mocker.patch("migrate_files.copy_s3_object")
        mock_mark_row_copied = mocker.patch("migrate_files.mark_row_copied")

        migrate_files.migrate_file(mock_conn, test_row, mock_s3_client)

        mock_copy_s3_object.assert_not_called()
        mock_mark_row_copied.assert_not_called()
        assert "Would have copied s3://source-bucket/old/1.txt -> s3://destination-bucket/new/1.txt" in caplog.messages

    def test_main(self, mocker, mock_conn, mock_boto3, mock_s3_client):
        """Test migrate_files.py functions.

        ::main

        ::It should fetch needed resources and run the migration.
        """
        test_rows: List[migrate_files.CopyRow] = [
            {"old_path": "old/1.txt", "new_path": "new/1.txt"},
            {"old_path": "old/2.txt", "new_path": "new/2.txt"},
        ]
        mock_create_duckdb_conn = mocker.patch("migrate_files.create_duckdb_conn", return_value=mock_conn)
        mock_get_unmigrated_files = mocker.patch("migrate_files.get_unmigrated_files", return_value=test_rows)
        mock_migrate_file = mocker.patch("migrate_files.migrate_file")

        migrate_files.main()

        mock_create_duckdb_conn.assert_called_once()
        mock_boto3.Session.return_value.client.assert_called_once_with("s3")
        mock_get_unmigrated_files.assert_called_once_with(mock_conn)
        assert mock_migrate_file.call_count == 2
        assert mock_migrate_file.call_args_list == [
            call(mock_conn, test_rows[0], mock_s3_client),
            call(mock_conn, test_rows[1], mock_s3_client),
        ]
