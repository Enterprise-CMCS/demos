"""A module containing tests for the duckdb_exporter.py file."""

from textwrap import dedent
from unittest.mock import call

import pytest

import research.duckdb_exporter.duckdb_exporter as duckdb_exporter


@pytest.fixture(scope="module")
def make_duckdb_conn(module_mocker):
    """Make a properly mocked connection at the module level so we can test it."""
    db_conn_config = {
        "dev-mysql": {
            "host": "testhost1",
            "port": "12345",
            "user": "fakeuser1",
            "password": "fakepasswd1",
            "database": "fakedb1",
        },
        "dev-postgresql": {
            "host": "testhost2",
            "port": "23456",
            "user": "fakeuser2",
            "password": "fakepasswd2",
            "database": "fakedb2",
        },
    }
    mocked_conn = module_mocker.patch("duckdb.connect")
    duckdb_exporter.create_duckdb_conn(db_conn_config)
    return mocked_conn


class TestDuckDBExporter():
    """A class for the tests for the duckdb_exporter.py file."""

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

    @pytest.fixture(scope="module")
    def run_column_details(self, make_duckdb_conn):
        """Run the get_column_details code only once."""
        mock_conn = make_duckdb_conn.return_value
        duckdb_exporter.get_column_details(mock_conn, self.test_table_list)

    def test_parse_config(self, mocker):
        """Test duckdb_exporter.py functions.

        ::parse_config

        ::It should invoke the config parser with the correct argument.
        """
        mock_parser = mocker.patch("configparser.ConfigParser")
        duckdb_exporter.parse_config()
        mock_parser.return_value.read.assert_called_once_with("dbinfo.ini")

    def test_create_duckdb_conn_01(self, make_duckdb_conn):
        """Test duckdb_exporter.py functions.

        ::create_duckdb_conn

        ::It should invoke an in-memory database.
        """
        make_duckdb_conn.assert_called_once_with(":memory:", config={"memory_limit": "8GB", "threads": 8})

    def test_create_duckdb_conn_02(self, make_duckdb_conn):
        """Test duckdb_exporter.py functions.

        ::create_duckdb_conn

        ::It should install the MySQL and PostgreSQL extensions.
        """
        mock_conn = make_duckdb_conn.return_value
        assert mock_conn.install_extension.call_args_list == [
            call("mysql"),
            call("postgres")
        ]
        assert mock_conn.load_extension.call_args_list == [
            call("mysql"),
            call("postgres")
        ]

    def test_create_duckdb_conn_03(self, make_duckdb_conn):
        """Test duckdb_exporter.py functions.

        ::create_duckdb_conn

        ::It should connect to PostgreSQL.
        """
        mock_conn = make_duckdb_conn.return_value
        assert mock_conn.execute.call_args_list[0] == call(f"ATTACH 'host=testhost2 port=23456 user=fakeuser2 password=fakepasswd2 dbname=fakedb2' AS {duckdb_exporter.DUCKDB_POSTGRES_DB_NAME} (TYPE postgres);")  # noqa: E501
        assert mock_conn.execute.call_args_list[1] == call("SET pg_null_byte_replacement=''")

    def test_create_duckdb_conn_04(self, make_duckdb_conn):
        """Test duckdb_exporter.py functions.

        ::create_duckdb_conn

        ::It should connect to MySQL.
        """
        mock_conn = make_duckdb_conn.return_value
        assert mock_conn.execute.call_args_list[2] == call(f"ATTACH 'host=testhost1 port=12345 user=fakeuser1 passwd=fakepasswd1 db=fakedb1' AS {duckdb_exporter.DUCKDB_MYSQL_DB_NAME} (TYPE mysql);")  # noqa: E501

    def test_get_table_list(self, make_duckdb_conn):
        """Test duckdb_exporter.py functions.

        ::get_table_list

        ::It should query the schema table names.
        """
        mock_conn = make_duckdb_conn.return_value
        duckdb_exporter.get_table_list(mock_conn)
        assert mock_conn.execute.call_args_list[3] == call(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = $schema",
            {"schema": duckdb_exporter.MYSQL_SCHEMA}
        )

    def test_get_column_details_01(self, make_duckdb_conn, run_column_details):
        """Test duckdb_exporter.py functions.

        ::get_column_details

        ::It should make a copy of the columns table locally.
        """
        mock_conn = make_duckdb_conn.return_value
        actual_call = mock_conn.execute.call_args_list[4].args[0]
        assert "CREATE TABLE mysql_columns AS" in actual_call

    def test_get_column_details_02(self, make_duckdb_conn, run_column_details):
        """Test duckdb_exporter.py functions.

        ::get_column_details

        ::It should query the column table for every table requested.
        """
        mock_conn = make_duckdb_conn.return_value
        actual_calls = [
            mock_conn.execute.call_args_list[5].args[1],
            mock_conn.execute.call_args_list[6].args[1],
            mock_conn.execute.call_args_list[7].args[1]
        ]
        expected_calls = [
            {"schema": duckdb_exporter.MYSQL_SCHEMA, "name": self.test_table_list[0]},
            {"schema": duckdb_exporter.MYSQL_SCHEMA, "name": self.test_table_list[1]},
            {"schema": duckdb_exporter.MYSQL_SCHEMA, "name": self.test_table_list[2]},
        ]
        assert actual_calls == expected_calls

    @pytest.mark.parametrize(
        "col_tuple,expected_output",
        test_column_data,
        ids=[x[0][4] for x in test_column_data]
    )
    def test_make_column_definition(self, col_tuple, expected_output):
        """Test duckdb_exporter.py functions.

        ::make_column_definition

        ::It should convert column types from MySQL to PostgreSQL.
        """
        result = duckdb_exporter.make_column_definition(col_tuple)
        assert result == expected_output

    def test_sanitize_table_name(self):
        """Test duckdb_exporter.py functions.

        ::sanitize_table_name

        ::If given a table name with dashes, it should quote it.
        """
        test_strings = ["regular_table", "escaped-table"]
        result = [duckdb_exporter.sanitize_table_name(x) for x in test_strings]
        expected_result = ["regular_table", '"escaped-table"']
        assert result == expected_result

    def test_generate_postgres_ddl_01(self, mocker):
        """Test duckdb_exporter.py functions.

        ::generate_postgres_ddl

        ::It should make a column definition for each argument.
        """
        spy_column_gen = mocker.spy(duckdb_exporter, "make_column_definition")
        input_col_data = [x[0] for x in self.test_column_data]
        duckdb_exporter.generate_postgres_ddl("tbl1", input_col_data)
        expected_calls = [call(x) for x in input_col_data]
        assert spy_column_gen.call_args_list == expected_calls

    def test_generate_postgres_ddl_02(self, mocker):
        """Test duckdb_exporter.py functions.

        ::generate_postgres_ddl

        ::It should return expected DDLs for the given inputs.
        """
        # Note that the little replace there at the end removes that empty first line, making dedent work correctly
        expected_duckdb_qry = f"""
            DROP TABLE IF EXISTS {duckdb_exporter.DUCKDB_POSTGRES_DB_NAME}.{duckdb_exporter.PG_SCHEMA}.tbl1;
            CREATE TABLE {duckdb_exporter.DUCKDB_POSTGRES_DB_NAME}.{duckdb_exporter.PG_SCHEMA}.tbl1 (
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
            CREATE TABLE {duckdb_exporter.PG_SCHEMA}.tbl1 (
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
        result = duckdb_exporter.generate_postgres_ddl("tbl1", input_col_data)
        assert expected_duckdb_qry == dedent(result["duckdb"])
        assert expected_pg_qry == dedent(result["regular"])

    def test_transfer_table_01(self, make_duckdb_conn):
        """Test duckdb_exporter.py functions.

        ::transfer_table

        ::It should properly execute transfer SQL.
        """
        mock_conn = make_duckdb_conn.return_value
        duckdb_exporter.transfer_table(mock_conn, "tbl21", "mysql", "postgres")
        expected_qry = f"""
            INSERT INTO
                {duckdb_exporter.DUCKDB_POSTGRES_DB_NAME}.postgres.tbl21
            SELECT
                *
            FROM
                {duckdb_exporter.DUCKDB_MYSQL_DB_NAME}.mysql.tbl21
        """
        expected_qry = dedent(expected_qry)
        assert dedent(mock_conn.execute.call_args_list[8].args[0]) == expected_qry

    def test_transfer_table_02(self, make_duckdb_conn):
        """Test duckdb_exporter.py functions.

        ::transfer_table

        ::It should properly escape unusual table names.
        """
        mock_conn = make_duckdb_conn.return_value
        duckdb_exporter.transfer_table(mock_conn, "tbl-22", "mysql", "postgres")
        expected_qry = f"""
            INSERT INTO
                {duckdb_exporter.DUCKDB_POSTGRES_DB_NAME}.postgres."tbl-22"
            SELECT
                *
            FROM
                {duckdb_exporter.DUCKDB_MYSQL_DB_NAME}.mysql."tbl-22"
        """
        expected_qry = dedent(expected_qry)
        assert dedent(mock_conn.execute.call_args_list[9].args[0]) == expected_qry

    def test_save_ddl(self, mocker):
        """Test duckdb_exporter.py functions.

        ::save_ddl

        ::It should open a file and save the DDL to it.
        """
        mocked_open = mocker.mock_open()
        mocker.patch("builtins.open", mocked_open)
        duckdb_exporter.save_ddl("tbl1", "this is a test line")
        mocked_open.assert_called_once_with("ddls/tbl1.sql", "w")
        mocked_open.return_value.write.assert_called_once_with("this is a test line\n")
