import { quoteLiteral } from "./parquet/typeMap";
import type { ExportViewDefinition, RelationColumn, RelationSchema } from "./types";

type ReportField = RelationColumn & {
  expression: string;
  dateType?: string;
  documentType?: string;
};

function overviewField(name: string, expression: string): ReportField {
  return { name, expression, duckdbType: "VARCHAR" };
}

function applicationField(name: string, expression: string): ReportField {
  return { name, expression, duckdbType: "VARCHAR" };
}

function applicationDate(name: string, dateType: string): ReportField {
  return {
    ...applicationField(name, `coalesce(app_date.${name}, '-')`),
    dateType,
  };
}

function documentDate(name: string, documentType: string): ReportField {
  return {
    ...applicationField(name, `coalesce(doc_dates.${name}, '-')`),
    documentType,
  };
}

const overviewFields: readonly ReportField[] = [
  overviewField("state_territory", "demo_state.name"),
  overviewField("demonstration_title", "demo.name"),
  overviewField("demonstration_number", "demo.medicaid_id"),
  overviewField("chip_id", "CASE WHEN demo_type.demonstration_id IS NOT NULL THEN demo.chip_id ELSE '-' END"),
  overviewField("status", "demo.status_id"),
  overviewField("status_update_date", "to_char(demo.status_updated_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
  overviewField("sdg_division", "coalesce(demo.sdg_division_id, '-')"),
  overviewField("signature_level", "coalesce(demo.signature_level_id, '-')"),
  overviewField("effective_date", "coalesce(to_char(demo.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  overviewField("expiration_date", "coalesce(to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  overviewField("renewal_in_progress", "coalesce(active_extensions.extension_in_progress, 'No')"),
  overviewField("amendment_in_progress", "coalesce(active_approved_amendments.amendment_in_progress, 'No')"),
  {
    name: "approved_amendment_applications", expression: "coalesce(active_approved_amendments.approved_amendment_applications::INT, 0)",
    duckdbType: "INTEGER",
  },
  overviewField("primary_project_officer", "primary_project_officer.full_name"),
  overviewField("project_officers", "coalesce(project_officers.people_assigned, '-')"),
  overviewField("primary_policy_tech_director", "coalesce(primary_policy_tech_director.full_name, '-')"),
  overviewField("primary_monitoring_and_evaluation_analyst", "coalesce(primary_monitoring_and_evaluation_analyst.full_name, '-')"),
  overviewField("monitoring_and_evaluation_analysts", "coalesce(monitoring_and_evaluation_analysts.people_assigned, '-')"),
  overviewField("primary_state_poc", "coalesce(primary_state_poc.full_name, '-')"),
  overviewField("state_pocs", "coalesce(state_pocs.people_assigned, '-')"),
  overviewField("primary_monitoring_evaluation_tech_director", "coalesce(primary_monitoring_evaluation_tech_director.full_name, '-')"),
  overviewField("application_approval_date", "coalesce(to_char(app_date.date_value AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
];

const applicationFields: readonly ReportField[] = [
  applicationField("state", "demo_state.name"),
  applicationField("application_type", "CASE WHEN app.application_type_id = 'Extension' THEN 'Renewal' ELSE app.application_type_id END"),
  applicationField("application_title", "app.application_title"),
  applicationField("demonstration_number", "demo.medicaid_id"),
  applicationField("chip_id", "CASE WHEN demo_type.demonstration_id IS NOT NULL THEN demo.chip_id ELSE '-' END"),
  applicationField("primary_project_officer", "primary_project_officer.full_name"),
  applicationField("status", "app.status"),
  applicationField("sdg_division", "coalesce(demo.sdg_division_id, '-')"),
  applicationField("signature_level", "coalesce(app.signature_level, '-')"),
  applicationField("effective_date", "coalesce(to_char(app.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  applicationField("expiration_date", "coalesce(to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  applicationDate("concept_start_date", "Concept Start Date"),
  applicationDate("concept_paper_submitted_date", "Concept Paper Submitted Date"),
  applicationDate("concept_skipped_date", "Concept Skipped Date"),
  applicationDate("concept_completion_date", "Concept Completion Date"),
  applicationDate("application_intake_start_date", "Application Intake Start Date"),
  applicationDate("state_application_submitted_date", "State Application Submitted Date"),
  applicationDate("completeness_review_due_date", "Completeness Review Due Date"),
  applicationDate("application_intake_completion_date", "Application Intake Completion Date"),
  applicationDate("completeness_start_date", "Completeness Start Date"),
  applicationDate("state_application_deemed_complete", "State Application Deemed Complete"),
  applicationDate("completeness_completion_date", "Completeness Completion Date"),
  applicationDate("federal_comment_period_start_date", "Federal Comment Period Start Date"),
  applicationDate("federal_comment_period_end_date", "Federal Comment Period End Date"),
  documentDate("federal_comment_internal_analysis_document_submitted_date", "Federal Comment Internal Analysis Document"),
  applicationDate("sdg_preparation_start_date", "SDG Preparation Start Date"),
  applicationDate("internal_expected_approval_date", "Internal Expected Approval Date"),
  applicationDate("state_requested_approval_date", "State Requested Approval Date"),
  applicationDate("sme_initial_review_date", "SME Initial Review Date"),
  applicationDate("frt_initial_meeting_date", "FRT Initial Meeting Date"),
  applicationDate("bnpmt_initial_meeting_date", "BNPMT Initial Meeting Date"),
  applicationDate("sdg_preparation_completion_date", "SDG Preparation Completion Date"),
  applicationDate("review_start_date", "Review Start Date"),
  applicationDate("ogd_approval_to_share_with_smes", "OGD Approval to Share with SMEs"),
  applicationDate("draft_approval_package_to_prep", "Draft Approval Package to Prep"),
  applicationDate("ddme_approval_received", "DDME Approval Received"),
  applicationDate("state_concurrence", "State Concurrence"),
  applicationDate("bn_pmt_approval_to_send_to_omb", "BN PMT Approval to Send to OMB"),
  applicationDate("draft_approval_package_shared", "Draft Approval Package Shared"),
  applicationDate("receive_omb_concurrence", "Receive OMB Concurrence"),
  applicationDate("receive_ogc_legal_clearance", "Receive OGC Legal Clearance"),
  applicationField("clearance_level_comms_or_osora", "app.clearance_level_comms_or_osora"),
  applicationDate("package_sent_for_comms_clearance", "Package Sent for COMMs Clearance"),
  applicationDate("comms_clearance_received", "COMMs Clearance Received"),
  applicationField("comms_clearance_notes", "coalesce(app_notes.comms_clearance_notes, '-')"),
  applicationDate("submit_approval_package_to_osora", "Submit Approval Package to OSORA"),
  applicationDate("osora_r1_comments_due", "OSORA R1 Comments Due"),
  applicationDate("osora_r2_comments_due", "OSORA R2 Comments Due"),
  applicationDate("cms_osora_clearance_end", "CMS (OSORA) Clearance End"),
  applicationField("osora_clearance_notes", "coalesce(app_notes.osora_clearance_notes, '-')"),
  applicationDate("review_completion_date", "Review Completion Date"),
  applicationDate("approval_package_start_date", "Approval Package Start Date"),
  documentDate("final_bn_formulation_workbook_uploaded_date", "Final Budget Neutrality Formulation Workbook"),
  documentDate("q_and_a_file_uploaded_date", "Q&A"),
  documentDate("special_terms_and_conditions_file_uploaded_date", "Special Terms & Conditions"),
  documentDate("formal_omb_policy_concurrent_email_uploaded_date", "Formal OMB Policy Concurrence Email"),
  documentDate("approval_letter_uploaded_date", "Approval Letter"),
  documentDate("signed_decision_memo_uploaded_date", "Signed Decision Memo"),
  applicationDate("approval_package_completion_date", "Approval Package Completion Date"),
  applicationDate("approval_summary_start_date", "Approval Summary Start Date"),
  applicationDate("application_details_marked_complete_date", "Application Details Marked Complete Date"),
  applicationDate("application_demonstration_types_marked_complete_date", "Application Demonstration Types Marked Complete Date"),
  applicationDate("approval_summary_completion_date", "Approval Summary Completion Date"),
];

function deliverableField(name: string, expression: string): ReportField {
  return { name, expression, duckdbType: "VARCHAR" };
}

function demonstrationTypeField(name: string, expression: string): ReportField {
  return { name, expression, duckdbType: "VARCHAR" };
}

const deliverableFields: readonly ReportField[] = [
  deliverableField("state", "demo_state.name"),
  deliverableField("demonstration_title", "demo.name"),
  deliverableField("demonstration_number", "demo.medicaid_id"),
  deliverableField("effective_date", "to_char(demo.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
  deliverableField("expiration_date", "to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
  deliverableField("primary_project_officer", "primary_project_officer.full_name"),
  deliverableField("monitoring_and_evaluation_analyst", "coalesce(primary_monitoring_and_evaluation_analyst.full_name, '-')"),
  deliverableField("deliverable_type", "deliv.deliverable_type_id"),
  deliverableField("deliverable_name", "deliv.name"),
  deliverableField("demonstration_types", "coalesce(demo_types.demonstration_types, '-')"),
  deliverableField("cms_owner", "cms_owner.first_name || ' ' || cms_owner.last_name"),
  deliverableField("due_date", "to_char(deliv.due_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
  deliverableField("submission_date", "coalesce(to_char(act_stats.most_recent_submission_timestamp AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  deliverableField("extension_request_pending", "coalesce(current_extensions.extension_request_pending, 'No')"),
  deliverableField("extension_date_requested", "coalesce(to_char(current_extensions.original_date_requested AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  deliverableField("reason_for_extension", "coalesce(current_extensions.reason_code_id, '-')"),
  deliverableField("extension_request_comments", "coalesce(current_extensions.note, '-')"),
  { ...deliverableField("total_extensions_requested", "act_stats.n_requested_extensions"), duckdbType: "INTEGER" },
  deliverableField("resubmission_due_date", "coalesce(to_char(most_recent_resub_reqs.new_due_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  deliverableField("resubmission_request_comments", "coalesce(most_recent_resub_reqs.note, '-')"),
  { ...deliverableField("total_resubmissions_requested", "act_stats.n_requested_resubmissions"), duckdbType: "INTEGER" },
  deliverableField("deliverable_status", "deliv.status_id"),
  deliverableField("last_deliverable_action", "act_stats.most_recent_action_type"),
  deliverableField("last_deliverable_action_date", "to_char(act_stats.most_recent_action_timestamp AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
  deliverableField("updated_post_acceptance", "coalesce(most_recent_public_comment.updated_post_acceptance, 'No')"),
  deliverableField("deliverable_reviewer", "coalesce(most_recent_review_start.full_name, '-')"),
  deliverableField("deliverable_review_date", "coalesce(to_char(most_recent_review_start.action_timestamp AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  deliverableField("budget_neutrality_variance", "coalesce(most_recent_valid_bn_data.net_variance_total::TEXT, '-')"),
  deliverableField("actuals", "coalesce(most_recent_valid_bn_data.actuals, '-')"),
  deliverableField("public_comments", "left(coalesce(aggregate_public_comments.comment_value, '-'), 32000)"),
  deliverableField("private_comments", "left(coalesce(aggregate_private_comments.comment_value, '-'), 32000)"),
];

const demonstrationTypeFields: readonly ReportField[] = [
  demonstrationTypeField("state_territory", "demo_state.name"),
  demonstrationTypeField("demonstration_title", "demo.name"),
  demonstrationTypeField("demonstration_number", "demo.medicaid_id"),
  demonstrationTypeField("chip_id", "coalesce(max(CASE WHEN demo_type.tag_name_id = 'Children''s Health Insurance Program (CHIP)' THEN demo.chip_id END) OVER (PARTITION BY demo_type.demonstration_id), '-')"),
  demonstrationTypeField("status", "demo.status_id"),
  demonstrationTypeField("status_update_date", "to_char(demo.status_updated_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
  demonstrationTypeField("demonstration_effective_date", "coalesce(to_char(demo.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  demonstrationTypeField("demonstration_expiration_date", "coalesce(to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  demonstrationTypeField("primary_project_officer", "primary_project_officer.full_name"),
  demonstrationTypeField("primary_state_poc", "coalesce(primary_state_poc.full_name, '-')"),
  demonstrationTypeField("application_approval_date", "coalesce(to_char(app_date.date_value AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')"),
  demonstrationTypeField("demonstration_type", "demo_type.tag_name_id"),
  demonstrationTypeField("demonstration_type_effective_date", "to_char(demo_type.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
  demonstrationTypeField("demonstration_type_expiration_date", "to_char(demo_type.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')"),
];

function projection(fields: readonly ReportField[]): string {
  return fields.map((field) => `        ${field.expression} AS ${field.name}`).join(",\n");
}

function relationSchema(fields: readonly ReportField[]): RelationSchema {
  return { columns: fields.map(({ name, duckdbType }) => ({ name, duckdbType })) };
}

/** One pivoted date column: the latest `valueColumn` whose `typeColumn` equals `label`, as MM/DD/YYYY. */
export function latestLabelledDate(name: string, typeColumn: string, label: string, valueColumn: string): string {
  return `        to_char(max(CASE WHEN ${typeColumn} = ${quoteLiteral(label)} THEN ${valueColumn} END) ` +
    `AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS ${name}`;
}

// All field and pivot mappings are fixed locally, not imported from the live reports.
// Only the report's current application-date fields are pivoted; no temp table or lookup-table scan.
const demonstrationReportingQuery = `
WITH active_extensions AS (
    SELECT demonstration_id, 'Yes' AS extension_in_progress
    FROM demos_app.extension
    WHERE status_id IN ('Pre-Submission', 'Under Review', 'On-hold')
    GROUP BY demonstration_id
),
active_approved_amendments AS (
    SELECT demonstration_id,
        CASE WHEN max(CASE WHEN status_id IN ('Pre-Submission', 'Under Review', 'On-hold') THEN 1 ELSE 0 END) = 1
            THEN 'Yes' ELSE 'No' END AS amendment_in_progress,
        sum(CASE WHEN status_id = 'Approved' THEN 1 ELSE 0 END) AS approved_amendment_applications
    FROM demos_app.amendment
    GROUP BY demonstration_id
),
role_assignments AS (
    SELECT p.first_name || ' ' || p.last_name AS full_name,
        dra.demonstration_id, dra.role_id, prda.person_id IS NOT NULL AS is_primary
    FROM demos_app.demonstration_role_assignment AS dra
    LEFT JOIN demos_app.primary_demonstration_role_assignment AS prda
        ON dra.person_id = prda.person_id
        AND dra.demonstration_id = prda.demonstration_id AND dra.role_id = prda.role_id
    INNER JOIN demos_app.person AS p ON dra.person_id = p.id
),
flattened_role_assignments AS (
    SELECT demonstration_id, role_id, string_agg(full_name, ', ' ORDER BY full_name) AS people_assigned
    FROM role_assignments
    WHERE NOT is_primary
    GROUP BY demonstration_id, role_id
),
overview AS (
    SELECT demo.id AS demonstration_id,
${projection(overviewFields)}
    FROM demos_app.demonstration AS demo
    INNER JOIN demos_app.state AS demo_state ON demo.state_id = demo_state.id
    LEFT JOIN demos_app.demonstration_type_tag_assignment AS demo_type
        ON demo.id = demo_type.demonstration_id
        AND demo_type.tag_name_id = 'Children''s Health Insurance Program (CHIP)'
    LEFT JOIN active_extensions ON demo.id = active_extensions.demonstration_id
    LEFT JOIN active_approved_amendments ON demo.id = active_approved_amendments.demonstration_id
    INNER JOIN role_assignments AS primary_project_officer
        ON demo.id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer' AND primary_project_officer.is_primary
    LEFT JOIN flattened_role_assignments AS project_officers
        ON demo.id = project_officers.demonstration_id AND project_officers.role_id = 'Project Officer'
    LEFT JOIN role_assignments AS primary_policy_tech_director
        ON demo.id = primary_policy_tech_director.demonstration_id
        AND primary_policy_tech_director.role_id = 'Policy Technical Director' AND primary_policy_tech_director.is_primary
    LEFT JOIN role_assignments AS primary_monitoring_and_evaluation_analyst
        ON demo.id = primary_monitoring_and_evaluation_analyst.demonstration_id
        AND primary_monitoring_and_evaluation_analyst.role_id = 'Monitoring & Evaluation Analyst' AND primary_monitoring_and_evaluation_analyst.is_primary
    LEFT JOIN flattened_role_assignments AS monitoring_and_evaluation_analysts
        ON demo.id = monitoring_and_evaluation_analysts.demonstration_id AND monitoring_and_evaluation_analysts.role_id = 'Monitoring & Evaluation Analyst'
    LEFT JOIN role_assignments AS primary_state_poc
        ON demo.id = primary_state_poc.demonstration_id
        AND primary_state_poc.role_id = 'State Point of Contact' AND primary_state_poc.is_primary
    LEFT JOIN flattened_role_assignments AS state_pocs
        ON demo.id = state_pocs.demonstration_id AND state_pocs.role_id = 'State Point of Contact'
    LEFT JOIN role_assignments AS primary_monitoring_evaluation_tech_director
        ON demo.id = primary_monitoring_evaluation_tech_director.demonstration_id
        AND primary_monitoring_evaluation_tech_director.role_id = 'Monitoring & Evaluation Technical Director'
        AND primary_monitoring_evaluation_tech_director.is_primary
    -- At most one row: application_date's primary key is (application_id, date_type_id).
    LEFT JOIN demos_app.application_date AS app_date
        ON demo.id = app_date.application_id AND app_date.date_type_id = 'Application Approval Date'
),
applications_and_parents AS (
    SELECT app.id, app.application_type_id,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.id WHEN 'Amendment' THEN amd.demonstration_id
            WHEN 'Extension' THEN ext.demonstration_id END AS parent_demonstration_id,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.name WHEN 'Amendment' THEN amd.name
            WHEN 'Extension' THEN ext.name END AS application_title,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.status_id WHEN 'Amendment' THEN amd.status_id
            WHEN 'Extension' THEN ext.status_id END AS status,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.signature_level_id WHEN 'Amendment' THEN amd.signature_level_id
            WHEN 'Extension' THEN ext.signature_level_id END AS signature_level,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.effective_date WHEN 'Amendment' THEN amd.effective_date
            WHEN 'Extension' THEN ext.effective_date END AS effective_date,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.clearance_level_id WHEN 'Amendment' THEN amd.clearance_level_id
            WHEN 'Extension' THEN ext.clearance_level_id END AS clearance_level_comms_or_osora
    FROM demos_app.application AS app
    LEFT JOIN demos_app.demonstration AS demo ON app.id = demo.id
    LEFT JOIN demos_app.amendment AS amd ON app.id = amd.id
    LEFT JOIN demos_app.extension AS ext ON app.id = ext.id
),
primary_roles AS (
    SELECT p.first_name || ' ' || p.last_name AS full_name, pdra.demonstration_id, pdra.role_id
    FROM demos_app.primary_demonstration_role_assignment AS pdra
    INNER JOIN demos_app.person AS p ON pdra.person_id = p.id
),
pivoted_application_dates AS (
    SELECT application_id,
${applicationFields.filter((field) => field.dateType)
  .map((field) => latestLabelledDate(field.name, "date_type_id", field.dateType!, "date_value")).join(",\n")}
    FROM demos_app.application_date
    GROUP BY application_id
),
doc_dates AS (
    SELECT application_id,
${applicationFields.filter((field) => field.documentType)
  .map((field) => latestLabelledDate(field.name, "document_type_id", field.documentType!, "created_at")).join(",\n")}
    FROM demos_app.document
    GROUP BY application_id
),
app_notes AS (
    SELECT application_id,
        max(CASE WHEN note_type_id = 'COMMs Clearance' THEN content END) AS comms_clearance_notes,
        max(CASE WHEN note_type_id = 'CMS (OSORA) Clearance' THEN content END) AS osora_clearance_notes
    FROM demos_app.application_note
    GROUP BY application_id
),
application_details AS (
    SELECT app.id AS source_application_id, app.parent_demonstration_id, row_to_json(report_fields) AS data
    FROM applications_and_parents AS app
    INNER JOIN demos_app.demonstration AS demo ON app.parent_demonstration_id = demo.id
    INNER JOIN demos_app.state AS demo_state ON demo.state_id = demo_state.id
    LEFT JOIN demos_app.demonstration_type_tag_assignment AS demo_type
        ON app.parent_demonstration_id = demo_type.demonstration_id
        AND demo_type.tag_name_id = 'Children''s Health Insurance Program (CHIP)'
    INNER JOIN primary_roles AS primary_project_officer
        ON app.parent_demonstration_id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer'
    LEFT JOIN pivoted_application_dates AS app_date ON app.id = app_date.application_id
    LEFT JOIN doc_dates ON app.id = doc_dates.application_id
    LEFT JOIN app_notes ON app.id = app_notes.application_id
    CROSS JOIN LATERAL (
        SELECT
${projection(applicationFields)}
    ) AS report_fields
),
application_aggregates AS (
    SELECT parent_demonstration_id, json_agg(data ORDER BY source_application_id) AS applications
    FROM application_details
    GROUP BY parent_demonstration_id
),
flat_demonstration_types AS (
    SELECT deliverable_id,
        string_agg(demonstration_type_tag_name_id, ', ' ORDER BY demonstration_type_tag_name_id) AS demonstration_types
    FROM demos_app.deliverable_demonstration_type
    GROUP BY deliverable_id
),
action_statistics AS (
    SELECT DISTINCT deliverable_id,
        max(CASE WHEN action_type_id = 'Submitted Deliverable' THEN action_timestamp END)
            OVER (PARTITION BY deliverable_id) AS most_recent_submission_timestamp,
        max(CASE WHEN action_type_id = 'Requested Resubmission' THEN action_timestamp END)
            OVER (PARTITION BY deliverable_id) AS most_recent_resubmission_request_timestamp,
        max(CASE WHEN action_type_id IN ('Accepted Deliverable', 'Approved Deliverable', 'Received and Filed Deliverable')
            THEN action_timestamp END) OVER (PARTITION BY deliverable_id) AS most_recent_finalization_timestamp,
        sum(CASE WHEN action_type_id = 'Requested Extension' THEN 1 ELSE 0 END)
            OVER (PARTITION BY deliverable_id)::INT AS n_requested_extensions,
        sum(CASE WHEN action_type_id = 'Requested Resubmission' THEN 1 ELSE 0 END)
            OVER (PARTITION BY deliverable_id)::INT AS n_requested_resubmissions,
        max(action_timestamp) OVER (PARTITION BY deliverable_id) AS most_recent_action_timestamp,
        first_value(action_type_id) OVER (PARTITION BY deliverable_id ORDER BY action_timestamp DESC)
            AS most_recent_action_type
    FROM demos_app.deliverable_action
),
-- At most one row per deliverable: deliverable_active_extension is unique on deliverable_id, so only
-- one extension can be Requested at a time.
current_extensions AS (
    SELECT 'Yes' AS extension_request_pending, de.deliverable_id,
        de.original_date_requested, de.reason_code_id, da.note
    FROM demos_app.deliverable_extension AS de
    INNER JOIN demos_app.deliverable_action AS da
        ON de.id = da.active_extension_id AND da.action_type_id = 'Requested Extension' AND de.status_id = 'Requested'
),
most_recent_resub_reqs AS (
    SELECT DISTINCT deliverable_id,
        first_value(note) OVER (PARTITION BY deliverable_id ORDER BY action_timestamp DESC) AS note,
        first_value(new_due_date) OVER (PARTITION BY deliverable_id ORDER BY action_timestamp DESC) AS new_due_date
    FROM demos_app.deliverable_action
    WHERE action_type_id = 'Requested Resubmission'
),
most_recent_public_comment AS (
    SELECT deliverable_id, 'Yes' AS updated_post_acceptance, max(created_at) AS created_at
    FROM demos_app.public_comment
    GROUP BY deliverable_id
),
most_recent_review_start AS (
    SELECT DISTINCT da.deliverable_id,
        first_value(p.first_name || ' ' || p.last_name)
            OVER (PARTITION BY da.deliverable_id ORDER BY da.action_timestamp DESC) AS full_name,
        max(da.action_timestamp) OVER (PARTITION BY da.deliverable_id) AS action_timestamp
    FROM demos_app.deliverable_action AS da
    INNER JOIN demos_app.person AS p ON da.user_id = p.id AND da.action_type_id = 'Started Review'
),
-- Selects and partitions by the same column, so DISTINCT leaves one row per deliverable even if a
-- document and its submission action disagree on deliverable_id (no constraint ties them together).
most_recent_valid_bn_data AS (
    SELECT DISTINCT doc.deliverable_id,
        first_value(bn.net_variance_total)
            OVER (PARTITION BY doc.deliverable_id ORDER BY da.action_timestamp DESC) AS net_variance_total,
        first_value(bn.actuals) OVER (PARTITION BY doc.deliverable_id ORDER BY da.action_timestamp DESC) AS actuals
    FROM demos_app.budget_neutrality_workbook AS bn
    INNER JOIN demos_app.document AS doc ON bn.id = doc.id
    INNER JOIN demos_app.deliverable_action AS da
        ON doc.deliverable_submission_action_id = da.id AND bn.validation_status_id = 'Succeeded'
),
aggregate_public_comments AS (
    SELECT pbc.deliverable_id,
        string_agg(p.first_name || ' ' || p.last_name || ':'
            || to_char(pbc.created_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') || ':' || pbc.content,
            E'\\r\\n' ORDER BY pbc.created_at) AS comment_value
    FROM demos_app.public_comment AS pbc
    INNER JOIN demos_app.person AS p ON pbc.author_user_id = p.id
    GROUP BY pbc.deliverable_id
),
aggregate_private_comments AS (
    SELECT pvc.deliverable_id,
        string_agg(p.first_name || ' ' || p.last_name || ':'
            || to_char(pvc.created_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') || ':' || pvc.content,
            E'\\r\\n' ORDER BY pvc.created_at) AS comment_value
    FROM demos_app.private_comment AS pvc
    INNER JOIN demos_app.person AS p ON pvc.author_user_id = p.id
    GROUP BY pvc.deliverable_id
),
deliverable_details AS (
    SELECT deliv.id AS source_deliverable_id, deliv.demonstration_id, row_to_json(report_fields) AS data
    FROM demos_app.deliverable AS deliv
    INNER JOIN demos_app.demonstration AS demo ON deliv.demonstration_id = demo.id
    INNER JOIN demos_app.state AS demo_state ON demo.state_id = demo_state.id
    INNER JOIN primary_roles AS primary_project_officer
        ON deliv.demonstration_id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer'
    LEFT JOIN primary_roles AS primary_monitoring_and_evaluation_analyst
        ON deliv.demonstration_id = primary_monitoring_and_evaluation_analyst.demonstration_id
        AND primary_monitoring_and_evaluation_analyst.role_id = 'Monitoring & Evaluation Analyst'
    LEFT JOIN flat_demonstration_types AS demo_types ON deliv.id = demo_types.deliverable_id
    INNER JOIN demos_app.person AS cms_owner ON deliv.cms_owner_user_id = cms_owner.id
    INNER JOIN action_statistics AS act_stats ON deliv.id = act_stats.deliverable_id
    LEFT JOIN current_extensions ON deliv.id = current_extensions.deliverable_id
    LEFT JOIN most_recent_resub_reqs
        ON deliv.id = most_recent_resub_reqs.deliverable_id
        AND act_stats.most_recent_submission_timestamp < act_stats.most_recent_resubmission_request_timestamp
    LEFT JOIN most_recent_public_comment
        ON deliv.id = most_recent_public_comment.deliverable_id
        AND deliv.status_id IN ('Accepted', 'Approved', 'Received and Filed')
        AND act_stats.most_recent_finalization_timestamp < most_recent_public_comment.created_at
    LEFT JOIN most_recent_review_start ON deliv.id = most_recent_review_start.deliverable_id
    LEFT JOIN most_recent_valid_bn_data ON deliv.id = most_recent_valid_bn_data.deliverable_id
    LEFT JOIN aggregate_public_comments ON deliv.id = aggregate_public_comments.deliverable_id
    LEFT JOIN aggregate_private_comments ON deliv.id = aggregate_private_comments.deliverable_id
    CROSS JOIN LATERAL (
        SELECT
${projection(deliverableFields)}
    ) AS report_fields
    WHERE deliv.status_id != 'Deleted'
),
deliverable_aggregates AS (
    SELECT demonstration_id, json_agg(data ORDER BY source_deliverable_id) AS deliverables
    FROM deliverable_details
    GROUP BY demonstration_id
),
demonstration_type_rows AS (
    SELECT demo_type.demonstration_id, demo_type.tag_name_id AS source_tag_name_id,
${projection(demonstrationTypeFields)}
    FROM demos_app.demonstration_type_tag_assignment AS demo_type
    INNER JOIN demos_app.demonstration AS demo ON demo_type.demonstration_id = demo.id
    INNER JOIN demos_app.state AS demo_state ON demo.state_id = demo_state.id
    INNER JOIN primary_roles AS primary_project_officer
        ON demo_type.demonstration_id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer'
    LEFT JOIN primary_roles AS primary_state_poc
        ON demo_type.demonstration_id = primary_state_poc.demonstration_id
        AND primary_state_poc.role_id = 'State Point of Contact'
    -- At most one row: application_date's primary key is (application_id, date_type_id).
    LEFT JOIN demos_app.application_date AS app_date
        ON demo_type.demonstration_id = app_date.application_id AND app_date.date_type_id = 'Application Approval Date'
),
demonstration_type_details AS (
    SELECT type_rows.demonstration_id, type_rows.source_tag_name_id, row_to_json(report_fields) AS data
    FROM demonstration_type_rows AS type_rows
    CROSS JOIN LATERAL (
        SELECT
${demonstrationTypeFields.map((field) => `        type_rows.${field.name}`).join(",\n")}
    ) AS report_fields
),
demonstration_type_aggregates AS (
    SELECT demonstration_id, json_agg(data ORDER BY source_tag_name_id) AS demonstration_types
    FROM demonstration_type_details
    GROUP BY demonstration_id
)
SELECT overview.demonstration_id,
${overviewFields.map((field) => `    overview.${field.name}`).join(",\n")},
    coalesce(application_aggregates.applications, '[]'::json) AS applications,
    coalesce(deliverable_aggregates.deliverables, '[]'::json) AS deliverables,
    coalesce(demonstration_type_aggregates.demonstration_types, '[]'::json) AS demonstration_types
FROM overview
LEFT JOIN application_aggregates ON overview.demonstration_id = application_aggregates.parent_demonstration_id
LEFT JOIN deliverable_aggregates ON overview.demonstration_id = deliverable_aggregates.demonstration_id
LEFT JOIN demonstration_type_aggregates ON overview.demonstration_id = demonstration_type_aggregates.demonstration_id
`.trim();

export const EXPORT_VIEWS = {
  demonstration_reporting: {
    query: demonstrationReportingQuery,
    orderBy: ["demonstration_id"],
    baseTables: [
      "amendment", "application", "application_date", "application_note", "budget_neutrality_workbook",
      "deliverable", "deliverable_action", "deliverable_demonstration_type", "deliverable_extension", "demonstration",
      "demonstration_role_assignment", "demonstration_type_tag_assignment", "document", "extension", "person",
      "primary_demonstration_role_assignment", "private_comment", "public_comment", "state",
    ],
    schema: {
      columns: [
        { name: "demonstration_id", duckdbType: "UUID" },
        ...relationSchema(overviewFields).columns,
        { name: "applications", duckdbType: "JSON" },
        { name: "deliverables", duckdbType: "JSON" },
        { name: "demonstration_types", duckdbType: "JSON" },
      ],
    },
    collectionSchemas: {
      applications: relationSchema(applicationFields),
      deliverables: relationSchema(deliverableFields),
      demonstration_types: relationSchema(demonstrationTypeFields),
    },
  },
} satisfies Record<string, ExportViewDefinition>;
