"""A module containing tests for the duckdb_utilities.py file."""

from textwrap import dedent

import pytest

import duckdb_utilities
from types_constants import SchemaTableList


class TestDuckDbUtilities:
    """A class for the tests for the duckdb_utilities.py file."""

    @pytest.fixture
    def mock_conn(self, mocker):
        """Set up a mock connection for use in testing."""
        mock_conn = mocker.MagicMock()
        return mock_conn

    def test_get_table_list_for_schema(self, mock_conn):
        """Test duckdb_utilities.py functions.

        ::get_table_list_for_schema

        ::It should query the table list from the database.
        """
        mock_results = [("table1",), ("table2",), ("table3",)]
        mock_conn.execute.return_value.fetchall.return_value = mock_results
        expected_query = """
            SELECT
                table_name
            FROM
                ddb_demos_localstack.information_schema.tables
            WHERE
                table_schema = $schema_name;
        """
        expected_params = {"schema_name": "legacy_pmda_raw"}

        result = duckdb_utilities.get_table_list_for_schema("ddb_demos_localstack", "legacy_pmda_raw", mock_conn)

        assert result == SchemaTableList("legacy_pmda_raw", ["table1", "table2", "table3"])
        actual_query = mock_conn.execute.call_args[0][0]
        actual_params = mock_conn.execute.call_args[0][1]
        assert dedent(actual_query) == dedent(expected_query)
        assert actual_params == expected_params

    def test_select_table_from_source_to_target_01(self, mock_conn):
        """Test duckdb_utilities.py functions.

        ::select_table_from_source_to_target

        ::It should query from source to target.
        """
        expected_query = """
            CREATE TABLE ddb_demos_localstack.legacy_pmda_raw.some_table AS
            SELECT * FROM ddb_demos_aws.legacy_pmda_raw.some_table;
        """

        duckdb_utilities.select_table_from_source_to_target(
            source_attach_name="ddb_demos_aws",
            target_attach_name="ddb_demos_localstack",
            source_schema_name="legacy_pmda_raw",
            target_schema_name="legacy_pmda_raw",
            table_name="some_table",
            conn=mock_conn,
        )

        actual_query = mock_conn.execute.call_args[0][0]
        assert dedent(actual_query) == dedent(expected_query)

    def test_select_table_from_source_to_target_02(self, mock_conn):
        """Test duckdb_utilities.py functions.

        ::select_table_from_source_to_target

        ::It should refuse to copy to the source location.
        """
        expected_err_msg = (
            "Cannot copy ddb_demos_localstack.legacy_pmda_raw.some_table to "
            "ddb_demos_localstack.legacy_pmda_raw.some_table; identical locations"
        )

        with pytest.raises(ValueError) as except_info:
            duckdb_utilities.select_table_from_source_to_target(
                source_attach_name="ddb_demos_localstack",
                target_attach_name="ddb_demos_localstack",
                source_schema_name="legacy_pmda_raw",
                target_schema_name="legacy_pmda_raw",
                table_name="some_table",
                conn=mock_conn,
            )

        assert except_info.value.args[0] == expected_err_msg
