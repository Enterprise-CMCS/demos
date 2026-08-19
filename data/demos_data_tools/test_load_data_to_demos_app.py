"""A module containing tests for the load_data_to_demos_app.py file."""

from textwrap import dedent
from unittest.mock import call

import pytest

import load_data_to_demos_app
from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME
from load_data_to_demos_app import (
    GeneratedInsertActionSql,
    GeneratedTriggerActionSql,
    TableInsertActionConfiguration,
    TriggerActionConfiguration,
)
from load_data_to_demos_app_types import (
    ArbitraryActionConfiguration,
    DataLoadConfiguration,
    GeneratedArbitraryActionSql,
    GeneratedTransactionActionSql,
    TransactionActionConfiguration,
)


class TestLoadStagedDataToDemosApp:
    """A class for the tests for the load_data_to_demos_app.py file."""

    def test__generate_table_insert_sql(self):
        """Test load_data_to_demos_app.py functions.

        ::_generate_table_insert_sql

        ::It should generate an insert SQL statement from a configuration.
        """
        test_input = TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"])

        actual_query = load_data_to_demos_app._generate_table_insert_sql("from_here", "to_there", test_input)
        expected_query = f"""
            INSERT INTO
                {DEMOS_DDB_ATTACH_NAME}.to_there.target_table
                (col1, col2)
            SELECT
                col1, col2
            FROM
                {DEMOS_DDB_ATTACH_NAME}.from_here.source_tbl;
        """
        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test__generate_trigger_action_sql_01(self, mocker):
        """Test load_data_to_demos_app.py functions.

        ::_generate_trigger_action_sql

        ::It should generate an disable triggerSQL statement from a configuration.
        """
        mocked_env = {"APP_SCHEMA": "my_app_schema"}
        mocker.patch.dict("os.environ", mocked_env)
        test_input = TriggerActionConfiguration("disable", "mytable", "_my_cool_trigger")

        actual_query = load_data_to_demos_app._generate_trigger_action_sql(test_input)
        expected_query = (
            f"CALL postgres_execute('{DEMOS_DDB_ATTACH_NAME}', "
            f"'ALTER TABLE my_app_schema.mytable "
            "DISABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test__generate_trigger_action_sql_02(self, mocker):
        """Test load_data_to_demos_app.py functions.

        ::_generate_trigger_action_sql

        ::It should generate an enable triggerSQL statement from a configuration.
        """
        mocked_env = {"APP_SCHEMA": "my_app_schema"}
        mocker.patch.dict("os.environ", mocked_env)
        test_input = TriggerActionConfiguration("enable", "mytable", "_my_cool_trigger")

        actual_query = load_data_to_demos_app._generate_trigger_action_sql(test_input)
        expected_query = (
            f"CALL postgres_execute('{DEMOS_DDB_ATTACH_NAME}', "
            f"'ALTER TABLE my_app_schema.mytable "
            "ENABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test__create_log_execution_message_for_sql_01(self):
        """Test load_data_to_demos_app.py functions.

        ::_create_log_execution_message_for_sql

        ::It should generate a log message for an insert.
        """
        test_input = GeneratedInsertActionSql(
            TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"]), "test_query!"
        )

        actual_message = load_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing insert statement from source_tbl to target_table"

        assert actual_message == expected_message

    def test__create_log_execution_message_for_sql_02(self):
        """Test load_data_to_demos_app.py functions.

        ::_create_log_execution_message_for_sql

        ::It should generate a log message for a trigger operation.
        """
        test_input = GeneratedTriggerActionSql(
            TriggerActionConfiguration("enable", "source_tbl", "some_cool_trigger"), "A query!"
        )

        actual_message = load_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing SQL to enable trigger source_tbl.some_cool_trigger"

        assert actual_message == expected_message

    def test__create_log_execution_message_for_sql_03(self):
        """Test load_data_to_demos_app.py functions.

        ::_create_log_execution_message_for_sql

        ::It should generate a log message for a transaction operation.
        """
        test_input = GeneratedTransactionActionSql(TransactionActionConfiguration("begin"), "BEGIN!")

        actual_message = load_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing begin transaction statement"

        assert actual_message == expected_message

    def test__create_log_execution_message_for_sql_04(self):
        """Test load_data_to_demos_app.py functions.

        ::_create_log_execution_message_for_sql

        ::It should generate a log message for an arbitrary operation.
        """
        test_input = GeneratedArbitraryActionSql(
            ArbitraryActionConfiguration("the action", "SELECT * FROM your_files"), "SELECT * FROM your_files"
        )

        actual_message = load_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing arbitrary SQL statement: the action"

        assert actual_message == expected_message

    def test__generate_data_load_sql(self, mocker, caplog):
        """Test load_data_to_demos_app.py functions.

        ::_generate_data_load_sql

        ::It should combine all requested queries and generate trigger enable statements if needed.
        """
        test_input = DataLoadConfiguration(
            "from_this_place",
            "to_that_place",
            (
                TransactionActionConfiguration("begin"),
                TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"]),
                TriggerActionConfiguration("disable", "source_tbl", "some_cool_trigger"),
                TriggerActionConfiguration("disable", "a_diff_source", "less_cool_trigger"),
                TriggerActionConfiguration("enable", "source_tbl", "some_cool_trigger"),
                ArbitraryActionConfiguration("a thing", "SELECT * FROM file_list_a;"),
                TransactionActionConfiguration("commit"),
            ),
        )

        mock_insert_generator = mocker.patch(
            "load_data_to_demos_app._generate_table_insert_sql", return_value="just an insert string"
        )
        mock_trigger_generator = mocker.patch(
            "load_data_to_demos_app._generate_trigger_action_sql", return_value="just a trigger string"
        )
        mock_transaction_generator = mocker.patch(
            "load_data_to_demos_app._generate_transaction_action_sql", return_value="just a transaction string"
        )
        mock_arbitrary_generator = mocker.patch(
            "load_data_to_demos_app._generate_arbitrary_action_sql", return_value="just an arbitrary string"
        )

        load_data_to_demos_app._generate_data_load_sql(test_input)

        assert mock_insert_generator.call_args_list == [
            call(test_input.source_schema, test_input.target_schema, test_input.data_load_actions[1]),
        ]
        assert mock_trigger_generator.call_args_list == [
            call(test_input.data_load_actions[2]),
            call(test_input.data_load_actions[3]),
            call(test_input.data_load_actions[4]),
            call(TriggerActionConfiguration("enable", "a_diff_source", "less_cool_trigger")),
        ]
        assert mock_transaction_generator.call_args_list == [
            call(test_input.data_load_actions[0]),
            call(test_input.data_load_actions[6]),
        ]
        assert mock_arbitrary_generator.call_args_list == [call(test_input.data_load_actions[5])]
        assert caplog.messages[0] == "Note! Current configuration leaves some triggers disabled! Enabling them"

    def test__generate_transaction_action_sql_01(self):
        """Test load_data_to_demos_app.py functions.

        ::_generate_transaction_action_sql

        ::It should generate SQL to begin a transaction.
        """
        test_input = TransactionActionConfiguration("begin")

        result = load_data_to_demos_app._generate_transaction_action_sql(test_input)

        expected_output = GeneratedTransactionActionSql(test_input, "BEGIN;")
        assert result == expected_output

    def test__generate_transaction_action_sql_02(self):
        """Test load_data_to_demos_app.py functions.

        ::_generate_transaction_action_sql

        ::It should generate SQL to commit a transaction.
        """
        test_input = TransactionActionConfiguration("commit")

        result = load_data_to_demos_app._generate_transaction_action_sql(test_input)

        expected_output = GeneratedTransactionActionSql(test_input, "COMMIT;")
        assert result == expected_output

    def test__generate_arbitrary_action_sql(self):
        """Test load_data_to_demos_app.py functions.

        ::_generate_arbitrary_action_sql

        ::It should create an object for an arbitrary action.
        """
        test_input = ArbitraryActionConfiguration("some action name", "SELECT * FROM file_table;")

        result = load_data_to_demos_app._generate_arbitrary_action_sql(test_input)

        expected_output = GeneratedArbitraryActionSql(test_input, "SELECT * FROM file_table;")
        assert result == expected_output
