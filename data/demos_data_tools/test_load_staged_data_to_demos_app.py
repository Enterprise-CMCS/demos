"""A module containing tests for the load_staged_data_to_demos_app.py file."""

from textwrap import dedent
from unittest.mock import call

import pytest

import load_staged_data_to_demos_app
from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME
from load_staged_data_to_demos_app import (
    GeneratedInsertActionSql,
    GeneratedTriggerActionSql,
    TableInsertActionConfiguration,
    TriggerActionConfiguration,
)


class TestLoadStagedDataToDemosApp:
    """A class for the tests for the load_staged_data_to_demos_app.py file."""

    test_env_vars = {
        "STAGING_SCHEMA": "test_staging",
        "APP_SCHEMA": "test_app_schema",
    }

    @pytest.fixture
    def mock_env(self, mocker):
        """Override the module-level environment variables."""
        mocker.patch.object(load_staged_data_to_demos_app, "STAGING_SCHEMA", self.test_env_vars["STAGING_SCHEMA"])
        mocker.patch.object(load_staged_data_to_demos_app, "APP_SCHEMA", self.test_env_vars["APP_SCHEMA"])

    def test__generate_table_insert_sql(self, mock_env):
        """Test load_staged_data_to_demos_app.py functions.

        ::_generate_table_insert_sql

        ::It should generate an insert SQL statement from a configuration.
        """
        test_input = TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"])

        actual_query = load_staged_data_to_demos_app._generate_table_insert_sql(test_input)
        expected_query = f"""
            INSERT INTO
                {DEMOS_DDB_ATTACH_NAME}.{self.test_env_vars["APP_SCHEMA"]}.target_table
                (col1, col2)
            SELECT
                col1, col2
            FROM
                {DEMOS_DDB_ATTACH_NAME}.{self.test_env_vars["STAGING_SCHEMA"]}.source_tbl;
        """
        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test__generate_trigger_action_sql_01(self, mock_env):
        """Test load_staged_data_to_demos_app.py functions.

        ::_generate_trigger_action_sql

        ::It should generate an disable triggerSQL statement from a configuration.
        """
        test_input = TriggerActionConfiguration("disable", "mytable", "_my_cool_trigger")

        actual_query = load_staged_data_to_demos_app._generate_trigger_action_sql(test_input)
        expected_query = (
            f"CALL postgres_execute('{DEMOS_DDB_ATTACH_NAME}', "
            f"'ALTER TABLE {self.test_env_vars['APP_SCHEMA']}.mytable "
            "DISABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test__generate_trigger_action_sql_02(self, mock_env):
        """Test load_staged_data_to_demos_app.py functions.

        ::_generate_trigger_action_sql

        ::It should generate an enable triggerSQL statement from a configuration.
        """
        test_input = TriggerActionConfiguration("enable", "mytable", "_my_cool_trigger")

        actual_query = load_staged_data_to_demos_app._generate_trigger_action_sql(test_input)
        expected_query = (
            f"CALL postgres_execute('{DEMOS_DDB_ATTACH_NAME}', "
            f"'ALTER TABLE {self.test_env_vars['APP_SCHEMA']}.mytable "
            "ENABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test__create_log_execution_message_for_sql_01(self):
        """Test load_staged_data_to_demos_app.py functions.

        ::_create_log_execution_message_for_sql

        ::It should generate a log message for an insert.
        """
        test_input = GeneratedInsertActionSql(
            TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"]), "test_query!"
        )

        actual_message = load_staged_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing insert statement from source_tbl to target_table"

        assert actual_message == expected_message

    def test__create_log_execution_message_for_sql_02(self):
        """Test load_staged_data_to_demos_app.py functions.

        ::_create_log_execution_message_for_sql

        ::It should generate a log message for a trigger operation.
        """
        test_input = GeneratedTriggerActionSql(
            TriggerActionConfiguration("enable", "source_tbl", "some_cool_trigger"), "A query!"
        )

        actual_message = load_staged_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing SQL to enable trigger source_tbl.some_cool_trigger"

        assert actual_message == expected_message

    def test__generate_migration_sql(self, mocker, caplog):
        """Test load_staged_data_to_demos_app.py functions.

        ::_generate_migration_sql

        ::It should combine all requested queries and generate trigger enable statements if needed.
        """
        test_inputs = (
            TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"]),
            TriggerActionConfiguration("disable", "source_tbl", "some_cool_trigger"),
            TriggerActionConfiguration("disable", "a_diff_source", "less_cool_trigger"),
            TriggerActionConfiguration("enable", "source_tbl", "some_cool_trigger"),
        )

        mock_insert_generator = mocker.patch(
            "load_staged_data_to_demos_app._generate_table_insert_sql", return_value="just an insert string"
        )
        mock_trigger_generator = mocker.patch(
            "load_staged_data_to_demos_app._generate_trigger_action_sql", return_value="just a trigger string"
        )

        load_staged_data_to_demos_app._generate_migration_sql(test_inputs)

        assert mock_insert_generator.call_args_list == [
            call(test_inputs[0]),
        ]
        assert mock_trigger_generator.call_args_list == [
            call(test_inputs[1]),
            call(test_inputs[2]),
            call(test_inputs[3]),
            call(TriggerActionConfiguration("enable", "a_diff_source", "less_cool_trigger")),
        ]
        assert caplog.messages[0] == "Note! Current configuration leaves some triggers disabled! Enabling them"
