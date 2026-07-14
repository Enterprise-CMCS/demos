"""Tests for the boto copy script."""

from __future__ import annotations

import os

import pytest

import migrate_files


@pytest.fixture
def migration_environment(mocker):
    """Provide the default environment used by the migration script."""

    def _set_environment(**overrides):
        environment = {
            "POSTGRES_HOST": "db-host",
            "POSTGRES_PORT": "5432",
            "POSTGRES_DATABASE": "app_db",
            "POSTGRES_USER": "db-user",
            "POSTGRES_PASSWORD": "db-pass",  # pragma: allowlist secret
            "POSTGRES_SSLMODE": "prefer",
            "SOURCE_BUCKET": "source-bucket",
            "DESTINATION_BUCKET": "destination-bucket",
            "PRODUCTION": "0",
        }
        environment.update(overrides)
        mocker.patch.dict(os.environ, environment)

    return _set_environment


@pytest.fixture
def mock_create_duckdb_connection(mocker):
    """Patch DuckDB connection creation for the migration script."""
    return mocker.patch.object(migrate_files.duckdb, "connect")


@pytest.fixture
def mock_boto3_session(mocker):
    """Patch boto3 session creation for the migration script."""
    return mocker.patch.object(migrate_files.boto3, "Session")


class TestMigrateFiles:
    """A class for the tests for the migrate_files.py file."""

    def test_create_duckdb_postgres_conn(
        self,
        mock_create_duckdb_connection,
        migration_environment,
    ):
        """Test migrate_files.py functions.

        ::create_duckdb_postgres_conn

        ::It should configure DuckDB to attach the Postgres database.
        """
        mock_conn = mock_create_duckdb_connection.return_value
        migration_environment(
            POSTGRES_HOST="db-host",
            POSTGRES_PORT="5433",
            POSTGRES_DATABASE="app_db",
            POSTGRES_USER="db-user",
            POSTGRES_PASSWORD="db'pass",
            POSTGRES_SSLMODE="require",
        )

        result = migrate_files.create_duckdb_postgres_conn()

        assert result == mock_conn
        mock_create_duckdb_connection.assert_called_once_with(":memory:")
        assert mock_conn.install_extension.call_args_list[0].args == ("postgres",)
        assert mock_conn.load_extension.call_args_list[0].args == ("postgres",)
        create_secret_sql = mock_conn.execute.call_args_list[0].args[0]
        assert "HOST 'db-host'" in create_secret_sql
        assert "PORT 5433" in create_secret_sql
        assert "DATABASE 'app_db'" in create_secret_sql
        assert "USER 'db-user'" in create_secret_sql
        assert "PASSWORD 'db''pass'" in create_secret_sql
        attach_sql = mock_conn.execute.call_args_list[1].args[0]
        assert attach_sql == "ATTACH 'sslmode=require' AS postgres_db (TYPE postgres);"

    def test_create_duckdb_postgres_conn_requires_sslmode(
        self,
        mock_create_duckdb_connection,
        mocker,
        migration_environment,
    ):
        """Test migrate_files.py functions.

        ::create_duckdb_postgres_conn

        ::It should fail when the required sslmode environment variable is missing.
        """
        migration_environment()
        mocker.patch.dict(os.environ, {}, clear=False)
        del os.environ["POSTGRES_SSLMODE"]

        with pytest.raises(KeyError, match="POSTGRES_SSLMODE"):
            migrate_files.create_duckdb_postgres_conn()

        mock_create_duckdb_connection.assert_called_once_with(":memory:")

    def test_get_unmigrated_files(self):
        """Test migrate_files.py functions.

        ::get_unmigrated_files

        ::It should execute the configured SQL and return fetched rows.
        """
        mock_conn = pytest.importorskip("unittest.mock").MagicMock()
        expected_rows = [
            ("a", "b"),
            ("c", "d"),
        ]
        mock_conn.execute.return_value.fetchall.return_value = expected_rows

        result = list(migrate_files.get_unmigrated_files(mock_conn))

        mock_conn.execute.assert_called_once_with(migrate_files.SELECT_UNMIGRATED_FILES_QUERY)
        assert result == [
            {"old_path": "a", "new_path": "b"},
            {"old_path": "c", "new_path": "d"},
        ]

    def test_copy_s3_object(self, mocker):
        """Test migrate_files.py functions.

        ::copy_s3_object

        ::It should issue a server-side S3 copy request.
        """
        mock_s3_client = mocker.Mock()

        migrate_files.copy_s3_object(
            mock_s3_client,
            "source-bucket",
            "destination-bucket",
            "old/file.txt",
            "new/file.txt",
        )

        mock_s3_client.copy.assert_called_once_with(
            {"Bucket": "source-bucket", "Key": "old/file.txt"},
            "destination-bucket",
            "new/file.txt",
        )

    def test_migrate_file_copies_one_row(self, mocker, migration_environment, capsys):
        """Test migrate_files.py functions.

        ::migrate_file

        ::It should copy the provided row.
        """
        mock_conn = mocker.Mock()
        mock_s3_client = mocker.Mock()
        migration_environment(PRODUCTION="1")
        test_row = {"old_path": "old/1.txt", "new_path": "new/1.txt"}
        mock_copy_s3_object = mocker.patch.object(migrate_files, "copy_s3_object")
        mock_mark_row_copied = mocker.patch.object(migrate_files, "mark_row_copied")

        result = migrate_files.migrate_file(mock_conn, test_row, mock_s3_client)

        assert result is None
        mock_copy_s3_object.assert_called_once_with(
            mock_s3_client,
            "source-bucket",
            "destination-bucket",
            "old/1.txt",
            "new/1.txt",
        )
        mock_mark_row_copied.assert_called_once_with(mock_conn, test_row)
        assert "Copying s3://source-bucket/old/1.txt -> s3://destination-bucket/new/1.txt" in capsys.readouterr().out

    def test_migrate_file_dry_run(self, mocker, migration_environment):
        """Test migrate_files.py functions.

        ::migrate_file

        ::It should avoid issuing a copy call during dry run.
        """
        mock_conn = mocker.Mock()
        mock_s3_client = mocker.Mock()
        migration_environment(PRODUCTION="0")
        test_row = {"old_path": "old/1.txt", "new_path": "new/1.txt"}
        mock_copy_s3_object = mocker.patch.object(migrate_files, "copy_s3_object")
        mock_mark_row_copied = mocker.patch.object(migrate_files, "mark_row_copied")

        result = migrate_files.migrate_file(mock_conn, test_row, mock_s3_client)

        assert result is None
        mock_copy_s3_object.assert_not_called()
        mock_mark_row_copied.assert_not_called()

    def test_migrate_file_does_not_mark_row_when_copy_fails(self, mocker, migration_environment):
        """Test migrate_files.py functions.

        ::migrate_file

        ::It should not mark the row copied when the S3 copy fails.
        """
        mock_conn = mocker.Mock()
        mock_s3_client = mocker.Mock()
        migration_environment(PRODUCTION="1")
        test_row = {"old_path": "old/1.txt", "new_path": "new/1.txt"}
        mocker.patch.object(migrate_files, "copy_s3_object", side_effect=RuntimeError("copy failed"))
        mock_mark_row_copied = mocker.patch.object(migrate_files, "mark_row_copied")

        with pytest.raises(RuntimeError, match="copy failed"):
            migrate_files.migrate_file(mock_conn, test_row, mock_s3_client)

        mock_mark_row_copied.assert_not_called()

    def test_mark_row_copied_updates_one_row(self, mocker):
        """Test migrate_files.py functions.

        ::mark_row_copied

        ::It should mark the copied row in Postgres.
        """
        mock_conn = mocker.Mock()
        test_row = {"old_path": "old/1.txt", "new_path": "new/1.txt"}

        migrate_files.mark_row_copied(mock_conn, test_row)

        mock_conn.execute.assert_called_once_with(
            migrate_files.MARK_FILE_MIGRATED_QUERY,
            ["old/1.txt", "new/1.txt"],
        )

    def test_main_wires_dependencies(self, mocker, mock_boto3_session, migration_environment, capsys):
        """Test migrate_files.py functions.

        ::main

        ::It should load config, construct clients, and process fetched rows.
        """
        mock_conn = mocker.Mock()
        mocked_session = mock_boto3_session.return_value
        expected_rows = [
            {"old_path": "old/1.txt", "new_path": "new/1.txt"},
            {"old_path": "old/2.txt", "new_path": "new/2.txt"},
        ]
        mocked_create_conn = mocker.patch.object(
            migrate_files,
            "create_duckdb_postgres_conn",
            return_value=mock_conn,
        )
        mocked_get_unmigrated_files = mocker.patch.object(
            migrate_files,
            "get_unmigrated_files",
            return_value=expected_rows,
        )
        mocked_migrate_file = mocker.patch.object(migrate_files, "migrate_file")
        mocked_load_dotenv = mocker.patch.object(migrate_files, "load_dotenv")

        migration_environment(PRODUCTION="0")

        result = migrate_files.main()

        assert result is None
        mocked_load_dotenv.assert_called_once_with(migrate_files.ENV_FILE)
        mocked_create_conn.assert_called_once_with()
        mock_boto3_session.assert_called_once_with()
        mocked_session.client.assert_called_once_with("s3")
        mocked_get_unmigrated_files.assert_called_once_with(mock_conn)
        assert mocked_migrate_file.call_count == 2
        mock_conn.close.assert_called_once_with()
        output = capsys.readouterr().out
        assert "Processing row 1." in output
        assert "Processing row 2." in output
        assert "Would copy 2 file(s)." in output

    def test_main_reports_copied_count_in_production(
        self,
        mocker,
        mock_boto3_session,
        migration_environment,
        capsys,
    ):
        """Test migrate_files.py functions.

        ::main

        ::It should report copied files when production mode is enabled.
        """
        mock_conn = mocker.Mock()
        mocked_create_conn = mocker.patch.object(
            migrate_files,
            "create_duckdb_postgres_conn",
            return_value=mock_conn,
        )
        mocked_get_unmigrated_files = mocker.patch.object(
            migrate_files,
            "get_unmigrated_files",
            return_value=[
                {"old_path": "old/1.txt", "new_path": "new/1.txt"},
                {"old_path": "old/2.txt", "new_path": "new/2.txt"},
            ],
        )
        mocked_migrate_file = mocker.patch.object(migrate_files, "migrate_file")
        mocker.patch.object(migrate_files, "load_dotenv")

        migration_environment(PRODUCTION="1")

        result = migrate_files.main()

        assert result is None
        mocked_create_conn.assert_called_once_with()
        mocked_get_unmigrated_files.assert_called_once_with(mock_conn)
        assert mocked_migrate_file.call_count == 2
        assert "Copied 2 file(s)." in capsys.readouterr().out

    def test_main_with_zero_rows(self, mocker, mock_boto3_session, migration_environment, capsys):
        """Test migrate_files.py functions.

        ::main

        ::It should skip migration work when there are no rows to process.
        """
        mock_conn = mocker.Mock()
        mocker.patch.object(
            migrate_files,
            "create_duckdb_postgres_conn",
            return_value=mock_conn,
        )
        mocker.patch.object(
            migrate_files,
            "get_unmigrated_files",
            return_value=[],
        )
        mocked_migrate_file = mocker.patch.object(migrate_files, "migrate_file")
        mocker.patch.object(migrate_files, "load_dotenv")

        migration_environment(PRODUCTION="0")

        result = migrate_files.main()

        assert result is None
        mocked_migrate_file.assert_not_called()
        assert "Would copy 0 file(s)." in capsys.readouterr().out

    def test_main_closes_connection_when_migration_fails(
        self,
        mocker,
        mock_boto3_session,
        migration_environment,
    ):
        """Test migrate_files.py functions.

        ::main

        ::It should close the database connection when row processing fails.
        """
        mock_conn = mocker.Mock()
        mocker.patch.object(
            migrate_files,
            "create_duckdb_postgres_conn",
            return_value=mock_conn,
        )
        mocker.patch.object(
            migrate_files,
            "get_unmigrated_files",
            return_value=[{"old_path": "old/1.txt", "new_path": "new/1.txt"}],
        )
        mocker.patch.object(migrate_files, "migrate_file", side_effect=RuntimeError("boom"))
        mocker.patch.object(migrate_files, "load_dotenv")

        migration_environment(PRODUCTION="1")

        with pytest.raises(RuntimeError, match="boom"):
            migrate_files.main()

        mock_conn.close.assert_called_once_with()

    def test_get_unmigrated_files_with_no_results(self):
        """Test migrate_files.py functions.

        ::get_unmigrated_files

        ::It should yield no rows when the query returns no results.
        """
        mock_conn = pytest.importorskip("unittest.mock").MagicMock()
        mock_conn.execute.return_value.fetchall.return_value = []

        result = list(migrate_files.get_unmigrated_files(mock_conn))

        mock_conn.execute.assert_called_once_with(migrate_files.SELECT_UNMIGRATED_FILES_QUERY)
        assert result == []
