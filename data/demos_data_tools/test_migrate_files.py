"""A module containing tests for the migrate_files.py file."""

import os
<<<<<<< HEAD
from typing import List
=======
from dataclasses import replace
from textwrap import dedent
>>>>>>> main
from unittest.mock import call

import pytest

import migrate_files
<<<<<<< HEAD
=======
from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME
>>>>>>> main


class TestMigrateFiles:
    """A class for the tests for the migrate_files.py file."""

<<<<<<< HEAD
=======
    # Database return version
    mock_row_result = [
        (
            "160721b7-ad29-44c9-9595-4a30ae624d06",
            "02a8f931-1c57-421b-b106-7417fb427fa7/160721b7-ad29-44c9-9595-4a30ae624d06",
            1,
            "some/old/upload/121/file.xlsx.0",
            "xlsx",
            "xlsx-mime-type",
            False,
            False,
        ),
        (
            "e898b7a5-8754-451f-b888-76b1d0a8475f",
            "02a8f931-1c57-421b-b106-7417fb427fa7/e898b7a5-8754-451f-b888-76b1d0a8475f",
            2,
            "some/old/upload/121/file.xlsx.1",
            "xlsx",
            "xlsx-mime-type",
            False,
            False,
        ),
        (
            "d95cdf17-2622-4c52-973b-2570c9763fe9",
            "02a8f931-1c57-421b-b106-7417fb427fa7/d95cdf17-2622-4c52-973b-2570c9763fe9",
            3,
            "some/old/upload/121/other file names.pdf.0",
            "pdf",
            "pdf-mime-type",
            False,
            False,
        ),
        (
            "afa818d7-2c2a-447a-b35b-6528ef71d477",
            "02a8f931-1c57-421b-b106-7417fb427fa7/afa818d7-2c2a-447a-b35b-6528ef71d477",
            4,
            "some/old/upload/121/this is a file.docx.0",
            "docx",
            "docx-mime-type",
            False,
            False,
        ),
    ]

    # Return transformed to dataclass
    mock_dataclass_result = [migrate_files.FileMigrationTrackerRecord(*row) for row in mock_row_result]

    @pytest.fixture
    def mock_env_devcontainer(self, mocker):
        """Set up a mock devcontainer environment."""
        mocked_values = {
            "PMDA_S3_BUCKET": "devcontainer-source-bucket",
            "DEMOS_S3_BUCKET": "devcontainer-destination-bucket",
            "STAGING_SCHEMA": "devcontainer-staging-schema",
            "DEVCONTAINER": "true",
        }
        mocker.patch.dict(
            os.environ,
            mocked_values,
            clear=True,
        )
        mocker.patch.object(migrate_files, "PMDA_S3_BUCKET", mocked_values["PMDA_S3_BUCKET"])
        mocker.patch.object(migrate_files, "DEMOS_S3_BUCKET", mocked_values["DEMOS_S3_BUCKET"])
        mocker.patch.object(migrate_files, "STAGING_SCHEMA", mocked_values["STAGING_SCHEMA"])
        return mocked_values

    @pytest.fixture
    def mock_env_prod(self, mocker):
        """Set up a mock prod environment."""
        mocked_values = {
            "PMDA_S3_BUCKET": "prod-source-bucket",
            "DEMOS_S3_BUCKET": "prod-destination-bucket",
            "STAGING_SCHEMA": "prod-staging-schema",
        }
        mocker.patch.dict(
            os.environ,
            mocked_values,
            clear=True,
        )
        mocker.patch.object(migrate_files, "PMDA_S3_BUCKET", mocked_values["PMDA_S3_BUCKET"])
        mocker.patch.object(migrate_files, "DEMOS_S3_BUCKET", mocked_values["DEMOS_S3_BUCKET"])
        mocker.patch.object(migrate_files, "STAGING_SCHEMA", mocked_values["STAGING_SCHEMA"])
        return mocked_values

    @pytest.fixture
    def mock_boto3(self, mocker):
        """Patch the boto3 invocation and return a mocked S3 client."""
        mock_s3_client = mocker.MagicMock()
        mock_boto3 = mocker.patch("migrate_files.boto3")
        mock_boto3.client.return_value = mock_s3_client
        return {"boto3": mock_boto3, "s3_client": mock_s3_client}

