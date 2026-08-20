"""A module containing tests for the duckdb_connection_manager.py file."""

from unittest.mock import MagicMock, call

import pytest

import duckdb_connection_manager


class TestDuckDbConnectionManager:
    """A class for the tests for the duckdb_connection_manager.py file."""

    mock_demos_localstack_config = {
        "host": "testhost2",
        "port": "23456",
        "user": "fakeuser2",
        "pwd": "fakepasswd2",  # pragma: allowlist secret
        "db": "fakedb2",
        "sslmode": "disable",
    }
    mock_demos_aws_config = {
        "host": "testhost1",
        "port": "12345",
        "user": "fakeuser1",
        "pwd": "fake?$'!@<&>passwd1",  # pragma: allowlist secret
        "db": "fakedb1",
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

        ::It should build the DEMOS LocalStack config dict from environment variables.
        """
        env_vars = {
            "DEMOS_LOCALSTACK_HOST": self.mock_demos_localstack_config["host"],
            "DEMOS_LOCALSTACK_PORT": self.mock_demos_localstack_config["port"],
            "DEMOS_LOCALSTACK_USER": self.mock_demos_localstack_config["user"],
            "DEMOS_LOCALSTACK_PWD": self.mock_demos_localstack_config["pwd"],
            "DEMOS_LOCALSTACK_DB": self.mock_demos_localstack_config["db"],
            "DEMOS_LOCALSTACK_SSLMODE": self.mock_demos_localstack_config["sslmode"],
        }
        mocker.patch.dict("os.environ", env_vars)

        result = duckdb_connection_manager._load_db_config_from_env("DEMOS LocalStack")

        assert result == self.mock_demos_localstack_config

    def test__load_db_config_from_env_02(self, mocker):
        """Test duckdb_connection_manager.py functions.

        ::_load_db_config_from_env

        ::It should build the DEMOS AWS config dict from environment variables.
        """
        env_vars = {
            "DEMOS_AWS_HOST": self.mock_demos_aws_config["host"],
            "DEMOS_AWS_PORT": self.mock_demos_aws_config["port"],
            "DEMOS_AWS_USER": self.mock_demos_aws_config["user"],
            "DEMOS_AWS_PWD": self.mock_demos_aws_config["pwd"],
            "DEMOS_AWS_DB": self.mock_demos_aws_config["db"],
            "DEMOS_AWS_SSLMODE": self.mock_demos_aws_config["sslmode"],
        }
        mocker.patch.dict("os.environ", env_vars)

        result = duckdb_connection_manager._load_db_config_from_env("DEMOS AWS")

        assert result == self.mock_demos_aws_config

    def test__load_db_config_from_env_03(self, mocker):
        """Test duckdb_connection_manager.py functions.

        ::_load_db_config_from_env

        ::It should raise a KeyError with a safe message when an env var is missing.
        """
        mocker.patch.dict("os.environ", {}, clear=True)

        with pytest.raises(KeyError) as except_info:
            duckdb_connection_manager._load_db_config_from_env("DEMOS LocalStack")

        assert (
            except_info.value.args[0]
            == "A KeyError occurred while loading the DEMOS LocalStack DB config from the environment."
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
            duckdb_connection_manager._load_db_config_from_env("DEMOS AWS")

        assert (
            except_info.value.args[0] == "An unhandled exception occurred while loading "
            "the DEMOS AWS DB config from the environment."
        )

    def test__load_db_config_from_env_05(self):
        """Test duckdb_connection_manager.py functions.

        ::_load_db_config_from_env

        ::It should throw if given an invalid DB config.
        """
        with pytest.raises(RuntimeError) as except_info:
            duckdb_connection_manager._load_db_config_from_env("Not A Database")  # type: ignore

        assert (
            except_info.value.args[0] == "An unhandled exception occurred while loading "
            "the Not A Database DB config from the environment."
        )

    def test_create_duckdb_conn_01(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should invoke an in-memory database.
        """
        duckdb_connection_manager.create_duckdb_conn()

        mock_duckdb_connect.assert_called_once_with(":memory:", config={"memory_limit": "2GB", "threads": 2})

    def test_create_duckdb_conn_02(self, mock_duckdb_connect):
        """Test duckdb_connection_manager.py functions.

        ::create_duckdb_conn

        ::It should install the PostgreSQL extension.
        """
        duckdb_connection_manager.create_duckdb_conn()

        mock_conn = mock_duckdb_connect.return_value
        assert mock_conn.install_extension.call_args_list == [call("postgres")]

    def test_attach_demos_db_to_conn_01(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_demos_db_to_conn

        ::It should create a PostgreSQL secret and escape single quotes in the password.
        """
        mock_conn = MagicMock()
        mock_load_credentials.return_value = self.mock_demos_aws_config

        duckdb_connection_manager.attach_demos_db_to_conn(mock_conn, "DEMOS AWS")

        secret_sql = mock_conn.execute.call_args_list[0].args[0]
        assert "TYPE postgres" in secret_sql
        assert "HOST 'testhost1'" in secret_sql
        assert "PORT 12345" in secret_sql
        assert "DATABASE fakedb1" in secret_sql
        assert "USER 'fakeuser1'" in secret_sql
        assert "PASSWORD 'fake?$''!@<&>passwd1'" in secret_sql  # pragma: allowlist secret

    def test_attach_demos_db_to_conn_02(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_demos_db_to_conn

        ::It should connect to PostgreSQL using the config requested.
        """
        mock_conn = MagicMock()
        mock_load_credentials.return_value = self.mock_demos_localstack_config

        duckdb_connection_manager.attach_demos_db_to_conn(mock_conn, "DEMOS LocalStack")

        assert mock_conn.execute.call_args_list[1] == call(
            f"ATTACH 'sslmode=disable' AS {duckdb_connection_manager.DEMOS_LOCALSTACK_DDB_ATTACH_NAME} (TYPE postgres);"
        )

    def test_attach_demos_db_to_conn_03(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_demos_db_to_conn

        ::It should raise a RuntimeError with a safe message when the connection fails.
        """
        mock_conn = MagicMock()
        mock_exception_msg = "Something went wrong and this should not be logged"
        mock_conn.execute.side_effect = Exception(mock_exception_msg)

        with pytest.raises(RuntimeError) as except_info:
            duckdb_connection_manager.attach_demos_db_to_conn(mock_conn, "DEMOS AWS")

        assert except_info.value.args[0] == "An error occurred while attempting to attach the DEMOS database."
        assert except_info.value.args[0] != mock_exception_msg

    def test_attach_demos_db_to_conn_04(self, mock_load_credentials):
        """Test duckdb_connection_manager.py functions.

        ::attach_demos_db_to_conn

        ::It should throw if given an invalid DB config.
        """
        mock_conn = MagicMock()

        with pytest.raises(AssertionError) as except_info:
            duckdb_connection_manager.attach_demos_db_to_conn(mock_conn, "Not A Database")  # type: ignore

        assert except_info.value.args[0] == "Expected code to be unreachable, but got: 'Not A Database'"
