"""A module containing tests for the load_data_to_demos_app.py file."""

from textwrap import dedent
from typing import cast
from unittest.mock import MagicMock, call

import pytest

import load_data_to_demos_app
from types_constants import (
    APP_SCHEMA_NAME,
    AppSchemaName,
    ArbitraryActionConfiguration,
    ArbitrarySqlGenerationContext,
    ArbitrarySqlGenerator,
    DataLoadConfiguration,
    DuckDbAttachName,
    GeneratedArbitraryActionSql,
    GeneratedInsertActionSql,
    GeneratedTransactionActionSql,
    GeneratedTriggerActionSql,
    MigrationStagedSchemaName,
    TableInsertActionConfiguration,
    TransactionActionConfiguration,
    TriggerActionConfiguration,
)


class TestLoadDataToDemosApp:
    """A class for the tests for the load_data_to_demos_app.py file."""

    mock_attach_name = cast(DuckDbAttachName, "my-duckdb-attach-name")

    mock_data_load_config = DataLoadConfiguration(
        cast(MigrationStagedSchemaName, "my-source-schema"),
        cast(AppSchemaName, "my-app-schema"),
        tuple(
            [
                TransactionActionConfiguration("begin"),
                TableInsertActionConfiguration("table1", "table2", ["column1", "column2"]),
                TransactionActionConfiguration("commit"),
            ],
        ),
    )

    @pytest.fixture
    def mock_attach_name_getter(self, mocker):
        """Patch get_attach_name_from_db_config_name to return a constant value."""
        mock_getter = mocker.patch("load_data_to_demos_app.get_attach_name_from_db_config_name")
        mock_getter.return_value = self.mock_attach_name
        return mock_getter

    @pytest.fixture
    def mock_dl_config_getter(self, mocker):
        """Patch get_data_load_configuration to return a constant value."""
        mock_getter = mocker.patch("load_data_to_demos_app.get_data_load_configuration")
        mock_getter.return_value = self.mock_data_load_config
        return mock_getter

    def test_generate_table_insert_sql_01(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_table_insert_sql

        ::It should generate an insert SQL statement from a configuration.
        """
        test_input = TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"])

        actual_query = load_data_to_demos_app.generate_table_insert_sql(
            "legacy_pmda_staged", "demos_app", self.mock_attach_name, self.mock_attach_name, test_input
        )
        expected_query = f"""
            INSERT INTO
                {self.mock_attach_name}.demos_app.target_table
                (col1, col2)
            SELECT
                col1, col2
            FROM
                {self.mock_attach_name}.legacy_pmda_staged.source_tbl;
        """
        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test_generate_table_insert_sql_02(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_table_insert_sql

        ::It should raise a ValueError if given the same source and target.
        """
        test_input = TableInsertActionConfiguration("identical_table", "identical_table", ["col1", "col2"])

        with pytest.raises(ValueError) as except_info:
            load_data_to_demos_app.generate_table_insert_sql(
                "legacy_pmda_staged", "legacy_pmda_staged", self.mock_attach_name, self.mock_attach_name, test_input
            )

        assert (
            except_info.value.args[0] == "Cannot insert my-duckdb-attach-name.legacy_pmda_staged.identical_table into "
            "my-duckdb-attach-name.legacy_pmda_staged.identical_table; identical locations"
        )

    def test_generate_table_insert_sql_03(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_table_insert_sql

        ::It should raise a ValueError if given a cross-database insert where the target is not LocalStack.
        """
        test_input = TableInsertActionConfiguration("source_table", "target_table", ["col1", "col2"])

        with pytest.raises(ValueError) as except_info:
            load_data_to_demos_app.generate_table_insert_sql(
                source_schema="demos_app",
                target_schema="demos_app",
                source_attach_name="ddb_demos_localstack",
                target_attach_name="ddb_demos_aws",
                insert_config=test_input,
            )

        assert (
            except_info.value.args[0] == "Cannot insert across attached databases unless the target is Localstack; "
            "target given was ddb_demos_aws"
        )

    def test_generate_trigger_action_sql_01(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_trigger_action_sql

        ::It should generate an disable trigger SQL statement from a configuration.
        """
        test_input = TriggerActionConfiguration("disable", "myschema", "mytable", "_my_cool_trigger")

        actual_query = load_data_to_demos_app.generate_trigger_action_sql(self.mock_attach_name, test_input)
        expected_query = (
            f"CALL postgres_execute('{self.mock_attach_name}', "
            f"'ALTER TABLE myschema.mytable "
            "DISABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test_generate_trigger_action_sql_02(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_trigger_action_sql

        ::It should generate an enable triggerSQL statement from a configuration.
        """
        test_input = TriggerActionConfiguration("enable", "myschema", "mytable", "_my_cool_trigger")

        actual_query = load_data_to_demos_app.generate_trigger_action_sql(self.mock_attach_name, test_input)
        expected_query = (
            f"CALL postgres_execute('{self.mock_attach_name}', "
            f"'ALTER TABLE myschema.mytable "
            "ENABLE TRIGGER _my_cool_trigger;')"
        )

        assert dedent(actual_query.sql_query) == dedent(expected_query)

    def test_generate_transaction_action_sql_01(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_transaction_action_sql

        ::It should generate SQL to begin a transaction.
        """
        test_input = TransactionActionConfiguration("begin")

        result = load_data_to_demos_app.generate_transaction_action_sql(test_input)

        expected_output = GeneratedTransactionActionSql(test_input, "BEGIN;")
        assert result == expected_output

    def test_generate_transaction_action_sql_02(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_transaction_action_sql

        ::It should generate SQL to commit a transaction.
        """
        test_input = TransactionActionConfiguration("commit")

        result = load_data_to_demos_app.generate_transaction_action_sql(test_input)

        expected_output = GeneratedTransactionActionSql(test_input, "COMMIT;")
        assert result == expected_output

    def test_generate_arbitrary_action_sql(self):
        """Test load_data_to_demos_app.py functions.

        ::generate_arbitrary_action_sql

        ::It should create an object for an arbitrary action.
        """
        mock_arbitrary_generator = MagicMock(ArbitrarySqlGenerator)
        mock_arbitrary_generator.return_value = "SELECT * FROM file_table;"

        test_input = ArbitraryActionConfiguration("some action name", mock_arbitrary_generator)

        result = load_data_to_demos_app.generate_arbitrary_action_sql(self.mock_attach_name, test_input)

        expected_output = GeneratedArbitraryActionSql(test_input, "SELECT * FROM file_table;")
        assert result == expected_output
        mock_arbitrary_generator.assert_called_once_with(
            ArbitrarySqlGenerationContext(self.mock_attach_name, APP_SCHEMA_NAME)
        )

    def test__generate_data_load_sql(self, mocker, caplog):
        """Test load_data_to_demos_app.py functions.

        ::_generate_data_load_sql

        ::It should combine all requested queries and generate trigger enable statements if needed.
        """
        test_input = DataLoadConfiguration(
            cast(MigrationStagedSchemaName, "from_this_place"),
            cast(AppSchemaName, "to_that_place"),
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
            "load_data_to_demos_app.generate_table_insert_sql", return_value="just an insert string"
        )
        mock_trigger_generator = mocker.patch(
            "load_data_to_demos_app.generate_trigger_action_sql", return_value="just a trigger string"
        )
        mock_transaction_generator = mocker.patch(
            "load_data_to_demos_app.generate_transaction_action_sql", return_value="just a transaction string"
        )
        mock_arbitrary_generator = mocker.patch(
            "load_data_to_demos_app.generate_arbitrary_action_sql", return_value="just an arbitrary string"
        )

        load_data_to_demos_app._generate_data_load_sql(self.mock_attach_name, test_input)

        assert mock_insert_generator.call_args_list == [
            call(
                test_input.source_schema,
                test_input.target_schema,
                self.mock_attach_name,
                self.mock_attach_name,
                test_input.data_load_actions[1],
            ),
        ]
        assert mock_trigger_generator.call_args_list == [
            call(self.mock_attach_name, test_input.data_load_actions[2]),
            call(self.mock_attach_name, test_input.data_load_actions[3]),
            call(self.mock_attach_name, test_input.data_load_actions[4]),
            call(
                self.mock_attach_name,
                TriggerActionConfiguration("enable", "myschema", "a_diff_source", "less_cool_trigger"),
            ),
        ]
        assert mock_transaction_generator.call_args_list == [
            call(test_input.data_load_actions[0]),
            call(test_input.data_load_actions[6]),
        ]
        assert mock_arbitrary_generator.call_args_list == [call(self.mock_attach_name, test_input.data_load_actions[5])]
        assert caplog.messages[0] == "Note! Current configuration leaves some triggers disabled! Enabling them"

    def test_create_log_execution_message_for_sql_01(self):
        """Test load_data_to_demos_app.py functions.

        ::create_log_execution_message_for_sql

        ::It should generate a log message for an insert.
        """
        test_input = GeneratedInsertActionSql(
            TableInsertActionConfiguration("source_tbl", "target_table", ["col1", "col2"]), "test_query!"
        )

        actual_message = load_data_to_demos_app.create_log_execution_message_for_sql(test_input)
        expected_message = "Executing insert statement from source_tbl to target_table"

        assert actual_message == expected_message

    def test_create_log_execution_message_for_sql_02(self):
        """Test load_data_to_demos_app.py functions.

        ::create_log_execution_message_for_sql

        ::It should generate a log message for a trigger operation.
        """
        test_input = GeneratedTriggerActionSql(
            TriggerActionConfiguration("enable", "source_schema", "source_tbl", "some_cool_trigger"), "A query!"
        )

        actual_message = load_data_to_demos_app.create_log_execution_message_for_sql(test_input)
        expected_message = "Executing SQL to enable trigger source_schema.source_tbl.some_cool_trigger"

        assert actual_message == expected_message

    def test_create_log_execution_message_for_sql_03(self):
        """Test load_data_to_demos_app.py functions.

        ::create_log_execution_message_for_sql

        ::It should generate a log message for a transaction operation.
        """
        test_input = GeneratedTransactionActionSql(TransactionActionConfiguration("begin"), "BEGIN!")

        actual_message = load_data_to_demos_app.create_log_execution_message_for_sql(test_input)
        expected_message = "Executing begin transaction statement"

        assert actual_message == expected_message

    def test_create_log_execution_message_for_sql_04(self):
        """Test load_data_to_demos_app.py functions.

        ::create_log_execution_message_for_sql

        ::It should generate a log message for an arbitrary operation.
        """
        test_input = GeneratedArbitraryActionSql(
            ArbitraryActionConfiguration("the action", MagicMock(ArbitrarySqlGenerator)), "SELECT * FROM your_files"
        )

        actual_message = load_data_to_demos_app.create_log_execution_message_for_sql(test_input)
        expected_message = "Executing arbitrary SQL statement: the action"

        assert actual_message == expected_message

    def test_main_01(self, mocker, mock_attach_name_getter, mock_dl_config_getter):
        """Test load_data_to_demos_app.py functions.

        ::main

        ::It should invoke the expected functions when run.
        """
        mock_conn = MagicMock()
        mock_generated_sql = [
            GeneratedInsertActionSql(cast(TableInsertActionConfiguration, "config_one"), "one"),
            GeneratedInsertActionSql(cast(TableInsertActionConfiguration, "config_two"), "two"),
            GeneratedInsertActionSql(cast(TableInsertActionConfiguration, "config_three"), "three"),
        ]
        mock_sql_generator = mocker.patch(
            "load_data_to_demos_app._generate_data_load_sql",
            return_value=mock_generated_sql,
        )
        mock_conn_creator = mocker.patch(
            "load_data_to_demos_app.create_duckdb_conn", return_value="This is a connection!"
        )
        mock_db_attacher = mocker.patch("load_data_to_demos_app.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock_log_creator = mocker.patch("load_data_to_demos_app.create_log_execution_message_for_sql")

        test_input = load_data_to_demos_app.CommandLineArguments("demos-aws", "rev01", False)
        load_data_to_demos_app.main(test_input)

        mock_dl_config_getter.assert_called_once_with(test_input.dl_config_name)
        mock_attach_name_getter.assert_called_once_with(test_input.db_config_name)
        mock_sql_generator.assert_called_once_with(self.mock_attach_name, self.mock_data_load_config)
        mock_conn_creator.assert_called_once_with()
        mock_db_attacher.assert_called_once_with("This is a connection!", test_input.db_config_name)
        assert mock_log_creator.call_args_list == [call(generated_sql) for generated_sql in mock_generated_sql]
        assert mock_conn.execute.call_args_list == [
            call(generated_sql.sql_query) for generated_sql in mock_generated_sql
        ]

    def test_main_02(self, mocker, mock_attach_name_getter, mock_dl_config_getter, caplog):
        """Test load_data_to_demos_app.py functions.

        ::main

        ::It should not run SQL when in dry run mode.
        """
        mock_conn = MagicMock()
        mock_generated_sql = [
            GeneratedInsertActionSql(cast(TableInsertActionConfiguration, "config_one"), "one"),
            GeneratedInsertActionSql(cast(TableInsertActionConfiguration, "config_two"), "two"),
            GeneratedInsertActionSql(cast(TableInsertActionConfiguration, "config_three"), "three"),
        ]
        mock_sql_generator = mocker.patch(
            "load_data_to_demos_app._generate_data_load_sql",
            return_value=mock_generated_sql,
        )
        mock_conn_creator = mocker.patch(
            "load_data_to_demos_app.create_duckdb_conn", return_value="This is a connection!"
        )
        mock_db_attacher = mocker.patch("load_data_to_demos_app.attach_db_to_duckdb_conn", return_value=mock_conn)
        mock_log_creator = mocker.patch("load_data_to_demos_app.create_log_execution_message_for_sql")

        test_input = load_data_to_demos_app.CommandLineArguments("demos-aws", "rev01", True)
        load_data_to_demos_app.main(test_input)

        mock_dl_config_getter.assert_called_once_with(test_input.dl_config_name)
        mock_attach_name_getter.assert_called_once_with(test_input.db_config_name)
        mock_sql_generator.assert_called_once_with(self.mock_attach_name, self.mock_data_load_config)
        mock_conn_creator.assert_not_called()
        mock_db_attacher.assert_not_called()
        mock_log_creator.assert_not_called()
        mock_conn.execute.assert_not_called()
        assert "one" in caplog.messages
        assert "two" in caplog.messages
        assert "three" in caplog.messages
