"""Copy the demos_app schema from AWS to localstack for testing and development purposes."""

from logging import getLogger
from typing import List, Tuple

from duckdb_connection_manager import attach_db_to_duckdb_conn, create_duckdb_conn
from load_data_to_demos_app import (
    create_log_execution_message_for_sql,
    generate_arbitrary_action_sql,
    generate_table_insert_sql,
    generate_transaction_action_sql,
    generate_trigger_action_sql,
)
from load_data_to_demos_app_configs import set_migration_mode_on
from logger_utils import config_logger
from types_constants import (
    AppSchemaName,
    ArbitraryActionConfiguration,
    ArbitrarySqlGenerationContext,
    ArbitrarySqlGenerator,
    DataLoadSql,
    DuckDbAttachName,
    TableInsertActionConfiguration,
    TransactionActionConfiguration,
    TriggerActionConfiguration,
    TriggerActionType,
)

logger = config_logger(getLogger(__name__))

REVISION_ID_SEQ_START = 1000000000
MEDICAID_ID_SEQ_START = 30000
CHIP_ID_SEQ_START = 30000
APP_SCHEMA_NAME: AppSchemaName = "demos_app"
LOCALSTACK_ATTACH_NAME: DuckDbAttachName = "ddb_demos_localstack"

HISTORY_TABLES_TO_COPY: Tuple[TableInsertActionConfiguration, ...] = (
    TableInsertActionConfiguration(
        source_table="amendment_history",
        target_table="amendment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "application_type_id",
            "demonstration_id",
            "name",
            "description",
            "effective_date",
            "status_id",
            "status_updated_at",
            "current_phase_id",
            "clearance_level_id",
            "signature_level_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_date_history",
        target_table="application_date_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "application_id",
            "date_type_id",
            "date_value",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_history",
        target_table="application_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "application_type_id",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_note_history",
        target_table="application_note_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "application_id",
            "note_type_id",
            "content",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_phase_history",
        target_table="application_phase_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "application_id",
            "phase_id",
            "phase_status_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_tag_assignment_history",
        target_table="application_tag_assignment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "application_id",
            "tag_name_id",
            "tag_type_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_tag_suggestion_extract_history",
        target_table="application_tag_suggestion_extract_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "uipath_value_id",
            "application_id",
            "field_id",
            "value",
            "start_page_no",
            "end_page_no",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_tag_suggestion_history",
        target_table="application_tag_suggestion_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "application_id",
            "value",
            "status_id",
            "replaced_value",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="budget_neutrality_workbook_history",
        target_table="budget_neutrality_workbook_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "document_type_id",
            "validation_status_id",
            "validation_data",
            "actuals",
            "net_variance_total",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_action_history",
        target_table="deliverable_action_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "action_timestamp",
            "deliverable_id",
            "action_type_id",
            "old_status_id",
            "new_status_id",
            "note",
            "active_extension_id",
            "due_date_change_allowed",
            "should_have_note",
            "should_have_user_id",
            "extension_id_optional",
            "old_due_date",
            "new_due_date",
            "user_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_demonstration_type_history",
        target_table="deliverable_demonstration_type_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "deliverable_id",
            "demonstration_id",
            "demonstration_type_tag_name_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_extension_history",
        target_table="deliverable_extension_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "deliverable_id",
            "status_id",
            "reason_code_id",
            "original_date_requested",
            "final_date_granted",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_history",
        target_table="deliverable_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "deliverable_type_id",
            "name",
            "demonstration_id",
            "demonstration_status_id",
            "status_id",
            "cms_owner_user_id",
            "cms_owner_person_type_id",
            "due_date",
            "due_date_type_id",
            "expected_to_be_submitted",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="demonstration_history",
        target_table="demonstration_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "application_type_id",
            "name",
            "description",
            "effective_date",
            "expiration_date",
            "sdg_division_id",
            "signature_level_id",
            "status_id",
            "status_updated_at",
            "current_phase_id",
            "state_id",
            "clearance_level_id",
            "medicaid_id",
            "chip_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="demonstration_role_assignment_history",
        target_table="demonstration_role_assignment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "person_id",
            "demonstration_id",
            "role_id",
            "state_id",
            "person_type_id",
            "grant_level_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="demonstration_type_tag_assignment_history",
        target_table="demonstration_type_tag_assignment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "demonstration_id",
            "tag_name_id",
            "tag_type_id",
            "effective_date",
            "expiration_date",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="document_history",
        target_table="document_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "name",
            "description",
            "s3_path",
            "owner_user_id",
            "document_type_id",
            "application_id",
            "phase_id",
            "deliverable_id",
            "deliverable_type_id",
            "deliverable_is_cms_attached_file",
            "deliverable_submission_action_id",
            "deliverable_submission_action_type_id",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="document_infected_history",
        target_table="document_infected_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "name",
            "description",
            "s3_path",
            "owner_user_id",
            "document_type_id",
            "application_id",
            "phase_id",
            "deliverable_id",
            "deliverable_type_id",
            "deliverable_is_cms_attached_file",
            "infection_status",
            "infection_threats",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="document_pending_upload_history",
        target_table="document_pending_upload_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "name",
            "description",
            "owner_user_id",
            "document_type_id",
            "application_id",
            "phase_id",
            "deliverable_id",
            "deliverable_type_id",
            "deliverable_is_cms_attached_file",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="extension_history",
        target_table="extension_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "application_type_id",
            "demonstration_id",
            "name",
            "description",
            "effective_date",
            "status_id",
            "status_updated_at",
            "current_phase_id",
            "clearance_level_id",
            "signature_level_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="person_history",
        target_table="person_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "person_type_id",
            "email",
            "first_name",
            "last_name",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="person_state_history",
        target_table="person_state_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "person_id",
            "state_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="primary_demonstration_role_assignment_history",
        target_table="primary_demonstration_role_assignment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "person_id",
            "demonstration_id",
            "role_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="private_comment_history",
        target_table="private_comment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "deliverable_id",
            "author_user_id",
            "author_person_type_id",
            "content",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="public_comment_history",
        target_table="public_comment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "deliverable_id",
            "author_user_id",
            "content",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_agreement_history",
        target_table="reference_agreement_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "name",
            "s3_path",
            "owner_user_id",
            "owner_person_type_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_configuration_history",
        target_table="reference_configuration_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "reference_id",
            "reference_agreement_id",
            "status_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_demonstration_type_history",
        target_table="reference_demonstration_type_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "reference_id",
            "demonstration_type_tag_name_id",
            "demonstration_type_tag_type_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_history",
        target_table="reference_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "name",
            "description",
            "s3_path",
            "owner_user_id",
            "owner_person_type_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_tag_assignment_history",
        target_table="reference_tag_assignment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "reference_id",
            "tag_name_id",
            "tag_type_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="system_role_assignment_history",
        target_table="system_role_assignment_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "person_id",
            "role_id",
            "person_type_id",
            "grant_level_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="tag_history",
        target_table="tag_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "tag_name_id",
            "tag_type_id",
            "source_id",
            "status_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="tag_name_history",
        target_table="tag_name_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="uipath_result_history",
        target_table="uipath_result_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "request_id",
            "response",
            "project_id",
            "document_id",
            "application_id",
            "status_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="uipath_value_history",
        target_table="uipath_value_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "uipath_result_id",
            "document_id",
            "application_id",
            "field_id",
            "value",
            "text_length",
            "text_start_index",
            "confidence",
            "token_list",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="users_history",
        target_table="users_history",
        column_list=[
            "revision_id",
            "revision_type",
            "modified_at",
            "id",
            "person_type_id",
            "cognito_subject",
            "username",
            "is_migrated_from_pmda",
            "has_logged_in",
            "created_at",
            "updated_at",
        ],
    ),
)

