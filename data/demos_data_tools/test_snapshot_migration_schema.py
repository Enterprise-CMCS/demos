"""A module containing tests for the snapshot_migration_schema.py file."""

from argparse import Namespace
from datetime import datetime
from textwrap import dedent
from typing import cast
from unittest.mock import MagicMock, call

import pytest

import snapshot_migration_schema
from types_constants import DataLoadConfiguration, SchemaTableList, SnapshotSchemaName


class TestManageMigrationSchemas:
    """A class for the tests for the snapshot_migration_schema.py file."""

    @pytest.fixture()
    def mock_conn(self, mocker):
        """Set up a mock connection for use in testing."""
        mock_conn = mocker.MagicMock()
        return mock_conn

    def test__parse_args(self, mocker):
        """Test snapshot_migration_schema.py functions.

        ::_parse_args

        ::It should parse the args and return arguments.
        """
        mock_parser = MagicMock()
        mock_parser.parse_args.return_value = Namespace(
            db_config_name="the_database_config", dl_config_name="the_load_config"
        )
        mock_parser_instance = mocker.patch(
            "snapshot_migration_schema.argparse.ArgumentParser", return_value=mock_parser
        )
        mock_cmd_line_args = mocker.patch("snapshot_migration_schema.CommandLineArguments")

        snapshot_migration_schema._parse_args()
        mock_parser_instance.assert_called_once()
        assert (
            mock_parser_instance.call_args.kwargs["description"]
            == "Snapshot a source schema for a data load into a timestamped schema"
        )
        assert callable(mock_parser_instance.call_args.kwargs["formatter_class"])
        assert mock_parser.add_argument.call_args_list == [
            call(
                "db_config_name",
                choices=snapshot_migration_schema.DB_CONFIG_NAMES,
                help="The name of the DB config to use",
            ),
            call(
                "dl_config_name",
                choices=snapshot_migration_schema.DL_CONFIG_NAMES,
                help="The name of the data load config to use",
            ),
        ]
        mock_parser.parse_args.assert_called_once_with()
        mock_cmd_line_args.assert_called_once_with(
            db_config_name="the_database_config", dl_config_name="the_load_config"
        )

    def test__get_list_of_snapshot_tables(self, mocker, mock_conn):
        """Test snapshot_migration_schema.py functions.

        ::_get_list_of_snapshot_tables

        ::It should call the table getter to return a list of tables.
        """
        mock_result = SchemaTableList("legacy_pmda_staged", ["table1", "table2"])
        mock_table_get = mocker.patch(
            "snapshot_migration_schema.get_table_list_for_schema",
            return_value=mock_result,
        )
        test_dl_config = DataLoadConfiguration("legacy_pmda_staged", "demos_app", ())

        result = snapshot_migration_schema._get_list_of_snapshot_tables(
            "ddb_demos_localstack",
            test_dl_config,
            mock_conn,
        )

        assert result == mock_result.table_list
        mock_table_get.assert_called_once_with("ddb_demos_localstack", "legacy_pmda_staged", mock_conn)

    def test__create_snapshot_schema(self, mocker, mock_conn):
        """Test snapshot_migration_schema.py functions.

        ::_create_snapshot_schema

        ::It should create a schema with a timestamp using the source schema.
        """
        mock_dt = mocker.patch("snapshot_migration_schema.datetime")
        # Full replacement of the datetime.now() means we don't mess with timezone conversion
        mock_dt.now.return_value = datetime(2026, 8, 31, 14, 30, 0)
        test_dl_config = DataLoadConfiguration("legacy_pmda_migration_rev_01", "demos_app", ())

        result = snapshot_migration_schema._create_snapshot_schema("ddb_demos_aws", test_dl_config, mock_conn)

        assert result == "legacy_pmda_migration_rev_01_20260831_143000_et"
        actual_query = mock_conn.execute.call_args[0][0]
        assert dedent(actual_query) == dedent(f"""
            CREATE SCHEMA ddb_demos_aws.{result};
        """)

    def test__select_table_into_snapshot_schema(self, mocker, mock_conn):
        """Test snapshot_migration_schema.py functions.

        ::_select_table_into_snapshot_schema

        ::It should create the table requested.
        """
        mock_table_select = mocker.patch("snapshot_migration_schema.select_table_from_source_to_target")
        test_dl_config = DataLoadConfiguration("legacy_pmda_migration_rev_01", "demos_app", ())

        snapshot_migration_schema._select_table_into_snapshot_schema(
            "ddb_demos_aws",
            test_dl_config,
            mock_conn,
            "my_table",
            cast(SnapshotSchemaName, "legacy_pmda_migration_rev_01_20260831143000_et"),
        )

        mock_table_select.assert_called_once_with(
            source_attach_name="ddb_demos_aws",
            target_attach_name="ddb_demos_aws",
            source_schema_name="legacy_pmda_migration_rev_01",
            target_schema_name="legacy_pmda_migration_rev_01_20260831143000_et",
            table_name="my_table",
            conn=mock_conn,
        )

    def test_main(self, mocker, mock_conn):
        """Test snapshot_migration_schema.py functions.

        ::main

        ::It should make a full snapshot as requested.
        """
        mock_conn_create = mocker.patch("snapshot_migration_schema.create_duckdb_conn", return_value=mock_conn)
        mock_conn_attach = mocker.patch("snapshot_migration_schema.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock_get_attach_name = mocker.patch(
            "snapshot_migration_schema.get_attach_name_from_db_config_name", return_value="ddb_demos_aws"
        )
        mock_data_load_configuration = DataLoadConfiguration("legacy_pmda_staged", "demos_app", ())
        mock_get_dl_config = mocker.patch(
            "snapshot_migration_schema.get_data_load_configuration", return_value=mock_data_load_configuration
        )
        mock_snapshot_schema = "legacy_pmda_staged_20260322_114144_et"
        mock_create_schema = mocker.patch(
            "snapshot_migration_schema._create_snapshot_schema", return_value=mock_snapshot_schema
        )
        mock_get_tables = mocker.patch(
            "snapshot_migration_schema._get_list_of_snapshot_tables", return_value=["table1", "table2"]
        )
        mock_select_into = mocker.patch("snapshot_migration_schema._select_table_into_snapshot_schema")
        test_command_line_args = snapshot_migration_schema.CommandLineArguments("demos-aws", "base")

        snapshot_migration_schema.main(test_command_line_args)

        mock_conn_create.assert_called_once_with()
        mock_conn_attach.assert_called_once_with(mock_conn, test_command_line_args.db_config_name)
        mock_get_attach_name.assert_called_once_with(test_command_line_args.db_config_name)
        mock_get_dl_config.assert_called_once_with(test_command_line_args.dl_config_name)
        mock_create_schema.assert_called_once_with("ddb_demos_aws", mock_data_load_configuration, mock_conn)
        mock_get_tables.assert_called_once_with("ddb_demos_aws", mock_data_load_configuration, mock_conn)
        assert mock_select_into.call_args_list == [
            call(
                "ddb_demos_aws",
                mock_data_load_configuration,
                mock_conn,
                "table1",
                "legacy_pmda_staged_20260322_114144_et",
            ),
            call(
                "ddb_demos_aws",
                mock_data_load_configuration,
                mock_conn,
                "table2",
                "legacy_pmda_staged_20260322_114144_et",
            ),
        ]
