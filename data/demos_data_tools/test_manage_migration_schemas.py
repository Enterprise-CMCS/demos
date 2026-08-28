"""A module containing tests for the manage_migration_schemas.py file."""

from argparse import Namespace
from textwrap import dedent
from typing import cast, get_args
from unittest.mock import MagicMock, call

import pytest

import manage_migration_schemas
from types_constants import DEMOS_READ_ROLE, MigrationSchemaAction


class TestManageMigrationSchemas:
    """A class for the tests for the manage_migration_schemas.py file."""

    @pytest.fixture
    def mock_conn(self, mocker):
        """Set up a mock connection for use in testing."""
        mock_conn = mocker.MagicMock()
        return mock_conn

    def test__get_schema_name_from_short_name(self):
        """Test manage_migration_schemas.py functions.

        ::_get_schema_name_from_short_name

        ::It should correctly map the short name to the schema name.
        """
        result1 = manage_migration_schemas._get_schema_name_from_short_name("raw")
        result2 = manage_migration_schemas._get_schema_name_from_short_name("staged")
        result3 = manage_migration_schemas._get_schema_name_from_short_name("rev01")

        with pytest.raises(AssertionError) as except_info:
            manage_migration_schemas._get_schema_name_from_short_name(
                cast(manage_migration_schemas.MigrationSchemaShortName, "not_a_name")
            )

        assert result1 == "legacy_pmda_raw"
        assert result2 == "legacy_pmda_staged"
        assert result3 == "legacy_pmda_migration_rev_01"
        assert except_info.value.args[0] == "Expected code to be unreachable, but got: 'not_a_name'"

    def test__parse_args(self, mocker):
        """Test manage_migration_schemas.py functions.

        ::_parse_args

        ::It should parse the args and return arguments.
        """
        mock_parser = MagicMock()
        mock_parser.parse_args.return_value = Namespace(
            db_config_name="the_config", schema_action="the_action", schema_name="the_name"
        )
        mock_parser_instance = mocker.patch(
            "manage_migration_schemas.argparse.ArgumentParser", return_value=mock_parser
        )
        mocker.patch("manage_migration_schemas._get_schema_name_from_short_name", return_value="A longer name")
        mock_cmd_line_args = mocker.patch("manage_migration_schemas.CommandLineArguments")

        manage_migration_schemas._parse_args()
        mock_parser_instance.assert_called_once()
        assert mock_parser_instance.call_args.kwargs["description"] == "Manage migration schemas for development use"
        assert callable(mock_parser_instance.call_args.kwargs["formatter_class"])
        assert mock_parser.add_argument.call_args_list == [
            call(
                "db_config_name",
                choices=manage_migration_schemas.DB_CONFIG_NAMES,
                help="The name of the DB config to use",
            ),
            call(
                "schema_action", choices=manage_migration_schemas.MIGRATION_SCHEMA_ACTIONS, help="The action to perform"
            ),
            call(
                "schema_name",
                choices=get_args(manage_migration_schemas.MigrationSchemaShortName.__value__),
                help="The short name of the schema to manage",
            ),
        ]
        mock_parser.parse_args.assert_called_once_with()
        mock_cmd_line_args.assert_called_once_with(
            db_config_name="the_config", schema_action="the_action", schema_name="A longer name"
        )

    def test__grant_permissions(self, mock_conn):
        """Test manage_migration_schemas.py functions.

        ::_grant_permissions

        ::It should generate and execute the permissions queries.
        """
        manage_migration_schemas._grant_permissions(mock_conn, "ddb_demos_localstack", "legacy_pmda_raw")
        assert mock_conn.execute.call_args_list == [
            call(
                "CALL postgres_execute(?, ?);",
                ["ddb_demos_localstack", f"GRANT USAGE ON SCHEMA legacy_pmda_raw TO {DEMOS_READ_ROLE};"],
            ),
            call(
                "CALL postgres_execute(?, ?);",
                ["ddb_demos_localstack", f"GRANT SELECT ON ALL TABLES IN SCHEMA legacy_pmda_raw TO {DEMOS_READ_ROLE};"],
            ),
            call(
                "CALL postgres_execute(?, ?);",
                [
                    "ddb_demos_localstack",
                    f"ALTER DEFAULT PRIVILEGES IN SCHEMA legacy_pmda_raw GRANT SELECT ON TABLES TO {DEMOS_READ_ROLE};",
                ],
            ),
        ]

    def test__create_schema(self, mock_conn):
        """Test manage_migration_schemas.py functions.

        ::_create_schema

        ::It should generate and execute the create queries.
        """
        manage_migration_schemas._create_schema(mock_conn, "ddb_demos_localstack", "legacy_pmda_raw")
        expected_query = """
            CREATE SCHEMA ddb_demos_localstack.legacy_pmda_raw;
        """
        assert dedent(expected_query) == dedent(mock_conn.execute.call_args_list[0].args[0])

    def test__drop_schema(self, mock_conn):
        """Test manage_migration_schemas.py functions.

        ::_drop_schema

        ::It should generate and execute the drop queries.
        """
        manage_migration_schemas._drop_schema(mock_conn, "ddb_demos_localstack", "legacy_pmda_raw")
        expected_query = """
            DROP SCHEMA IF EXISTS ddb_demos_localstack.legacy_pmda_raw CASCADE;
        """
        assert dedent(expected_query) == dedent(mock_conn.execute.call_args_list[0].args[0])

    def test_main_01(self, mocker, mock_conn):
        """Test manage_migration_schemas.py functions.

        ::main

        ::It should create the schema and grant permissions when given those arguments.
        """
        mock_create_db_conn = mocker.patch(
            "manage_migration_schemas.create_duckdb_conn", return_value="This is a connection"
        )
        mock_attach_db = mocker.patch("manage_migration_schemas.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock_attach_name_getter = mocker.patch(
            "manage_migration_schemas.get_attach_name_from_db_config_name", return_value="not_a_real_attach_name"
        )
        mock_create_schema = mocker.patch("manage_migration_schemas._create_schema")
        mock_grant_perms = mocker.patch("manage_migration_schemas._grant_permissions")
        mock_drop_schema = mocker.patch("manage_migration_schemas._drop_schema")
        test_args = manage_migration_schemas.CommandLineArguments("demos-localstack", "create", "legacy_pmda_staged")

        manage_migration_schemas.main(test_args)

        mock_create_db_conn.assert_called_once_with()
        mock_attach_db.assert_called_once_with("This is a connection", test_args.db_config_name)
        mock_attach_name_getter.assert_called_once_with(test_args.db_config_name)
        mock_create_schema.assert_called_once_with(mock_conn, "not_a_real_attach_name", test_args.schema_name)
        mock_grant_perms.assert_called_once_with(mock_conn, "not_a_real_attach_name", test_args.schema_name)
        mock_drop_schema.assert_not_called()

    def test_main_02(self, mocker, mock_conn):
        """Test manage_migration_schemas.py functions.

        ::main

        ::It should drop the schema when given those arguments.
        """
        mock_create_db_conn = mocker.patch(
            "manage_migration_schemas.create_duckdb_conn", return_value="This is a connection"
        )
        mock_attach_db = mocker.patch("manage_migration_schemas.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock_attach_name_getter = mocker.patch(
            "manage_migration_schemas.get_attach_name_from_db_config_name", return_value="not_a_real_attach_name"
        )
        mock_create_schema = mocker.patch("manage_migration_schemas._create_schema")
        mock_grant_perms = mocker.patch("manage_migration_schemas._grant_permissions")
        mock_drop_schema = mocker.patch("manage_migration_schemas._drop_schema")
        test_args = manage_migration_schemas.CommandLineArguments("demos-localstack", "drop", "legacy_pmda_staged")

        manage_migration_schemas.main(test_args)

        mock_create_db_conn.assert_called_once_with()
        mock_attach_db.assert_called_once_with("This is a connection", test_args.db_config_name)
        mock_attach_name_getter.assert_called_once_with(test_args.db_config_name)
        mock_create_schema.assert_not_called()
        mock_grant_perms.assert_not_called()
        mock_drop_schema.assert_called_once_with(mock_conn, "not_a_real_attach_name", test_args.schema_name)

    def test_main_03(self, mocker, mock_conn):
        """Test manage_migration_schemas.py functions.

        ::main

        ::It should throw if somehow given an invalid action type.
        """
        mock_create_db_conn = mocker.patch(
            "manage_migration_schemas.create_duckdb_conn", return_value="This is a connection"
        )
        mock_attach_db = mocker.patch("manage_migration_schemas.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock_attach_name_getter = mocker.patch(
            "manage_migration_schemas.get_attach_name_from_db_config_name", return_value="not_a_real_attach_name"
        )
        mock_create_schema = mocker.patch("manage_migration_schemas._create_schema")
        mock_grant_perms = mocker.patch("manage_migration_schemas._grant_permissions")
        mock_drop_schema = mocker.patch("manage_migration_schemas._drop_schema")
        test_invalid_action = cast(MigrationSchemaAction, "not_an_action")
        test_args = manage_migration_schemas.CommandLineArguments(
            "demos-localstack", test_invalid_action, "legacy_pmda_staged"
        )

        with pytest.raises(AssertionError) as except_info:
            manage_migration_schemas.main(test_args)

        assert except_info.value.args[0] == "Expected code to be unreachable, but got: 'not_an_action'"
        mock_create_db_conn.assert_called_once_with()
        mock_attach_db.assert_called_once_with("This is a connection", test_args.db_config_name)
        mock_attach_name_getter.assert_called_once_with(test_args.db_config_name)
        mock_create_schema.assert_not_called()
        mock_grant_perms.assert_not_called()
        mock_drop_schema.assert_not_called()