MAIN_TABLES_TO_COPY: Tuple[TableInsertActionConfiguration, ...] = (
    # People / Users / System Configs
    TableInsertActionConfiguration(
        source_table="person",
        target_table="person",
        column_list=[
            "id",
            "person_type_id",
            "email",
            "first_name",
            "last_name",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="users",
        target_table="users",
        column_list=[
            "id",
            "person_type_id",
            "cognito_subject",
            "username",
            "is_migrated_from_pmda",
            "has_logged_in",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="user_session",
        target_table="user_session",
        column_list=[
            "user_id",
            "auth_time",
            "last_auth_event_time",
            "auth_event_count",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="system_role_assignment",
        target_table="system_role_assignment",
        column_list=[
            "person_id",
            "role_id",
            "person_type_id",
            "grant_level_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="person_state",
        target_table="person_state",
        column_list=[
            "person_id",
            "state_id",
        ],
    ),
    # Applications and Demonstration Contacts
    TableInsertActionConfiguration(
        source_table="application",
        target_table="application",
        column_list=[
            "id",
            "application_type_id",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="demonstration",
        target_table="demonstration",
        column_list=[
            "id",
            "application_type_id",
            "name",
            "description",
            "effective_date",
            "expiration_date",
            "sdg_division_id",
            "signature_level_id",
            "status_id",
            "status_updated_at",
            "current_phase_id",
            "state_id",
            "clearance_level_id",
            "medicaid_id",
            "chip_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="amendment",
        target_table="amendment",
        column_list=[
            "id",
            "application_type_id",
            "demonstration_id",
            "demonstration_status_id",
            "name",
            "description",
            "effective_date",
            "status_id",
            "status_updated_at",
            "current_phase_id",
            "clearance_level_id",
            "signature_level_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="extension",
        target_table="extension",
        column_list=[
            "id",
            "application_type_id",
            "demonstration_id",
            "demonstration_status_id",
            "name",
            "description",
            "effective_date",
            "status_id",
            "status_updated_at",
            "current_phase_id",
            "clearance_level_id",
            "signature_level_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="demonstration_role_assignment",
        target_table="demonstration_role_assignment",
        column_list=[
            "person_id",
            "demonstration_id",
            "role_id",
            "state_id",
            "person_type_id",
            "grant_level_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="primary_demonstration_role_assignment",
        target_table="primary_demonstration_role_assignment",
        column_list=[
            "person_id",
            "demonstration_id",
            "role_id",
        ],
    ),
    # Application-Related Data
    TableInsertActionConfiguration(
        source_table="application_date",
        target_table="application_date",
        column_list=[
            "application_id",
            "date_type_id",
            "date_value",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_note",
        target_table="application_note",
        column_list=[
            "application_id",
            "note_type_id",
            "content",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_phase",
        target_table="application_phase",
        column_list=[
            "application_id",
            "phase_id",
            "phase_status_id",
            "created_at",
            "updated_at",
        ],
    ),
    # Deliverables
    TableInsertActionConfiguration(
        source_table="deliverable",
        target_table="deliverable",
        column_list=[
            "id",
            "deliverable_type_id",
            "name",
            "demonstration_id",
            "demonstration_status_id",
            "status_id",
            "cms_owner_user_id",
            "cms_owner_person_type_id",
            "due_date",
            "due_date_type_id",
            "expected_to_be_submitted",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_extension",
        target_table="deliverable_extension",
        column_list=[
            "id",
            "deliverable_id",
            "status_id",
            "reason_code_id",
            "original_date_requested",
            "final_date_granted",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_active_extension",
        target_table="deliverable_active_extension",
        column_list=[
            "deliverable_extension_id",
            "deliverable_id",
            "status_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_action",
        target_table="deliverable_action",
        column_list=[
            "id",
            "action_timestamp",
            "deliverable_id",
            "action_type_id",
            "old_status_id",
            "new_status_id",
            "note",
            "active_extension_id",
            "due_date_change_allowed",
            "should_have_note",
            "should_have_user_id",
            "extension_id_optional",
            "old_due_date",
            "new_due_date",
            "user_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="private_comment",
        target_table="private_comment",
        column_list=[
            "id",
            "deliverable_id",
            "author_user_id",
            "author_person_type_id",
            "content",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="public_comment",
        target_table="public_comment",
        column_list=[
            "id",
            "deliverable_id",
            "author_user_id",
            "content",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    # Documents
    TableInsertActionConfiguration(
        source_table="document",
        target_table="document",
        column_list=[
            "id",
            "name",
            "description",
            "s3_path",
            "owner_user_id",
            "document_type_id",
            "application_id",
            "phase_id",
            "deliverable_id",
            "deliverable_type_id",
            "deliverable_is_cms_attached_file",
            "deliverable_submission_action_id",
            "deliverable_submission_action_type_id",
            "created_at",
            "updated_at",
            "is_migrated_from_pmda",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="document_infected",
        target_table="document_infected",
        column_list=[
            "id",
            "name",
            "description",
            "s3_path",
            "owner_user_id",
            "document_type_id",
            "application_id",
            "phase_id",
            "deliverable_id",
            "deliverable_type_id",
            "deliverable_is_cms_attached_file",
            "infection_status",
            "infection_threats",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="document_pending_upload",
        target_table="document_pending_upload",
        column_list=[
            "id",
            "name",
            "description",
            "owner_user_id",
            "document_type_id",
            "application_id",
            "phase_id",
            "deliverable_id",
            "deliverable_type_id",
            "deliverable_is_cms_attached_file",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="budget_neutrality_workbook",
        target_table="budget_neutrality_workbook",
        column_list=[
            "id",
            "document_type_id",
            "validation_status_id",
            "validation_data",
            "actuals",
            "net_variance_total",
            "created_at",
            "updated_at",
        ],
    ),
    # References
    TableInsertActionConfiguration(
        source_table="reference",
        target_table="reference",
        column_list=[
            "id",
            "name",
            "description",
            "s3_path",
            "owner_user_id",
            "owner_person_type_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_agreement",
        target_table="reference_agreement",
        column_list=[
            "id",
            "name",
            "s3_path",
            "owner_user_id",
            "owner_person_type_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_configuration",
        target_table="reference_configuration",
        column_list=[
            "id",
            "reference_id",
            "reference_agreement_id",
            "status_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_agreement_acceptance",
        target_table="reference_agreement_acceptance",
        column_list=[
            "reference_id",
            "reference_agreement_id",
            "user_id",
            "acceptance_timestamp",
        ],
    ),
    # Tag-related items
    TableInsertActionConfiguration(
        source_table="demonstration_type_tag_assignment",
        target_table="demonstration_type_tag_assignment",
        column_list=[
            "demonstration_id",
            "tag_name_id",
            "tag_type_id",
            "effective_date",
            "expiration_date",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_tag_assignment",
        target_table="application_tag_assignment",
        column_list=[
            "application_id",
            "tag_name_id",
            "tag_type_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_tag_assignment",
        target_table="reference_tag_assignment",
        column_list=[
            "reference_id",
            "tag_name_id",
            "tag_type_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="deliverable_demonstration_type",
        target_table="deliverable_demonstration_type",
        column_list=[
            "deliverable_id",
            "demonstration_id",
            "demonstration_type_tag_name_id",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="reference_demonstration_type",
        target_table="reference_demonstration_type",
        column_list=[
            "reference_id",
            "demonstration_type_tag_name_id",
            "demonstration_type_tag_type_id",
        ],
    ),
    # UiPath items
    TableInsertActionConfiguration(
        source_table="uipath_result",
        target_table="uipath_result",
        column_list=[
            "id",
            "request_id",
            "response",
            "project_id",
            "document_id",
            "application_id",
            "status_id",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="uipath_value",
        target_table="uipath_value",
        column_list=[
            "id",
            "uipath_result_id",
            "document_id",
            "application_id",
            "field_id",
            "value",
            "text_length",
            "text_start_index",
            "confidence",
            "token_list",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_tag_suggestion",
        target_table="application_tag_suggestion",
        column_list=[
            "application_id",
            "value",
            "status_id",
            "replaced_value",
            "created_at",
            "updated_at",
        ],
    ),
    TableInsertActionConfiguration(
        source_table="application_tag_suggestion_extract",
        target_table="application_tag_suggestion_extract",
        column_list=[
            "uipath_value_id",
            "application_id",
            "field_id",
            "value",
            "start_page_no",
            "end_page_no",
            "created_at",
            "updated_at",
        ],
    ),
    # Reports
    TableInsertActionConfiguration(
        source_table="on_demand_report",
        target_table="on_demand_report",
        column_list=[
            "id",
            "s3_path",
            "generated_file_name",
            "requesting_user_id",
            "report_type_id",
            "status_id",
            "report_generated_at",
        ],
    ),
)


# Adding ArbitrarySqlGenerators to manually upsert the tag / tag_name tables
# This will run before the main copies
def _upsert_tag_name_sql(generation_context: ArbitrarySqlGenerationContext) -> str:  # pragma: nocover
    """Arbitrary upsert SQL for tag_name table.

    Args:
        generation_context (ArbitrarySqlGenerationContext): Required context, not used in this query.

    Returns:
        str: The query.
    """
    upsert_query = """
        INSERT INTO
            ddb_demos_localstack.demos_app.tag_name
            (id, created_at, updated_at)
        SELECT
            id, created_at, updated_at
        FROM
            ddb_demos_aws.demos_app.tag_name
        ON CONFLICT (id) DO UPDATE SET
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at;
    """
    return upsert_query


def _upsert_tag_sql(generation_context: ArbitrarySqlGenerationContext) -> str:  # pragma: nocover
    """Arbitrary upsert SQL for tag table.

    Args:
        generation_context (ArbitrarySqlGenerationContext): Required context, not used in this query.

    Returns:
        str: The query.
    """
    upsert_query = """
        INSERT INTO
            ddb_demos_localstack.demos_app.tag
            (tag_name_id, tag_type_id, source_id, status_id, created_at, updated_at)
        SELECT
            tag_name_id, tag_type_id, source_id, status_id, created_at, updated_at
        FROM
            ddb_demos_aws.demos_app.tag
        ON CONFLICT (tag_name_id, tag_type_id) DO UPDATE SET
            source_id = EXCLUDED.source_id,
            status_id = EXCLUDED.status_id,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at;
    """
    return upsert_query


TAG_UPSERTS: Tuple[ArbitraryActionConfiguration, ...] = (
    ArbitraryActionConfiguration(action_name="Upsert tag_name table", sql_generator=_upsert_tag_name_sql),
    ArbitraryActionConfiguration(action_name="Upsert tag table", sql_generator=_upsert_tag_sql),
)


def _validate_history_table_name(history_tbl_name: str) -> None:
    """Validate a history table name.

    Args:
        history_tbl_name (str): The history table name.

    Raises:
        ValueError: If an invalid name is passed in.
    """
    if history_tbl_name[-8:] != "_history":
        err_msg = f"{history_tbl_name} is not a valid history table name; does not end in _history"
        logger.error(err_msg)
        raise ValueError(err_msg)


def _get_table_name_from_history_table_name(history_tbl_name: str) -> str:
    """Validate a history table name and return the table it tracks.

    Args:
        history_tbl_name (str): The history table name.

    Returns:
        str: The table name associated with the history table.
    """
    _validate_history_table_name(history_tbl_name)
    return history_tbl_name[:-8]


def _make_history_trigger_action_configs(action_type: TriggerActionType) -> Tuple[TriggerActionConfiguration, ...]:
    """Make a set of TriggerActionConfigurations to disable or enable the history triggers.

    Args:
        action_type (TriggerActionType): Whether to disable or enable the triggers.

    Returns:
        Tuple[TriggerActionConfiguration, ...]: The requested TriggerActionConfigurations.
    """
    results: List[TriggerActionConfiguration] = []
    for history_tbl in HISTORY_TABLES_TO_COPY:
        main_tbl = _get_table_name_from_history_table_name(history_tbl.target_table)
        results.append(TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, main_tbl, f"log_changes_{main_tbl}"))
    return tuple(results)


def _make_other_trigger_action_configs(action_type: TriggerActionType) -> Tuple[TriggerActionConfiguration, ...]:
    """Make a set of TriggerActionConfigurations to disable or enable other triggers.

    Args:
        action_type (TriggerActionType): Whether to disable or enable the triggers.

    Returns:
        Tuple[TriggerActionConfiguration, ...]: The requested TriggerActionConfigurations.
    """
    return (
        TriggerActionConfiguration(
            action_type,
            APP_SCHEMA_NAME,
            "person",
            "assign_cms_user_to_all_states",
        ),
        TriggerActionConfiguration(
            action_type,
            APP_SCHEMA_NAME,
            "application",
            "create_phases_and_dates_for_new_application",
        ),
        TriggerActionConfiguration(
            action_type,
            APP_SCHEMA_NAME,
            "deliverable_action",
            "capture_active_extension_request_id_for_action",
        ),
        TriggerActionConfiguration(
            action_type,
            APP_SCHEMA_NAME,
            "deliverable_action",
            "update_documents_in_submission",
        ),
        TriggerActionConfiguration(
            action_type,
            APP_SCHEMA_NAME,
            "deliverable_extension",
            "create_or_update_active_record_for_request",
        ),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "amendment", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "application_note", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "deliverable", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "deliverable_action", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "demonstration", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "document", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "document_infected", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "document_pending_upload", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "extension", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "private_comment", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "public_comment", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "reference", "trim_input_text_fields"),
        TriggerActionConfiguration(action_type, APP_SCHEMA_NAME, "reference_agreement", "trim_input_text_fields"),
    )


# ArbitrarySqlGenerators used to set up local sequences to not conflict with production data
def _create_history_revision_seq_resetter(history_tbl_name: str) -> ArbitrarySqlGenerator:
    """Create an ArbitrarySqlGenerator to set a history table sequence to a specific start.

    Args:
        history_tbl_name (str): A history table name.

    Returns:
        ArbitrarySqlGenerator: An ArbitrarySqlGenerator for use in resetting the revision ID sequence.
    """
    _validate_history_table_name(history_tbl_name)

    def reset_sequence_number(generation_context: ArbitrarySqlGenerationContext) -> str:
        query = (
            f"SELECT setval(pg_get_serial_sequence('demos_app.{history_tbl_name}', 'revision_id'),"
            f" {REVISION_ID_SEQ_START});"
        )
        return f"CALL postgres_execute('{generation_context.attach_name}', $${query}$$);"

    return reset_sequence_number


def _reset_medicaid_id_sequence(generation_context: ArbitrarySqlGenerationContext) -> str:  # pragma: nocover
    """Arbitrary reset SQL for the demos_app.medicaid_id_number_seq sequence.

    Args:
        generation_context (ArbitrarySqlGenerationContext): Generation context.

    Returns:
        str: The query.
    """
    query = f"SELECT setval(pg_get_serial_sequence('demos_app.demonstration', 'medicaid_id'), {MEDICAID_ID_SEQ_START});"
    return f"CALL postgres_execute('{generation_context.attach_name}', $${query}$$);"


def _reset_chip_id_sequence(generation_context: ArbitrarySqlGenerationContext) -> str:  # pragma: nocover
    """Arbitrary reset SQL for the demos_app.chip_id_number_seq sequence.

    Args:
        generation_context (ArbitrarySqlGenerationContext): Generation context.

    Returns:
        str: The query.
    """
    query = f"SELECT setval(pg_get_serial_sequence('demos_app.demonstration', 'chip_id'), {CHIP_ID_SEQ_START});"
    return f"CALL postgres_execute('{generation_context.attach_name}', $${query}$$);"


SEQUENCE_RESETS: Tuple[ArbitraryActionConfiguration, ...] = (
    ArbitraryActionConfiguration(
        action_name="Reset medicaid_id sequence number",
        sql_generator=_reset_medicaid_id_sequence,
    ),
    ArbitraryActionConfiguration(
        action_name="Reset chip_id sequence number",
        sql_generator=_reset_chip_id_sequence,
    ),
    *(
        ArbitraryActionConfiguration(
            action_name=f"Reset {config.target_table} revision_id sequence",
            sql_generator=_create_history_revision_seq_resetter(
                history_tbl_name=config.target_table,
            ),
        )
        for config in HISTORY_TABLES_TO_COPY
    ),
)


def _make_sql() -> DataLoadSql:
    """Make the SQL for the app schema copy to localstack.

    Returns:
        DataLoadSql: The data load SQL to be run.
    """
    sql_to_run: DataLoadSql = []
    # Disable triggers
    sql_to_run.extend(
        [
            generate_trigger_action_sql(attach_name="ddb_demos_localstack", trigger_config=config)
            for config in _make_history_trigger_action_configs(action_type="disable")
        ]
    )
    sql_to_run.extend(
        [
            generate_trigger_action_sql(attach_name="ddb_demos_localstack", trigger_config=config)
            for config in _make_other_trigger_action_configs(action_type="disable")
        ]
    )

    # Open a transaction to do data loading because of how our database works - there are deferred constraints
    # Set the migration mode on inside the transaction; SET LOCAL is transaction scoped
    sql_to_run.extend(
        [generate_transaction_action_sql(transact_config=TransactionActionConfiguration(action_type="begin"))]
    )
    sql_to_run.extend(
        [
            generate_arbitrary_action_sql(
                attach_name="ddb_demos_localstack",
                arbitrary_action_config=ArbitraryActionConfiguration(
                    action_name="Set migration_mode to 'on'",
                    sql_generator=set_migration_mode_on,
                ),
            )
        ]
    )
    sql_to_run.extend(
        [
            generate_arbitrary_action_sql(attach_name="ddb_demos_localstack", arbitrary_action_config=config)
            for config in TAG_UPSERTS
        ]
    )
    sql_to_run.extend(
        [
            generate_table_insert_sql(
                source_schema="demos_app",
                target_schema="demos_app",
                source_attach_name="ddb_demos_aws",
                target_attach_name="ddb_demos_localstack",
                insert_config=config,
            )
            for config in MAIN_TABLES_TO_COPY
        ]
    )
    sql_to_run.extend(
        [
            generate_table_insert_sql(
                source_schema="demos_app",
                target_schema="demos_app",
                source_attach_name="ddb_demos_aws",
                target_attach_name="ddb_demos_localstack",
                insert_config=config,
            )
            for config in HISTORY_TABLES_TO_COPY
        ]
    )
    sql_to_run.extend(
        [generate_transaction_action_sql(transact_config=TransactionActionConfiguration(action_type="commit"))]
    )

    # Reset the sequences
    sql_to_run.extend(
        [
            generate_arbitrary_action_sql(attach_name="ddb_demos_localstack", arbitrary_action_config=config)
            for config in SEQUENCE_RESETS
        ]
    )

    # Turn the triggers back on
    sql_to_run.extend(
        [
            generate_trigger_action_sql(attach_name="ddb_demos_localstack", trigger_config=config)
            for config in _make_history_trigger_action_configs(action_type="enable")
        ]
    )
    sql_to_run.extend(
        [
            generate_trigger_action_sql(attach_name="ddb_demos_localstack", trigger_config=config)
            for config in _make_other_trigger_action_configs(action_type="enable")
        ]
    )
    return sql_to_run


def main():
    """Main program function."""
    sql_to_run = _make_sql()
    conn = attach_db_to_duckdb_conn(attach_db_to_duckdb_conn(create_duckdb_conn(), "demos-aws"), "demos-localstack")
    for query in sql_to_run:
        logger.info(create_log_execution_message_for_sql(query))
        conn.execute(query.sql_query)


if __name__ == "__main__":  # pragma: nocover
    main()
