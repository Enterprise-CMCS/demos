"""A module containing tests for the load_data_to_demos_app.py file."""

import pytest
from textwrap import dedent
from unittest.mock import MagicMock, call

import load_data_to_demos_app
from load_data_to_demos_app_types import (
    ArbitraryActionConfiguration,
    ArbitrarySqlGenerationContext,
    ArbitrarySqlGenerator,
    DataLoadConfiguration,
    GeneratedArbitraryActionSql,
    GeneratedInsertActionSql,
    GeneratedTransactionActionSql,
    GeneratedTriggerActionSql,
    TableInsertActionConfiguration,
    TransactionActionConfiguration,
    TriggerActionConfiguration,
)


class TestLoadStagedDataToDemosApp:
    """A class for the tests for the load_data_to_demos_app.py file."""

    mock_attach_name = "my-duckdb-attach-name"

    @pytest.fixture
    def mock_attach_name_getter(self, mocker):
        """Patch get_attach_name_from_db_config_name to return a constant value."""
        mock_getter = mocker.patch("load_data_to_demos_app.get_attach_name_from_db_config_name")
        mock_getter.return_value = self.mock_attach_name
        return mock_getter

    def test__generate_table_insert_sql(self, mock_attach_name_getter):
        """Test load_data_to_demos_app.py functions.

        ::_generate_table_insert_sql

        ::It should generate an insert SQL statement from a configuration.
        """
        test_input = TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"])

        actual_query = load_data_to_demos_app._generate_table_insert_sql(
            "from_here", "to_there", "demos-aws", test_input
        )
        expected_query = f"""
            INSERT INTO
                {self.mock_attach_name}.to_there.target_table
                (col1, col2)
            SELECT
                col1, col2
            FROM
                {self.mock_attach_name}.from_here.source_tbl;
        """
        mock_attach_name_getter.assert_called_once_with("demos-aws")
        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test__generate_trigger_action_sql_01(self, mock_attach_name_getter):
        """Test load_data_to_demos_app.py functions.

        ::_generate_trigger_action_sql

        ::It should generate an disable trigger SQL statement from a configuration.
        """
        test_input = TriggerActionConfiguration("disable", "myschema", "mytable", "_my_cool_trigger")

        actual_query = load_data_to_demos_app._generate_trigger_action_sql("demos-localstack", test_input)
        expected_query = (
            f"CALL postgres_execute('{self.mock_attach_name}', "
            f"'ALTER TABLE myschema.mytable "
            "DISABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)
        mock_attach_name_getter.assert_called_once_with("demos-localstack")

    def test__generate_trigger_action_sql_02(self, mock_attach_name_getter):
        """Test load_data_to_demos_app.py functions.

        ::_generate_trigger_action_sql

        ::It should generate an enable triggerSQL statement from a configuration.
        """
        test_input = TriggerActionConfiguration("enable", "myschema", "mytable", "_my_cool_trigger")

        actual_query = load_data_to_demos_app._generate_trigger_action_sql("demos-aws", test_input)
        expected_query = (
            f"CALL postgres_execute('{self.mock_attach_name}', "
            f"'ALTER TABLE myschema.mytable "
            "ENABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)
        mock_attach_name_getter.assert_called_once_with("demos-aws")

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

    def test__generate_arbitrary_action_sql(self, mocker, mock_attach_name_getter):
        """Test load_data_to_demos_app.py functions.

        ::_generate_arbitrary_action_sql

        ::It should create an object for an arbitrary action.
        """
        mocked_env = {"APP_SCHEMA": "my_app_schema"}
        mocker.patch.dict("os.environ", mocked_env)
        mock_arbitrary_generator = MagicMock(ArbitrarySqlGenerator)
        mock_arbitrary_generator.return_value = "SELECT * FROM file_table;"

        # Note that here we override the fixture to give a valid value
        # This avoids type complaints when creating the context below
        mock_attach_name_getter.return_value = "ddb_demos_aws"
        test_input = ArbitraryActionConfiguration("some action name", mock_arbitrary_generator)

        result = load_data_to_demos_app._generate_arbitrary_action_sql("demos-aws", test_input)

        expected_output = GeneratedArbitraryActionSql(test_input, "SELECT * FROM file_table;")
        assert result == expected_output
        mock_arbitrary_generator.assert_called_once_with(
            ArbitrarySqlGenerationContext("ddb_demos_aws", mocked_env["APP_SCHEMA"])
        )

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
                TriggerActionConfiguration("disable", "myschema", "source_tbl", "some_cool_trigger"),
                TriggerActionConfiguration("disable", "myschema", "a_diff_source", "less_cool_trigger"),
                TriggerActionConfiguration("enable", "myschema", "source_tbl", "some_cool_trigger"),
                ArbitraryActionConfiguration("a thing", MagicMock(ArbitrarySqlGenerator)),
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

        load_data_to_demos_app._generate_data_load_sql("demos-aws", test_input)

        assert mock_insert_generator.call_args_list == [
            call(test_input.source_schema, test_input.target_schema, "demos-aws", test_input.data_load_actions[1]),
        ]
        assert mock_trigger_generator.call_args_list == [
            call("demos-aws", test_input.data_load_actions[2]),
            call("demos-aws", test_input.data_load_actions[3]),
            call("demos-aws", test_input.data_load_actions[4]),
            call("demos-aws", TriggerActionConfiguration("enable", "myschema", "a_diff_source", "less_cool_trigger")),
        ]
        assert mock_transaction_generator.call_args_list == [
            call(test_input.data_load_actions[0]),
            call(test_input.data_load_actions[6]),
        ]
        assert mock_arbitrary_generator.call_args_list == [call("demos-aws", test_input.data_load_actions[5])]
        assert caplog.messages[0] == "Note! Current configuration leaves some triggers disabled! Enabling them"

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
            TriggerActionConfiguration("enable", "source_schema", "source_tbl", "some_cool_trigger"), "A query!"
        )

        actual_message = load_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing SQL to enable trigger source_schema.source_tbl.some_cool_trigger"

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
            ArbitraryActionConfiguration("the action", MagicMock(ArbitrarySqlGenerator)), "SELECT * FROM your_files"
        )

        actual_message = load_data_to_demos_app._create_log_execution_message_for_sql(test_input)
        expected_message = "Executing arbitrary SQL statement: the action"

        assert actual_message == expected_message
