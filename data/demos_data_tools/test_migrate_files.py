"""A module containing tests for the migrate_files.py file."""

import os
from dataclasses import replace
from textwrap import dedent
from typing import cast
from unittest.mock import call

import pytest

import migrate_files
from types_constants import AppSchemaName, DataLoadConfiguration, MigrationStagedSchemaName


class TestMigrateFiles:
    """A class for the tests for the migrate_files.py file."""

    mock_attach_name = "my-duckdb-attach-name"
    mock_data_load_config = DataLoadConfiguration(
        cast(MigrationStagedSchemaName, "my-favorite-source"),
        cast(AppSchemaName, "my-favorite-destination"),
        (),
    )

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
            "DEVCONTAINER": "true",
        }
        mocker.patch.dict(
            os.environ,
            mocked_values,
            clear=True,
        )
        mocker.patch.object(migrate_files, "PMDA_S3_BUCKET", mocked_values["PMDA_S3_BUCKET"])
        mocker.patch.object(migrate_files, "DEMOS_S3_BUCKET", mocked_values["DEMOS_S3_BUCKET"])
        return mocked_values

    @pytest.fixture
    def mock_env_prod(self, mocker):
        """Set up a mock prod environment."""
        mocked_values = {
            "PMDA_S3_BUCKET": "prod-source-bucket",
            "DEMOS_S3_BUCKET": "prod-destination-bucket",
        }
        mocker.patch.dict(
            os.environ,
            mocked_values,
            clear=True,
        )
        mocker.patch.object(migrate_files, "PMDA_S3_BUCKET", mocked_values["PMDA_S3_BUCKET"])
        mocker.patch.object(migrate_files, "DEMOS_S3_BUCKET", mocked_values["DEMOS_S3_BUCKET"])
        return mocked_values

    @pytest.fixture
    def mock_boto3(self, mocker):
        """Patch the boto3 invocation and return a mocked S3 client."""
        mock_s3_client = mocker.MagicMock()
        mock_boto3 = mocker.patch("migrate_files.boto3")
        mock_boto3.client.return_value = mock_s3_client
        return {"boto3": mock_boto3, "s3_client": mock_s3_client}

    @pytest.fixture
    def mock_conn(self, mocker):
        """Set up a mock connection for use in testing."""
        mock_conn = mocker.MagicMock()
        return mock_conn

    @pytest.fixture
    def mock_attach_name_getter(self, mocker):
        """Patch get_attach_name_from_db_config_name to return a constant value."""
        mock_getter = mocker.patch("migrate_files.get_attach_name_from_db_config_name")
        mock_getter.return_value = self.mock_attach_name
        return mock_getter

    @pytest.fixture
    def mock_data_load_config_getter(self, mocker):
        """Patch get_data_load_configuration to return a constant value."""
        mock_getter = mocker.patch("migrate_files.get_data_load_configuration")
        mock_getter.return_value = self.mock_data_load_config
        return mock_getter

    def test__get_s3_client_01(self, mock_env_prod, mock_boto3):
        """Test migrate_files.py functions.

        ::_get_s3_client

        ::It should get a regular client when not in a devcontainer.
        """
        migrate_files._get_s3_client()

        mock_boto3["boto3"].client.assert_called_once_with("s3")

    def test__get_s3_client_02(self, mock_env_devcontainer, mock_boto3):
        """Test migrate_files.py functions.

        ::_get_s3_client

        ::It should get a localstack client when in a devcontainer.
        """
        migrate_files._get_s3_client()

        mock_boto3["boto3"].client.assert_called_once_with("s3", endpoint_url="http://localstack:4566")

    def test__get_unmigrated_files(
        self, mock_env_devcontainer, mock_conn, mock_attach_name_getter, mock_data_load_config_getter
    ):
        """Test migrate_files.py functions.

        ::_get_unmigrated_files

        ::It should execute the configured SQL and return fetched rows.
        """
        mock_conn.execute.return_value.fetchall.return_value = self.mock_row_result
        expected_query = f"""
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
                {self.mock_attach_name}.{self.mock_data_load_config.target_schema}.system_file_move_tracker
            WHERE
                NOT file_has_been_moved;
        """

        result = migrate_files._get_unmigrated_files("demos-localstack", "rev01", mock_conn)

        actual_query = mock_conn.execute.call_args[0][0]
        assert dedent(actual_query) == dedent(expected_query)
        assert result == self.mock_dataclass_result
        mock_attach_name_getter.assert_called_once_with("demos-localstack")
        mock_data_load_config_getter.assert_called_once_with("rev01")

    def test__mark_file_migrated_in_db_01(
        self, mock_env_prod, mock_conn, mock_attach_name_getter, mock_data_load_config_getter
    ):
        """Test migrate_files.py functions.

        ::_mark_file_migrated_in_db

        ::It should mark the file if the local record shows that it has been migrated.
        """
        test_input = replace(self.mock_dataclass_result[0], _local_file_has_been_moved=True)
        expected_query = f"""
            UPDATE
                {self.mock_attach_name}.{self.mock_data_load_config.target_schema}.system_file_move_tracker
            SET
                file_has_been_moved = TRUE
            WHERE
                final_file_id = $final_file_id;
        """
        expected_output = replace(
            self.mock_dataclass_result[0],
            file_has_been_moved=True,
            _local_file_has_been_moved=True,
        )

        result = migrate_files._mark_file_migrated_in_db("demos-aws", "base", mock_conn, test_input)

        actual_query = mock_conn.execute.call_args[0][0]
        actual_params = mock_conn.execute.call_args[0][1]
        assert dedent(actual_query) == dedent(expected_query)
        assert actual_params == {"final_file_id": test_input.final_file_id}
        assert result == expected_output
        mock_attach_name_getter.assert_called_once_with("demos-aws")
        mock_data_load_config_getter.assert_called_once_with("base")

    def test__mark_file_migrated_in_db_02(
        self, mock_env_prod, mock_conn, mock_attach_name_getter, mock_data_load_config_getter
    ):
        """Test migrate_files.py functions.

        ::_mark_file_migrated_in_db

        ::It should take no action if the local record does not show that it has been migrated.
        """
        test_input = self.mock_dataclass_result[0]

        result = migrate_files._mark_file_migrated_in_db("demos-localstack", "base", mock_conn, test_input)

        mock_conn.execute.assert_not_called()
        assert result == test_input

    def test__mark_file_migrated_in_db_03(
        self, mock_env_prod, mock_conn, mock_attach_name_getter, mock_data_load_config_getter, caplog
    ):
        """Test migrate_files.py functions.

        ::_mark_file_migrated_in_db

        ::It should gracefully handle when an exception occurs.
        """
        test_input = replace(self.mock_dataclass_result[0], _local_file_has_been_moved=True)
        mock_conn.execute.side_effect = Exception("A bad thing has occurred!")

        result = migrate_files._mark_file_migrated_in_db("demos-aws", "base", mock_conn, test_input)
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
            test_input.final_file_s3_path,
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

    def test__migrate_file(self, mock_env_prod, mock_conn, mock_boto3, mocker):
        """Test migrate_files.py functions.

        ::_migrate_file

        ::It should migrate the file record given.
        """
        test_input = self.mock_dataclass_result[1]
        updated_test_input = replace(test_input, _local_file_has_been_moved=True)
        mock_file_migrate_function = mocker.patch("migrate_files._migrate_file_in_s3", return_value=updated_test_input)
        mock_db_migrate_function = mocker.patch("migrate_files._mark_file_migrated_in_db")

        migrate_files._migrate_file("demos-aws", "base", mock_conn, mock_boto3["s3_client"], test_input)

        mock_file_migrate_function.assert_called_once_with(mock_boto3["s3_client"], test_input)
        mock_db_migrate_function.assert_called_once_with("demos-aws", "base", mock_conn, updated_test_input)

    def test_main_01(self, mock_env_prod, mock_conn, mock_boto3, mocker, caplog):
        """Test migrate_files.py functions.

        ::main

        ::It should perform the migration.
        """
        test_args = migrate_files.CommandLineArguments("demos-aws", "rev01")
        mock_create_duckdb_conn = mocker.patch("migrate_files.create_duckdb_conn", return_value=mock_conn)
        mock_attach_db_to_duckdb_conn = mocker.patch("migrate_files.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock__get_s3_client = mocker.patch("migrate_files._get_s3_client", return_value=mock_boto3["s3_client"])
        mock__get_unmigrated_files = mocker.patch(
            "migrate_files._get_unmigrated_files", return_value=self.mock_dataclass_result
        )
        mock_success_results = [
            replace(result, file_has_been_moved=True, _local_file_has_been_moved=True)
            for result in self.mock_dataclass_result
        ]
        mock_migrate_file = mocker.patch("migrate_files._migrate_file", side_effect=mock_success_results)

        migrate_files.main(test_args)

        mock_create_duckdb_conn.assert_called_once()
        mock_attach_db_to_duckdb_conn.assert_called_once_with(mock_conn, test_args.db_config_name)
        mock__get_s3_client.assert_called_once()
        mock__get_unmigrated_files.assert_called_once_with(
            test_args.db_config_name, test_args.dl_config_name, mock_conn
        )
        assert mock_migrate_file.call_count == 4
        assert mock_migrate_file.call_args_list == [
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[0],
            ),
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[1],
            ),
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[2],
            ),
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[3],
            ),
        ]
        assert "Failed" not in caplog.text

    def test_main_02(self, mock_env_prod, mock_conn, mock_boto3, mocker, caplog):
        """Test migrate_files.py functions.

        ::main

        ::It should send an error message if any migrations fail.
        """
        test_args = migrate_files.CommandLineArguments("demos-localstack", "base")
        mock_create_duckdb_conn = mocker.patch("migrate_files.create_duckdb_conn", return_value=mock_conn)
        mock_attach_db_to_duckdb_conn = mocker.patch("migrate_files.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock__get_s3_client = mocker.patch("migrate_files._get_s3_client", return_value=mock_boto3["s3_client"])
        mock__get_unmigrated_files = mocker.patch(
            "migrate_files._get_unmigrated_files", return_value=self.mock_dataclass_result
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
            "migrate_files._migrate_file", side_effect=[*mock_success_results, *mock_failure_results]
        )

        with pytest.raises(SystemExit) as exit_info:
            migrate_files.main(test_args)

        assert exit_info.value.code == 1
        mock_create_duckdb_conn.assert_called_once()
        mock_attach_db_to_duckdb_conn.assert_called_once_with(mock_conn, test_args.db_config_name)
        mock__get_s3_client.assert_called_once()
        mock__get_unmigrated_files.assert_called_once_with(
            test_args.db_config_name, test_args.dl_config_name, mock_conn
        )
        assert mock_migrate_file.call_count == 4
        assert mock_migrate_file.call_args_list == [
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[0],
            ),
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[1],
            ),
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[2],
            ),
            call(
                test_args.db_config_name,
                test_args.dl_config_name,
                mock_conn,
                mock_boto3["s3_client"],
                self.mock_dataclass_result[3],
            ),
        ]
        assert "Failed" in caplog.text
