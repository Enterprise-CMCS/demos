"""Copy the demos_app schema from AWS to localstack for testing and development purposes."""

from logging import getLogger
from typing import TYPE_CHECKING, List, Literal
from logger_utils import config_logger
from types_constants import (
    AppSchemaName,
    DataLoadActionList,
    DuckDbAttachName,
    TriggerActionConfiguration,
)

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as DuckConn

APP_SCHEMA_NAME: AppSchemaName = "demos_app"
LOCALSTACK_ATTACH_NAME: DuckDbAttachName = "ddb_demos_localstack"

logger = config_logger(getLogger(__name__))


HISTORY_TABLES_TO_COPY = [
    "amendment_history",
    "application_date_history",
    "application_history",
    "application_note_history",
    "application_phase_history",
    "application_tag_assignment_history",
    "application_tag_suggestion_extract_history",
    "application_tag_suggestion_history",
    "budget_neutrality_workbook_history",
    "deliverable_action_history",
    "deliverable_demonstration_type_history",
    "deliverable_extension_history",
    "deliverable_history",
    "demonstration_history",
    "demonstration_role_assignment_history",
    "demonstration_type_tag_assignment_history",
    "document_history",
    "document_infected_history",
    "document_pending_upload_history",
    "extension_history",
    "person_history",
    "person_state_history",
    "primary_demonstration_role_assignment_history",
    "private_comment_history",
    "public_comment_history",
    "reference_agreement_history",
    "reference_configuration_history",
    "reference_demonstration_type_history",
    "reference_history",
    "reference_tag_assignment_history",
    "system_role_assignment_history",
    "tag_history",
    "tag_name_history",
    "uipath_result_history",
    "uipath_value_history",
    "users_history",
]

MAIN_TABLES_TO_COPY = [
    # People / Users / System Configs
    "person",
    "users",
    "user_session",
    "system_role_assignment",
    "person_state",
    # Applications and Demonstration Contacts
    "application",
    "demonstration",
    "amendment",
    "extension",
    "demonstration_role_assignment",
    "primary_demonstration_role_assignment",
    # Application-Related Data
    "application_date",
    "application_note",
    "application_phase",
    # Deliverables
    "deliverable",
    "deliverable_extension",
    "deliverable_active_extension",
    "deliverable_action",
    "private_comment",
    "public_comment",
    # Documents
    "document",
    "document_infected",
    "document_pending_upload",
    "budget_neutrality_workbook",
    # References
    "reference",
    "reference_agreement",
    "reference_configuration",
    "reference_agreement_acceptance",
    # Tag-related items
    "tag_name",
    "tag",
    "demonstration_type_tag_assignment",
    "application_tag_assignment",
    "reference_tag_assignment",
    "deliverable_demonstration_type",
    "reference_demonstration_type",
    # UiPath items
    "uipath_result",
    "uipath_value",
    "application_tag_suggestion",
    "application_tag_suggestion_extract",
    # Reports
    "on_demand_report",
]


def _get_table_name_from_history_table_name(history_tbl_name: str) -> str:
    """Validate a history table name and return the table it tracks.

    Args:
        history_tbl_name (str): The history table name.

    Returns:
        str: The table name associated with the history table.

    Raises:
        ValueError: If an invalid name is passed in.
    """
    if history_tbl_name[-8:] != "_history":
        err_msg = f"{history_tbl_name} is not a valid history table name; does not end in _history"
        logger.error(err_msg)
        raise ValueError(err_msg)
    return history_tbl_name[:-8]


def _make_history_trigger_action_configs(action: Literal["disable", "enable"]) -> List[TriggerActionConfiguration]:
    """Make a set of TriggerActionConfigurations to disable or enable the history triggers.

    Args:
        action (Literal["disable", "enable"]): Whether to disable or enable the triggers.

    Returns:
        List[TriggerActionConfiguration]: The requested TriggerActionConfigurations.
    """
    result: List[TriggerActionConfiguration] = []
    for history_tbl in HISTORY_TABLES_TO_COPY:
        main_tbl = _get_table_name_from_history_table_name(history_tbl)
        result.append(TriggerActionConfiguration(action, APP_SCHEMA_NAME, main_tbl, f"log_changes_{main_tbl}"))
    return result


def _make_other_trigger_action_configs(action: Literal["disable", "enable"]) -> List[TriggerActionConfiguration]:
    """Make a set of TriggerActionConfigurations to disable or enable other triggers.

    Args:
        action (Literal["disable", "enable"]): Whether to disable or enable the triggers.

    Returns:
        List[TriggerActionConfiguration]: The requested TriggerActionConfigurations.
    """
    return [
        TriggerActionConfiguration(
            action, APP_SCHEMA_NAME, "application", "create_phases_and_dates_for_new_application"
        ),
        TriggerActionConfiguration(action, APP_SCHEMA_NAME, "deliverable", "trim_input_text_fields"),
        TriggerActionConfiguration(action, APP_SCHEMA_NAME, "document", "trim_input_text_fields"),
        TriggerActionConfiguration(action, APP_SCHEMA_NAME, "private_comment", "trim_input_text_fields"),
        TriggerActionConfiguration(action, APP_SCHEMA_NAME, "public_comment", "trim_input_text_fields"),
        TriggerActionConfiguration(action, APP_SCHEMA_NAME, "reference", "trim_input_text_fields"),
        TriggerActionConfiguration(action, APP_SCHEMA_NAME, "reference_agreement", "trim_input_text_fields"),
    ]


def _make_full_config() -> DataLoadActionList:
    """Make the full config for the app schema copy to localstack.

    Returns:
        DataLoadActionList: The action list for the app schema copy.
    """
    return tuple(
        _make_history_trigger_action_configs("disable")
        + _make_other_trigger_action_configs("disable")
        + _make_history_trigger_action_configs("enable")
        + _make_other_trigger_action_configs("enable")
    )


def main():
    """Main program function."""
    logger.info("Hello, world!")


if __name__ == "__main__":  # pragma: nocover
    main()
