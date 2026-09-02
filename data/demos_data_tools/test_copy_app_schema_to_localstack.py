"""A module containing tests for the copy_app_schema_to_localstack.py file."""

import pytest

import copy_app_schema_to_localstack
from types_constants import ArbitrarySqlGenerationContext, TriggerActionConfiguration


class TestCopyAppSchemaToLocalstack:
    """A class for the tests for the copy_app_schema_to_localstack.py file."""

    def test__validate_history_table_name_01(self):
        """Test copy_app_schema_to_localstack.py functions.

        ::_validate_history_table_name

        ::It should not throw when given a correct history table name.
        """
        copy_app_schema_to_localstack._validate_history_table_name("my_history")

    def test__validate_history_table_name_02(self):
        """Test copy_app_schema_to_localstack.py functions.

        ::_validate_history_table_name

        ::It should throw when given an incorrect history table name.
        """
        with pytest.raises(ValueError) as except_info:
            copy_app_schema_to_localstack._validate_history_table_name("deliverable")
        assert except_info.value.args[0] == "deliverable is not a valid history table name; does not end in _history"

    def test__get_table_name_from_history_table_name(self, mocker):
        """Test copy_app_schema_to_localstack.py functions.

        ::_get_table_name_from_history_table_name

        ::It should return the history table name after validating.
        """
        mock_validator = mocker.patch("copy_app_schema_to_localstack._validate_history_table_name")

        result = copy_app_schema_to_localstack._get_table_name_from_history_table_name("my_table_of_history")

        mock_validator.assert_called_once_with("my_table_of_history")
        assert result == "my_table_of"

    def test__make_history_trigger_action_configs(self):
        """Test copy_app_schema_to_localstack.py functions.

        ::_make_history_trigger_action_configs

        ::It should return the history trigger action configs requested.
        """
        results = copy_app_schema_to_localstack._make_history_trigger_action_configs("disable")
        assert all([result.action_type == "disable" for result in results])
        assert all([isinstance(result, TriggerActionConfiguration) for result in results])
        assert all([result.trigger_name[:12] == "log_changes_" for result in results])

    def test__make_other_trigger_action_configs(self):
        """Test copy_app_schema_to_localstack.py functions.

        ::_make_other_trigger_action_configs

        ::It should return the other trigger action configs requested.
        """
        results = copy_app_schema_to_localstack._make_other_trigger_action_configs("enable")
        assert all([result.action_type == "enable" for result in results])
        assert all([isinstance(result, TriggerActionConfiguration) for result in results])

    def test__create_history_revision_seq_resetter(self, mocker):
        """Test copy_app_schema_to_localstack.py functions.

        ::_create_history_revision_seq_resetter

        ::It should return the reset sequence generator requested.
        """
        mock_validator = mocker.patch("copy_app_schema_to_localstack._validate_history_table_name")

        result = copy_app_schema_to_localstack._create_history_revision_seq_resetter("table_of_mine_history")
        mock_validator.assert_called_once_with("table_of_mine_history")
        assert callable(result)
        return_from_result = result(
            ArbitrarySqlGenerationContext(attach_name="ddb_demos_localstack", app_schema="demos_app")
        )
        assert (
            return_from_result == "CALL postgres_execute('ddb_demos_localstack', "
            "$$SELECT setval(pg_get_serial_sequence('demos_app.table_of_mine_history', "
            "'revision_id'), 1000000000);$$);"
        )
