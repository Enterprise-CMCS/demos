"""A module containing tests for the duckdb_exporter.py file."""

import research.duckdb_exporter.duckdb_exporter as duckdb_exporter
import pytest


class TestDuckDBExporter():
    """A class for the tests for the duckdb_exporter.py file."""

    @pytest.fixture()
    def sample_config(self):
        """Return a sample DB config."""
        return {
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

    def test_create_duckdb_conn(self, mocker, sample_config):
        """Test duckdb_exporter.py functions.

        ::create_duckdb_conn

        ::It should invoke an in-memory database.
        """
        mocked_conn = mocker.patch("duckdb.connect")
        duckdb_exporter.create_duckdb_conn(sample_config)
        mocked_conn.assert_called_once_with(":memory:", config={"memory_limit": "8GB", "threads": 8})
