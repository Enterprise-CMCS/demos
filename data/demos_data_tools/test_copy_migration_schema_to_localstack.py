"""A module containing tests for the copy_migration_schema_to_localstack.py file."""

from unittest.mock import call, MagicMock

from argparse import Namespace


from copy_migration_schema_to_localstack import CommandLineArguments
import copy_migration_schema_to_localstack
from types_constants import SchemaTableList


class TestCopyMigrationSchemaToLocalstack:
    """A class for the tests for the copy_migration_schema_to_localstack.py file."""

    def test__parse_args(self, mocker):
        """Test manage_migration_schemas.py functions.

        ::_parse_args

        ::It should parse the args and return arguments.
        """
        mock_parser = MagicMock()
        mock_parser.parse_args.return_value = Namespace(schema_to_copy="shortname")
        mock_parser_instance = mocker.patch(
            "copy_migration_schema_to_localstack.argparse.ArgumentParser", return_value=mock_parser
        )
        mocker.patch(
            "copy_migration_schema_to_localstack.get_migration_schema_name_from_short_name",
            return_value="a_longer_schema_name",
        )
        mock_cmd_line_args = mocker.patch("copy_migration_schema_to_localstack.CommandLineArguments")

        copy_migration_schema_to_localstack._parse_args()
        mock_parser_instance.assert_called_once()
        assert mock_parser_instance.call_args.kwargs["description"] == "Copy a migration schema from AWS to localstack."
        assert callable(mock_parser_instance.call_args.kwargs["formatter_class"])
        mock_parser.add_argument.assert_called_once_with(
            "schema_to_copy",
            choices=copy_migration_schema_to_localstack.MIGRATION_SCHEMA_SHORT_NAMES,
            help="The name of the migration schema to copy",
        )
        mock_parser.parse_args.assert_called_once_with()
        mock_cmd_line_args.assert_called_once_with(schema_to_copy="a_longer_schema_name")

    def test_main(self, mocker):
        """Test duckdb_utilities.py functions.

        ::get_table_list_for_schema

        ::It should query the table list from the database.
        """
        mock_conn = "This is a connection!"
        mock_conn_creator = mocker.patch(
            "copy_migration_schema_to_localstack.create_duckdb_conn", return_value=mock_conn
        )
        mock_db_attacher = mocker.patch(
            "copy_migration_schema_to_localstack.attach_db_to_duckdb_conn", return_value=mock_conn
        )
        mock_table_list = SchemaTableList("legacy_pmda_raw", ["table1", "table2", "table3"])
        mock_table_getter = mocker.patch(
            "copy_migration_schema_to_localstack.get_table_list_for_schema", return_value=mock_table_list
        )
        mock_table_select = mocker.patch("copy_migration_schema_to_localstack.select_table_from_source_to_target")
        test_arguments = CommandLineArguments("legacy_pmda_raw")

        copy_migration_schema_to_localstack.main(test_arguments)

        mock_conn_creator.assert_called_once_with()
        assert mock_db_attacher.call_args_list == [
            call(mock_conn, "demos-aws"),
            call(mock_conn, "demos-localstack"),
        ]
        mock_table_getter.assert_called_once_with("ddb_demos_aws", "legacy_pmda_raw", mock_conn)
        assert mock_table_select.call_args_list == [
            call("ddb_demos_aws", "ddb_demos_localstack", "legacy_pmda_raw", "legacy_pmda_raw", "table1", mock_conn),
            call("ddb_demos_aws", "ddb_demos_localstack", "legacy_pmda_raw", "legacy_pmda_raw", "table2", mock_conn),
            call("ddb_demos_aws", "ddb_demos_localstack", "legacy_pmda_raw", "legacy_pmda_raw", "table3", mock_conn),
        ]
