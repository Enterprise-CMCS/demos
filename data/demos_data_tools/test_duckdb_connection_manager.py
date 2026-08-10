"""A module containing tests for the duckdb_connection_manager.py file."""

from unittest.mock import MagicMock, call

import pytest

import duckdb_connection_manager


class TestDuckDbConnectionManager:
    """A class for the tests for the duckdb_connection_manager.py file."""

    mock_pmda_config = {
        "host": "testhost1",
        "port": "12345",
        "user": "fakeuser1",
        "pwd": "fake?$'!@<&>passwd1",  # pragma: allowlist secret
        "db": "fakedb1",
    }
    mock_demos_config = {
        "host": "testhost2",
        "port": "23456",
        "user": "fakeuser2",
        "pwd": "fakepasswd2",  # pragma: allowlist secret
        "db": "fakedb2",
        "sslmode": "prefer",
    }

    @pytest.fixture
    def mock_duckdb_connect(self, mocker):
        """Patch duckdb.connect so create_duckdb_conn runs against a mock."""
        return mocker.patch("duckdb.connect")

    @pytest.fixture
    def mock_load_credentials(self, mocker):
        """Patch _load_db_config_from_env to prevent real env var loading."""
        return mocker.patch("duckdb_connection_manager._load_db_config_from_env")

    def test__load_db_config_from_env_01(self, mocker):
        """Test duckdb_connection_manager.py functions.

        ::_load_db_config_from_env

        ::It should build the PMDA config dict from environment variables.
        """
        env_vars = {
            "PMDA_MYSQL_HOST": self.mock_pmda_config["host"],
            "PMDA_MYSQL_PORT": self.mock_pmda_config["port"],
            "PMDA_MYSQL_USER": self.mock_pmda_config["user"],
            "PMDA_MYSQL_PWD": self.mock_pmda_config["pwd"],
            "PMDA_MYSQL_DB": self.mock_pmda_config["db"],
        }
        mocker.patch.dict("os.environ", env_vars)

        result = duckdb_connection_manager._load_db_config_from_env("PMDA")

        assert result == self.mock_pmda_config

    def test__load_db_config_from_env_02(self, mocker):
        """Test duckdb_connection_manager.py functions.

        ::_load_db_config_from_env

        ::It should build the DEMOS config dict from environment variables.
        """
        env_vars = {
            "DEMOS_PGSQL_HOST": self.mock_demos_config["host"],
            "DEMOS_PGSQL_PORT": self.mock_demos_config["port"],
            "DEMOS_PGSQL_USER": self.mock_demos_config["user"],
            "DEMOS_PGSQL_PWD": self.mock_demos_config["pwd"],
            "DEMOS_PGSQL_DB": self.mock_demos_config["db"],
            "DEMOS_PGSQL_SSLMODE": self.mock_demos_config["sslmode"],
        }
        mocker.patch.dict("os.environ", env_vars)

        result = duckdb_connection_manager._load_db_config_from_env("DEMOS")

        assert result == self.mock_demos_config

    def test__load_db_config_from_env_03(self, mocker):
        """Test duckdb_connection_manager.py functions.

        ::_load_db_config_from_env

        ::It should raise a KeyError with a safe message when an env var is missing.
        """
        mocker.patch.dict("os.environ", {}, clear=True)

        with pytest.raises(KeyError) as except_info:
            duckdb_connection_manager._load_db_config_from_env("PMDA")

        assert (
            except_info.value.args[0] == "A KeyError occurred while loading the PMDA credentials from the environment."
        )

    def test__load_db_config_from_env_04(self, mocker):
        """Test duckdb_connection_manager.py functions.

        ::_load_db_config_from_env

        ::It should handle other types of errors that are raised.
        """
        # This creates a replacement for os.environ that will throw
        # Allows for testing
        mock_env = MagicMock()
        mock_env.__getitem__.side_effect = ValueError("unexpected")
        mocker.patch.object(duckdb_connection_manager.os, "environ", new=mock_env)

        with pytest.raises(RuntimeError) as except_info:
            duckdb_connection_manager._load_db_config_from_env("DEMOS")

        assert (
            except_info.value.args[0] == "An unhandled exception occurred while loading "
            "the DEMOS credentials from the environment."
        )

    def test_create_duckdb_conn_01(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should invoke an in-memory database.
        """
        duckdb_connection_manager.create_duckdb_conn()

        mock_duckdb_connect.assert_called_once_with(":memory:", config={"memory_limit": "8GB", "threads": 8})

    def test_create_duckdb_conn_02(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should install the PostgreSQL and MySQL extensions.
        """
        duckdb_connection_manager.create_duckdb_conn()

        mock_conn = mock_duckdb_connect.return_value
        assert mock_conn.install_extension.call_args_list == [call("postgres"), call("mysql")]

    def test_attach_pmda_to_conn_01(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_pmda_to_conn

        ::It should create a MySQL secret and escape single quotes in the password.
        """
        mock_conn = MagicMock()
        mock_load_credentials.return_value = self.mock_pmda_config

        duckdb_connection_manager.attach_pmda_to_conn(mock_conn)

        secret_sql = mock_conn.execute.call_args_list[0].args[0]
        assert "TYPE mysql" in secret_sql
        assert "HOST 'testhost1'" in secret_sql
        assert "PORT 12345" in secret_sql
        assert "DATABASE fakedb1" in secret_sql
        assert "USER 'fakeuser1'" in secret_sql
        assert "PASSWORD 'fake?$''!@<&>passwd1'" in secret_sql  # pragma: allowlist secret

    def test_attach_pmda_to_conn_02(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_pmda_to_conn

        ::It should connect to MySQL.
        """
        mock_conn = MagicMock()
        mock_load_credentials.return_value = self.mock_pmda_config

        duckdb_connection_manager.attach_pmda_to_conn(mock_conn)

        assert mock_conn.execute.call_args_list[1] == call("ATTACH '' AS ddb_pmda (TYPE mysql);")

    def test_attach_pmda_to_conn_03(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_pmda_to_conn

        ::It should raise a RuntimeError with a safe message when the connection fails.
        """
        mock_conn = MagicMock()
        mock_exception_msg = "Something went wrong and this should not be logged"
        mock_conn.execute.side_effect = Exception(mock_exception_msg)
        mock_load_credentials.return_value = self.mock_pmda_config

        with pytest.raises(RuntimeError) as except_info:
            duckdb_connection_manager.attach_pmda_to_conn(mock_conn)

        assert except_info.value.args[0] == "An error occurred while attempting to attach the PMDA database."
        assert except_info.value.args[0] != mock_exception_msg

    def test_attach_demos_to_conn_01(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_demos_to_conn

        ::It should create a PostgreSQL secret with the connection details.
        """
        mock_conn = MagicMock()
        mock_load_credentials.return_value = self.mock_demos_config

        duckdb_connection_manager.attach_demos_to_conn(mock_conn)

        secret_sql = mock_conn.execute.call_args_list[0].args[0]
        assert "TYPE postgres" in secret_sql
        assert "HOST 'testhost2'" in secret_sql
        assert "PORT 23456" in secret_sql
        assert "DATABASE fakedb2" in secret_sql
        assert "USER 'fakeuser2'" in secret_sql
        assert "PASSWORD 'fakepasswd2'" in secret_sql  # pragma: allowlist secret

    def test_attach_demos_to_conn_02(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_demos_to_conn

        ::It should connect to PostgreSQL.
        """
        mock_conn = MagicMock()
        mock_load_credentials.return_value = self.mock_demos_config

        duckdb_connection_manager.attach_demos_to_conn(mock_conn)

        assert mock_conn.execute.call_args_list[1] == call("ATTACH 'sslmode=prefer' AS ddb_demos (TYPE postgres);")
        assert mock_conn.execute.call_args_list[2] == call("SET pg_null_byte_replacement=''")

    def test_attach_demos_to_conn_03(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_demos_to_conn

        ::It should raise a RuntimeError with a safe message when the connection fails.
        """
        mock_conn = MagicMock()
        mock_exception_msg = "Something went wrong and this should not be logged"
        mock_conn.execute.side_effect = Exception(mock_exception_msg)
        mock_load_credentials.return_value = self.mock_demos_config

        with pytest.raises(RuntimeError) as except_info:
            duckdb_connection_manager.attach_demos_to_conn(mock_conn)

        assert except_info.value.args[0] == "An error occurred while attempting to attach the DEMOS database."
        assert except_info.value.args[0] != mock_exception_msg
