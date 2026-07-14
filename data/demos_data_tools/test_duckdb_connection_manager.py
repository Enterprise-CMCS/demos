"""A module containing tests for the duckdb_connection_manager.py file."""

from unittest.mock import call

import pytest

import duckdb_connection_manager


class TestDuckDbConnectionManager:
    """A class for the tests for the duckdb_connection_manager.py file."""

    db_conn_config = {
        "ddb_pmda": {
            "host": "testhost1",
            "port": "12345",
            "user": "fakeuser1",
            "pwd": "fake?$'!@<&>passwd1",  # pragma: allowlist secret
            "db": "fakedb1",
        },
        "ddb_demos": {
            "host": "testhost2",
            "port": "23456",
            "user": "fakeuser2",
            "pwd": "fakepasswd2",  # pragma: allowlist secret
            "db": "fakedb2",
            "sslmode": "prefer",
        },
    }

    @pytest.fixture
    def mock_duckdb_connect(self, mocker):
        """Patch duckdb.connect so create_duckdb_conn runs against a mock."""
        return mocker.patch("duckdb.connect")

    def test_load_db_configs_from_env(self, mocker):
        """Test duckdb_connection_manager.py functions.

        ::load_db_configs_from_env

        ::It should build the DB config dictionary from environment variables.
        """
        env_vars = {
            "PMDA_MYSQL_HOST": "envhost1",
            "PMDA_MYSQL_PORT": "13306",
            "PMDA_MYSQL_USER": "envuser1",
            "PMDA_MYSQL_PWD": "envpwd1",  # pragma: allowlist secret
            "PMDA_MYSQL_DB": "envdb1",
            "DEMOS_PGSQL_HOST": "envhost2",
            "DEMOS_PGSQL_PORT": "15432",
            "DEMOS_PGSQL_USER": "envuser2",
            "DEMOS_PGSQL_PWD": "envpwd2",  # pragma: allowlist secret
            "DEMOS_PGSQL_DB": "envdb2",
            "DEMOS_PGSQL_SSLMODE": "require",
        }
        mocker.patch.dict("os.environ", env_vars)

        result = duckdb_connection_manager.load_db_configs_from_env()

        expected = {
            "ddb_pmda": {
                "host": "envhost1",
                "port": "13306",
                "user": "envuser1",
                "pwd": "envpwd1",  # pragma: allowlist secret
                "db": "envdb1",
            },
            "ddb_demos": {
                "host": "envhost2",
                "port": "15432",
                "user": "envuser2",
                "pwd": "envpwd2",  # pragma: allowlist secret
                "db": "envdb2",
                "sslmode": "require",
            },
        }
        assert result == expected

    def test_create_duckdb_conn_01(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should invoke an in-memory database.
        """
        duckdb_connection_manager.create_duckdb_conn(self.db_conn_config)

        mock_duckdb_connect.assert_called_once_with(":memory:", config={"memory_limit": "8GB", "threads": 8})

    def test_create_duckdb_conn_02(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should install the PostgreSQL and MySQL extensions.
        """
        duckdb_connection_manager.create_duckdb_conn(self.db_conn_config)

        mock_conn = mock_duckdb_connect.return_value
        assert mock_conn.install_extension.call_args_list == [call("postgres"), call("mysql")]
        assert mock_conn.load_extension.call_args_list == [call("postgres"), call("mysql")]

    def test_create_duckdb_conn_03(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should create a PostgreSQL secret with the connection details.
        """
        duckdb_connection_manager.create_duckdb_conn(self.db_conn_config)

        mock_conn = mock_duckdb_connect.return_value
        secret_sql = mock_conn.execute.call_args_list[0].args[0]
        assert "TYPE postgres" in secret_sql
        assert "HOST 'testhost2'" in secret_sql
        assert "PORT 23456" in secret_sql
        assert "DATABASE fakedb2" in secret_sql
        assert "USER 'fakeuser2'" in secret_sql
        assert "PASSWORD 'fakepasswd2'" in secret_sql  # pragma: allowlist secret

    def test_create_duckdb_conn_04(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should create a MySQL secret and escape single quotes in the password.
        """
        duckdb_connection_manager.create_duckdb_conn(self.db_conn_config)

        mock_conn = mock_duckdb_connect.return_value
        secret_sql = mock_conn.execute.call_args_list[3].args[0]
        assert "TYPE mysql" in secret_sql
        assert "HOST 'testhost1'" in secret_sql
        assert "PORT 12345" in secret_sql
        assert "DATABASE fakedb1" in secret_sql
        assert "USER 'fakeuser1'" in secret_sql
        assert "PASSWORD 'fake?$''!@<&>passwd1'" in secret_sql  # pragma: allowlist secret

    def test_create_duckdb_conn_05(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should connect to PostgreSQL.
        """
        duckdb_connection_manager.create_duckdb_conn(self.db_conn_config)

        mock_conn = mock_duckdb_connect.return_value
        assert mock_conn.execute.call_args_list[1] == call("ATTACH 'sslmode=prefer' AS ddb_demos (TYPE postgres);")
        assert mock_conn.execute.call_args_list[2] == call("SET pg_null_byte_replacement=''")

    def test_create_duckdb_conn_06(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should connect to MySQL.
        """
        duckdb_connection_manager.create_duckdb_conn(self.db_conn_config)

        mock_conn = mock_duckdb_connect.return_value
        assert mock_conn.execute.call_args_list[4] == call("ATTACH '' AS ddb_pmda (TYPE mysql);")