>>>>>>> main
    @pytest.fixture
    def mock_conn(self, mocker):
        """Set up a mock connection for use in testing."""
        mock_conn = mocker.MagicMock()
<<<<<<< HEAD
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
                "PMDA_S3_BUCKET": "source-bucket",
                "DEMOS_S3_BUCKET": "destination-bucket",
                "FILE_MIGRATION_PRODUCTION_MODE": "0",
            },
        )

    @pytest.fixture
    def mock_env_prod(self, mocker):
        """Set the default prod environment variables used by the migration script."""
        mocker.patch.dict(
            os.environ,
            {
                "PMDA_S3_BUCKET": "source-bucket",
                "DEMOS_S3_BUCKET": "destination-bucket",
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
=======
        return mock_conn

    def test_get_s3_client_01(self, mock_env_prod, mock_boto3):
        """Test migrate_files.py functions.

        ::get_s3_client

        ::It should get a regular client when not in a devcontainer.
        """
        migrate_files.get_s3_client()

        mock_boto3["boto3"].client.assert_called_once_with("s3")

    def test_get_s3_client_02(self, mock_env_devcontainer, mock_boto3):
        """Test migrate_files.py functions.

        ::get_s3_client

        ::It should get a localstack client when in a devcontainer.
        """
        migrate_files.get_s3_client()

        mock_boto3["boto3"].client.assert_called_once_with("s3", endpoint_url="http://localstack:4566")

    def test_get_unmigrated_files(self, mock_env_devcontainer, mock_conn):
>>>>>>> main
        """Test migrate_files.py functions.

        ::get_unmigrated_files

        ::It should execute the configured SQL and return fetched rows.
        """
<<<<<<< HEAD
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
=======
        mock_conn.execute.return_value.fetchall.return_value = self.mock_row_result
        expected_query = f"""
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
                {DEMOS_DDB_ATTACH_NAME}.{mock_env_devcontainer["STAGING_SCHEMA"]}.system_file_move_tracker
            WHERE
                NOT file_has_been_moved;
        """

        result = migrate_files.get_unmigrated_files(mock_conn)

        actual_query = mock_conn.execute.call_args[0][0]
        assert dedent(actual_query) == dedent(expected_query)
        assert result == self.mock_dataclass_result

    def test__mark_file_migrated_in_db_01(self, mock_env_prod, mock_conn):
        """Test migrate_files.py functions.

        ::_mark_file_migrated_in_db

        ::It should mark the file if the local record shows that it has been migrated.
        """
        test_input = replace(self.mock_dataclass_result[0], _local_file_has_been_moved=True)
        expected_query = f"""
            UPDATE
                {DEMOS_DDB_ATTACH_NAME}.{mock_env_prod["STAGING_SCHEMA"]}.system_file_move_tracker
            SET
                file_has_been_moved = TRUE
            WHERE
                final_document_id = $final_document_id;
        """
        expected_output = replace(
            self.mock_dataclass_result[0],
            file_has_been_moved=True,
            _local_file_has_been_moved=True,
        )

        result = migrate_files._mark_file_migrated_in_db(mock_conn, test_input)

        actual_query = mock_conn.execute.call_args[0][0]
        actual_params = mock_conn.execute.call_args[0][1]
        assert dedent(actual_query) == dedent(expected_query)
        assert actual_params == {"final_document_id": test_input.final_document_id}
        assert result == expected_output

    def test__mark_file_migrated_in_db_02(self, mock_env_prod, mock_conn):
        """Test migrate_files.py functions.

        ::_mark_file_migrated_in_db

        ::It should take no action if the local record does not show that it has been migrated.
        """
        test_input = self.mock_dataclass_result[0]

        result = migrate_files._mark_file_migrated_in_db(mock_conn, test_input)

        mock_conn.execute.assert_not_called()
        assert result == test_input

    def test__mark_file_migrated_in_db_03(self, mock_env_prod, mock_conn, caplog):
        """Test migrate_files.py functions.

        ::_mark_file_migrated_in_db

        ::It should gracefully handle when an exception occurs.
        """
        test_input = replace(self.mock_dataclass_result[0], _local_file_has_been_moved=True)
        mock_conn.execute.side_effect = Exception("A bad thing has occurred!")

        result = migrate_files._mark_file_migrated_in_db(mock_conn, test_input)
        assert mock_conn.execute.was_called()
        assert result == test_input
        assert "A bad thing has occurred!" in caplog.text

    def test__migrate_file_in_s3_01(self, mock_env_devcontainer, mock_boto3):
        """Test migrate_files.py functions.

        ::_migrate_file_in_s3

        ::It should perform the copy and return an updated object.
        """
        test_input = self.mock_dataclass_result[2]

        result = migrate_files._migrate_file_in_s3(mock_boto3["s3_client"], test_input)

        mock_boto3["s3_client"].copy.assert_called_once_with(
            {"Bucket": mock_env_devcontainer["PMDA_S3_BUCKET"], "Key": test_input.legacy_pmda_s3_path},
            mock_env_devcontainer["DEMOS_S3_BUCKET"],
            test_input.final_document_s3_path,
            ExtraArgs={
                "MetadataDirective": "REPLACE",
                "ContentType": test_input.file_mime_type,
            },
        )
        assert result == replace(test_input, _local_file_has_been_moved=True)

    def test__migrate_file_in_s3_02(self, mock_env_devcontainer, mock_boto3, caplog):
        """Test migrate_files.py functions.

        ::_migrate_file_in_s3

        ::It should gracefully handle an exception.
        """
        test_input = self.mock_dataclass_result[3]
        mock_boto3["s3_client"].copy.side_effect = Exception("Something went wrong with S3!")

        result = migrate_files._migrate_file_in_s3(mock_boto3["s3_client"], test_input)

        assert result == test_input
        assert "Something went wrong with S3!" in caplog.text

    def test_migrate_file(self, mock_env_prod, mock_conn, mock_boto3, mocker):
>>>>>>> main
        """Test migrate_files.py functions.

        ::migrate_file

<<<<<<< HEAD
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
=======
        ::It should migrate the file record given.
        """
        test_input = self.mock_dataclass_result[1]
        updated_test_input = replace(test_input, _local_file_has_been_moved=True)
        mock_file_migrate_function = mocker.patch("migrate_files._migrate_file_in_s3", return_value=updated_test_input)
        mock_db_migrate_function = mocker.patch("migrate_files._mark_file_migrated_in_db")

        migrate_files.migrate_file(mock_conn, mock_boto3["s3_client"], test_input)

        mock_file_migrate_function.assert_called_once_with(mock_boto3["s3_client"], test_input)
        mock_db_migrate_function.assert_called_once_with(mock_conn, updated_test_input)

    def test_main_01(self, mock_env_prod, mock_conn, mock_boto3, mocker, caplog):
>>>>>>> main
        """Test migrate_files.py functions.

        ::main

<<<<<<< HEAD
        ::It should fetch needed resources and run the migration.
        """
        test_rows: List[migrate_files.CopyRow] = [
            {"old_path": "old/1.txt", "new_path": "new/1.txt"},
            {"old_path": "old/2.txt", "new_path": "new/2.txt"},
        ]
        mock_create_duckdb_conn = mocker.patch("migrate_files.create_duckdb_conn", return_value=mock_conn)
        mock_attach_demos_to_conn = mocker.patch("migrate_files.attach_demos_to_conn", return_value=mock_conn)
        mock_get_unmigrated_files = mocker.patch("migrate_files.get_unmigrated_files", return_value=test_rows)
        mock_migrate_file = mocker.patch("migrate_files.migrate_file")
=======
        ::It should perform the migration.
        """
        mock_create_duckdb_conn = mocker.patch("migrate_files.create_duckdb_conn", return_value=mock_conn)
        mock_attach_demos_to_conn = mocker.patch("migrate_files.attach_demos_to_conn", return_value=mock_conn)
        mock_get_s3_client = mocker.patch("migrate_files.get_s3_client", return_value=mock_boto3["s3_client"])
        mock_get_unmigrated_files = mocker.patch(
            "migrate_files.get_unmigrated_files", return_value=self.mock_dataclass_result
        )
        mock_success_results = [
            replace(result, file_has_been_moved=True, _local_file_has_been_moved=True)
            for result in self.mock_dataclass_result
        ]
        mock_migrate_file = mocker.patch("migrate_files.migrate_file", side_effect=mock_success_results)
>>>>>>> main

        migrate_files.main()

        mock_create_duckdb_conn.assert_called_once()
        mock_attach_demos_to_conn.assert_called_once_with(mock_conn)
<<<<<<< HEAD
        mock_boto3.Session.return_value.client.assert_called_once_with("s3")
        mock_get_unmigrated_files.assert_called_once_with(mock_conn)
        assert mock_migrate_file.call_count == 2
        assert mock_migrate_file.call_args_list == [
            call(mock_conn, test_rows[0], mock_s3_client),
            call(mock_conn, test_rows[1], mock_s3_client),
        ]
=======
        mock_get_s3_client.assert_called_once()
        mock_get_unmigrated_files.assert_called_once_with(mock_conn)
        assert mock_migrate_file.call_count == 4
        assert mock_migrate_file.call_args_list == [
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[0]),
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[1]),
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[2]),
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[3]),
        ]
        assert "Failed" not in caplog.text

    def test_main_02(self, mock_env_prod, mock_conn, mock_boto3, mocker, caplog):
        """Test migrate_files.py functions.

        ::main

        ::It should send an error message if any migrations fail.
        """
        mock_create_duckdb_conn = mocker.patch("migrate_files.create_duckdb_conn", return_value=mock_conn)
        mock_attach_demos_to_conn = mocker.patch("migrate_files.attach_demos_to_conn", return_value=mock_conn)
        mock_get_s3_client = mocker.patch("migrate_files.get_s3_client", return_value=mock_boto3["s3_client"])
        mock_get_unmigrated_files = mocker.patch(
            "migrate_files.get_unmigrated_files", return_value=self.mock_dataclass_result
        )
        mock_success_results = [
            replace(result, file_has_been_moved=True, _local_file_has_been_moved=True)
            for result in self.mock_dataclass_result[0:2]
        ]
        mock_failure_results = [
            replace(self.mock_dataclass_result[2], file_has_been_moved=False, _local_file_has_been_moved=True),
            replace(self.mock_dataclass_result[3], file_has_been_moved=False, _local_file_has_been_moved=False),
        ]
        mock_migrate_file = mocker.patch(
            "migrate_files.migrate_file", side_effect=[*mock_success_results, *mock_failure_results]
        )

        with pytest.raises(SystemExit) as exit_info:
            migrate_files.main()

        assert exit_info.value.code == 1
        mock_create_duckdb_conn.assert_called_once()
        mock_attach_demos_to_conn.assert_called_once_with(mock_conn)
        mock_get_s3_client.assert_called_once()
        mock_get_unmigrated_files.assert_called_once_with(mock_conn)
        assert mock_migrate_file.call_count == 4
        assert mock_migrate_file.call_args_list == [
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[0]),
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[1]),
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[2]),
            call(mock_conn, mock_boto3["s3_client"], self.mock_dataclass_result[3]),
        ]
        assert "Failed" in caplog.text
>>>>>>> main
