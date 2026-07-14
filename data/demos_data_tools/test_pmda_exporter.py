"""A module containing tests for the pmda_exporter.py file."""

from pathlib import Path
from textwrap import dedent
from unittest.mock import call

import pytest

import pmda_exporter
from duckdb_connection_manager import DEMOS_DDB_ATTACH_NAME, PMDA_DDB_ATTACH_NAME


class TestPmdaExporter:
    """A class for the tests for the pmda_exporter.py file."""

    test_source_schema = "test_source_schema"
    test_target_schema = "test_target_schema"

    test_table_list = ["tbl1", "tbl2", "tbl4"]
    test_column_data = [
        [("tbl1", "Col1", 1, "int", "int"), "    col1 INTEGER"],
        [("tbl1", "Col2", 2, "int", "int unsigned"), "    col2 INTEGER"],
        [("tbl1", "Col3", 3, "char", "char(30)"), "    col3 CHAR(30)"],
        [("tbl1", "Col4", 4, "decimal", "decimal(15,2)"), "    col4 DECIMAL(15,2)"],
        [("tbl1", "Col5", 5, "date", "date"), "    col5 DATE"],
        [("tbl1", "Col6", 6, "datetime", "datetime"), "    col6 TIMESTAMP"],
        [("tbl1", "Col7", 7, "float", "float"), "    col7 REAL"],
        [("tbl1", "Col8", 8, "longtext", "longtext"), "    col8 TEXT"],
        [("tbl1", "Col9", 9, "mediumtext", "mediumtext"), "    col9 TEXT"],
        [("tbl1", "Col10", 10, "smallint", "smallint"), "    col10 SMALLINT"],
        [("tbl1", "Col11", 11, "smallint", "smallint unsigned"), "    col11 SMALLINT"],
        [("tbl1", "Col12", 12, "timestamp", "timestamp"), "    col12 TIMESTAMPTZ"],
        [("tbl1", "Col13", 13, "varchar", "varchar(2048)"), "    col13 VARCHAR(2048)"],
    ]

    @pytest.fixture
    def mock_conn(self, mocker):
        """Return a fresh mocked DuckDB connection."""
        return mocker.MagicMock()

    def test_get_pmda_table_list(self, mock_conn):
        """Test pmda_exporter.py functions.

        ::get_pmda_table_list

        ::It should query the schema table names.
        """
        pmda_exporter.get_pmda_table_list(mock_conn, self.test_source_schema)
        expected_query = """
            SELECT
                TABLE_NAME
            FROM
                information_schema.TABLES
            WHERE
                TABLE_CATALOG = $catalog
                AND TABLE_SCHEMA = $schema
        """
        actual_query = mock_conn.execute.call_args_list[0].args[0]
        actual_params = mock_conn.execute.call_args_list[0].args[1]
        assert dedent(actual_query) == dedent(expected_query)
        assert actual_params == {"catalog": PMDA_DDB_ATTACH_NAME, "schema": self.test_source_schema}

    def test_get_pmda_column_details_01(self, mock_conn):
        """Test pmda_exporter.py functions.

        ::get_pmda_column_details

        ::It should make a copy of the columns table locally.
        """
        pmda_exporter.get_pmda_column_details(mock_conn, self.test_table_list, self.test_source_schema)
        actual_call = mock_conn.execute.call_args_list[0].args[0]
        assert "CREATE TABLE mysql_columns AS" in actual_call

    def test_get_pmda_column_details_02(self, mock_conn):
        """Test pmda_exporter.py functions.

        ::get_pmda_column_details

        ::It should query the column table for every table requested.
        """
        pmda_exporter.get_pmda_column_details(mock_conn, self.test_table_list, self.test_source_schema)
        actual_calls = [
            mock_conn.execute.call_args_list[1].args[1],
            mock_conn.execute.call_args_list[2].args[1],
            mock_conn.execute.call_args_list[3].args[1],
        ]
        expected_calls = [
            {"schema": self.test_source_schema, "name": self.test_table_list[0]},
            {"schema": self.test_source_schema, "name": self.test_table_list[1]},
            {"schema": self.test_source_schema, "name": self.test_table_list[2]},
        ]
        assert actual_calls == expected_calls

    @pytest.mark.parametrize("col_tuple,expected_output", test_column_data, ids=[x[0][4] for x in test_column_data])
    def test_make_postgresql_column_definition(self, col_tuple, expected_output):
        """Test pmda_exporter.py functions.

        ::make_postgresql_column_definition

        ::It should convert column types from MySQL to PostgreSQL.
        """
        result = pmda_exporter.make_postgresql_column_definition(col_tuple)
        assert result == expected_output

    def test_sanitize_table_name(self):
        """Test pmda_exporter.py functions.

        ::sanitize_table_name

        ::If given a table name with dashes, it should quote it.
        """
        test_strings = ["regular_table", "escaped-table"]
        result = [pmda_exporter.sanitize_table_name(x) for x in test_strings]
        expected_result = ["regular_table", '"escaped-table"']
        assert result == expected_result

    def test_generate_demos_ddl_01(self, mocker):
        """Test pmda_exporter.py functions.

        ::generate_demos_ddl

        ::It should make a column definition for each argument.
        """
        spy_column_gen = mocker.spy(pmda_exporter, "make_postgresql_column_definition")
        input_col_data = [x[0] for x in self.test_column_data]
        pmda_exporter.generate_demos_ddl("tbl1", input_col_data, self.test_target_schema)
        expected_calls = [call(x) for x in input_col_data]
        assert spy_column_gen.call_args_list == expected_calls

    def test_generate_demos_ddl_02(self):
        """Test pmda_exporter.py functions.

        ::generate_demos_ddl

        ::It should return expected DDLs for the given inputs.
        """
        # Note that the little replace there at the end removes that empty first line, making dedent work correctly
        expected_duckdb_qry = f"""
            DROP TABLE IF EXISTS {DEMOS_DDB_ATTACH_NAME}.{self.test_target_schema}.tbl1;
            CREATE TABLE {DEMOS_DDB_ATTACH_NAME}.{self.test_target_schema}.tbl1 (
                col1 INTEGER,
                col2 INTEGER,
                col3 CHAR(30),
                col4 DECIMAL(15,2),
                col5 DATE,
                col6 TIMESTAMP,
                col7 REAL,
                col8 TEXT,
                col9 TEXT,
                col10 SMALLINT,
                col11 SMALLINT,
                col12 TIMESTAMPTZ,
                col13 VARCHAR(2048)
            );""".replace("\n", "", 1)
        expected_pg_qry = f"""
            CREATE TABLE {self.test_target_schema}.tbl1 (
                col1 INTEGER,
                col2 INTEGER,
                col3 CHAR(30),
                col4 DECIMAL(15,2),
                col5 DATE,
                col6 TIMESTAMP,
                col7 REAL,
                col8 TEXT,
                col9 TEXT,
                col10 SMALLINT,
                col11 SMALLINT,
                col12 TIMESTAMPTZ,
                col13 VARCHAR(2048)
            );""".replace("\n", "", 1)

        expected_duckdb_qry = dedent(expected_duckdb_qry)
        expected_pg_qry = dedent(expected_pg_qry)

        input_col_data = [x[0] for x in self.test_column_data]
        result = pmda_exporter.generate_demos_ddl("tbl1", input_col_data, self.test_target_schema)
        assert expected_duckdb_qry == dedent(result["duckdb"])
        assert expected_pg_qry == dedent(result["regular"])

    def test_transfer_table_01(self, mock_conn):
        """Test pmda_exporter.py functions.

        ::transfer_table

        ::It should properly execute transfer SQL.
        """
        pmda_exporter.transfer_table(mock_conn, "tbl21", "mysql", "postgres")
        expected_qry = """
            INSERT INTO
                ddb_demos.postgres.tbl21
            SELECT
                *
            FROM
                ddb_pmda.mysql.tbl21
        """
        expected_qry = expected_qry.replace("ddb_demos", DEMOS_DDB_ATTACH_NAME).replace(
            "ddb_pmda", PMDA_DDB_ATTACH_NAME
        )
        expected_qry = dedent(expected_qry)
        assert dedent(mock_conn.execute.call_args_list[0].args[0]) == expected_qry

    def test_transfer_table_02(self, mock_conn):
        """Test pmda_exporter.py functions.

        ::transfer_table

        ::It should properly escape unusual table names.
        """
        pmda_exporter.transfer_table(mock_conn, "tbl-22", "mysql", "postgres")
        expected_qry = """
            INSERT INTO
                ddb_demos.postgres."tbl-22"
            SELECT
                *
            FROM
                ddb_pmda.mysql."tbl-22"
        """
        expected_qry = expected_qry.replace("ddb_demos", DEMOS_DDB_ATTACH_NAME).replace(
            "ddb_pmda", PMDA_DDB_ATTACH_NAME
        )
        expected_qry = dedent(expected_qry)
        assert dedent(mock_conn.execute.call_args_list[0].args[0]) == expected_qry

    def test_save_ddl(self, mocker):
        """Test pmda_exporter.py functions.

        ::save_ddl

        ::It should open a file and save the DDL to it.
        """
        mocked_open = mocker.mock_open()
        mocker.patch("builtins.open", mocked_open)
        pmda_exporter.save_ddl("tbl1", "this is a test line")
        mocked_open.assert_called_once_with(Path(pmda_exporter.DDL_DIR, "tbl1.sql"), "w")
        mocked_open.return_value.write.assert_called_once_with("this is a test line\n")
