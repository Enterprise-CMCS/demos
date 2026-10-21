import type { DataContractMetadata, FieldDocumentation } from "./types";

const overviewReport = "Demonstration Overview Report";
const applicationReport = "Application Details Report";
const deliverableReport = "Deliverable Status Report";
const demonstrationTypesReport = "Demonstration Types Report";
const dateFormat = "MM/DD/YYYY (America/New_York)";
const dateNotes = "Timestamp converted to America/New_York before formatting as MM/DD/YYYY; missing values become '-'.";
const nameNotes = "Person first_name concatenated with a space and last_name; contains personally identifiable information (PII).";
const requiredDateNotes = "Required source timestamp converted to America/New_York and formatted as MM/DD/YYYY; no fallback.";
const commentNotes = "Author full name, New York MM/DD/YYYY date, and content joined with ':'; comments sorted by created_at ascending and separated by CRLF. The entire aggregate is truncated to 32000 characters (not bytes) with LEFT, including author/date prefixes; no comments gives '-'. Unredacted text and author names may contain PII and sensitive internal information; commas, quotes, newlines, and Unicode are preserved inside JSON strings.";

function overviewField(description: string, notes: string, format?: string): FieldDocumentation {
  return { description, nullable: false, sourceReport: overviewReport, notes, ...(format ? { format } : {}) };
}

function applicationField(description: string, notes: string, format?: string): FieldDocumentation {
  return { description, nullable: false, sourceReport: applicationReport, notes, ...(format ? { format } : {}) };
}

function applicationDate(dateType: string, description: string): FieldDocumentation {
  return applicationField(description,
    `Maximum application_date.date_value for date_type_id '${dateType}', grouped by application. ${dateNotes}`, dateFormat);
}

function documentDate(documentType: string, description: string): FieldDocumentation {
  return applicationField(description,
    `Maximum document.created_at for document_type_id '${documentType}', grouped by application; not document content or a business date. ${dateNotes}`, dateFormat);
}

function deliverableField(description: string, notes: string, format?: string, nullable = false): FieldDocumentation {
  return { description, nullable, sourceReport: deliverableReport, notes, ...(format ? { format } : {}) };
}

function demonstrationTypeField(description: string, notes: string, format?: string): FieldDocumentation {
  return { description, nullable: false, sourceReport: demonstrationTypesReport, notes, ...(format ? { format } : {}) };
}

const overviewFields: Readonly<Record<string, FieldDocumentation>> = {
  state_territory: overviewField("Name of the demonstration's state or territory.", "From the required state join; no transformation."),
  demonstration_title: overviewField("Title of the demonstration.", "From demonstration.name; no transformation."),
  demonstration_number: overviewField("Medicaid demonstration identifier assigned to the demonstration.", "From demonstration.medicaid_id; no transformation."),
  chip_id: overviewField("CHIP identifier when the demonstration has the Children's Health Insurance Program (CHIP) tag.", "Uses demonstration.chip_id only for the exact CHIP tag; otherwise '-'. It is not a UUID."),
  status: overviewField("Current demonstration application status.", "From demonstration.status_id; no transformation."),
  status_update_date: overviewField("Date the demonstration status was last updated.", "Required status_updated_at timestamp converted to America/New_York and formatted as MM/DD/YYYY; no fallback.", dateFormat),
  sdg_division: overviewField("SDG division assigned to the demonstration.", "From demonstration.sdg_division_id; missing values become '-'."),
  signature_level: overviewField("Signature authority level for the demonstration.", "From demonstration.signature_level_id; missing values become '-'."),
  effective_date: overviewField("Effective date of the demonstration.", dateNotes, dateFormat),
  expiration_date: overviewField("Expiration date of the demonstration.", dateNotes, dateFormat),
  renewal_in_progress: overviewField("Whether any extension (reported as a renewal) is currently in progress.", "'Yes' for any extension in Pre-Submission, Under Review, or On-hold; otherwise 'No'.", "Yes/No"),
  amendment_in_progress: overviewField("Whether any amendment is currently in progress.", "'Yes' for any amendment in Pre-Submission, Under Review, or On-hold; otherwise 'No'.", "Yes/No"),
  approved_amendment_applications: overviewField("Number of amendment applications with status Approved for the demonstration.", "Sum of matching amendments cast to INTEGER; no amendments gives 0. This is not a count of all applications."),
  primary_project_officer: overviewField("Full name of the demonstration's primary Project Officer.", `${nameNotes} Required primary-role inner join; a demonstration without this assignment is excluded, not filled with '-'.`),
  project_officers: overviewField("Full names of non-primary Project Officers assigned to the demonstration.", `${nameNotes} Primary assignments excluded; names sorted by full name and joined with ', '; no assignments gives '-'.`),
  primary_policy_tech_director: overviewField("Full name of the demonstration's primary Policy Technical Director.", `${nameNotes} Missing assignment gives '-'.`),
  primary_ddme_analyst: overviewField("Full name of the demonstration's primary DDME Analyst.", `${nameNotes} Missing assignment gives '-'.`),
  ddme_analysts: overviewField("Full names of non-primary DDME Analysts assigned to the demonstration.", `${nameNotes} Primary assignments excluded; names sorted by full name and joined with ', '; no assignments gives '-'.`),
  primary_state_poc: overviewField("Full name of the demonstration's primary State Point of Contact.", `${nameNotes} Missing assignment gives '-'.`),
  state_pocs: overviewField("Full names of non-primary State Points of Contact assigned to the demonstration.", `${nameNotes} Primary assignments excluded; names sorted by full name and joined with ', '; no assignments gives '-'.`),
  primary_monitoring_evaluation_tech_director: overviewField("Full name of the demonstration's primary Monitoring & Evaluation Technical Director.", `${nameNotes} Missing assignment gives '-'.`),
  application_approval_date: overviewField("Application Approval Date recorded for the demonstration itself, not a child amendment or renewal.", `From the unique application/date-type pair for 'Application Approval Date'. ${dateNotes}`, dateFormat),
};

const applicationFields: Readonly<Record<string, FieldDocumentation>> = {
  state: applicationField("Name of the parent demonstration's state or territory.", "From the required parent state join; no transformation."),
  application_type: applicationField("Type of application: Demonstration, Amendment, or Renewal.", "Extension is mapped to Renewal; Demonstration and Amendment retain their source names."),
  application_title: applicationField("Title of this demonstration, amendment, or renewal application.", "Chosen from demonstration.name, amendment.name, or extension.name according to application_type_id; no fallback."),
  demonstration_number: applicationField("Medicaid identifier of the parent demonstration, including for child applications.", "From the parent demonstration.medicaid_id; no transformation."),
  chip_id: applicationField("CHIP identifier of the parent demonstration when it has the Children's Health Insurance Program (CHIP) tag.", "Uses parent demonstration.chip_id only for the exact CHIP tag; otherwise '-'. It is not a UUID."),
  primary_project_officer: applicationField("Full name of the parent demonstration's primary Project Officer.", `${nameNotes} Required primary-role inner join; applications without a parent primary officer are excluded.`),
  status: applicationField("Current status of this application.", "Chosen from the demonstration, amendment, or extension status_id according to application_type_id; no fallback."),
  sdg_division: applicationField("SDG division assigned to the parent demonstration.", "From the parent demonstration.sdg_division_id; missing values become '-'."),
  signature_level: applicationField("Signature authority level for this application.", "Chosen from the demonstration, amendment, or extension signature_level_id; missing values become '-'."),
  effective_date: applicationField("Effective date of this demonstration, amendment, or renewal application.", dateNotes, dateFormat),
  expiration_date: applicationField("Expiration date of the parent demonstration, shared by its child applications.", dateNotes, dateFormat),
  concept_start_date: applicationDate("Concept Start Date", "Date the application's Concept phase started."),
  concept_paper_submitted_date: applicationDate("Concept Paper Submitted Date", "Date the state's concept paper was submitted for this application."),
  concept_skipped_date: applicationDate("Concept Skipped Date", "Date the application's Concept phase was recorded as skipped."),
  concept_completion_date: applicationDate("Concept Completion Date", "Date the application's Concept phase completed."),
  application_intake_start_date: applicationDate("Application Intake Start Date", "Date the application's Application Intake phase started."),
  state_application_submitted_date: applicationDate("State Application Submitted Date", "Date the state submitted this application."),
  completeness_review_due_date: applicationDate("Completeness Review Due Date", "Due date of this application's completeness review."),
  application_intake_completion_date: applicationDate("Application Intake Completion Date", "Date the application's Application Intake phase completed."),
  completeness_start_date: applicationDate("Completeness Start Date", "Date the application's Completeness phase started."),
  state_application_deemed_complete: applicationDate("State Application Deemed Complete", "Date the state's application was deemed complete."),
  completeness_completion_date: applicationDate("Completeness Completion Date", "Date the application's Completeness phase completed."),
  federal_comment_period_start_date: applicationDate("Federal Comment Period Start Date", "Start date of the federal public comment period for this application."),
  federal_comment_period_end_date: applicationDate("Federal Comment Period End Date", "End date of the federal public comment period for this application."),
  federal_comment_internal_analysis_document_submitted_date: documentDate("Federal Comment Internal Analysis Document", "Most recent upload date of a Federal Comment Internal Analysis Document for this application."),
  sdg_preparation_start_date: applicationDate("SDG Preparation Start Date", "Date the application's SDG Preparation phase started."),
  internal_expected_approval_date: applicationDate("Internal Expected Approval Date", "Internally expected approval date for this application, not its actual approval date."),
  state_requested_approval_date: applicationDate("State Requested Approval Date", "Approval date requested by the state for this application."),
  sme_initial_review_date: applicationDate("SME Initial Review Date", "Date of the initial SME review of this application."),
  frt_initial_meeting_date: applicationDate("FRT Initial Meeting Date", "Date of the initial FRT meeting for this application."),
  bnpmt_initial_meeting_date: applicationDate("BNPMT Initial Meeting Date", "Date of the initial BNPMT meeting for this application."),
  sdg_preparation_completion_date: applicationDate("SDG Preparation Completion Date", "Date the application's SDG Preparation phase completed."),
  review_start_date: applicationDate("Review Start Date", "Date the application's Review phase started."),
  ogd_approval_to_share_with_smes: applicationDate("OGD Approval to Share with SMEs", "Date OGD approved sharing this application with SMEs."),
  draft_approval_package_to_prep: applicationDate("Draft Approval Package to Prep", "Date the application's draft approval package was sent for preparation."),
  ddme_approval_received: applicationDate("DDME Approval Received", "Date DDME approval was received for this application."),
  state_concurrence: applicationDate("State Concurrence", "Date state concurrence was recorded for this application."),
  bn_pmt_approval_to_send_to_omb: applicationDate("BN PMT Approval to Send to OMB", "Date BN PMT approved sending this application's package to OMB."),
  draft_approval_package_shared: applicationDate("Draft Approval Package Shared", "Date this application's draft approval package was shared."),
  receive_omb_concurrence: applicationDate("Receive OMB Concurrence", "Date OMB concurrence was received for this application."),
  receive_ogc_legal_clearance: applicationDate("Receive OGC Legal Clearance", "Date OGC legal clearance was received for this application."),
  clearance_level_comms_or_osora: applicationField("Clearance level selected for this application (COMMs or CMS (OSORA)).", "Chosen from the demonstration, amendment, or extension clearance_level_id; required source value, no fallback."),
  package_sent_for_comms_clearance: applicationDate("Package Sent for COMMs Clearance", "Date this application's package was sent for COMMs clearance."),
  comms_clearance_received: applicationDate("COMMs Clearance Received", "Date COMMs clearance was received for this application."),
  comms_clearance_notes: applicationField("Free-text COMMs clearance notes for this application.", "MAX(content) for note_type_id 'COMMs Clearance', not the latest note by timestamp; missing/all-null notes become '-'. Text is unredacted and may contain PII or sensitive internal information."),
  submit_approval_package_to_osora: applicationDate("Submit Approval Package to OSORA", "Date this application's approval package was submitted to OSORA."),
  osora_r1_comments_due: applicationDate("OSORA R1 Comments Due", "Due date for OSORA round-one comments on this application."),
  osora_r2_comments_due: applicationDate("OSORA R2 Comments Due", "Due date for OSORA round-two comments on this application."),
  cms_osora_clearance_end: applicationDate("CMS (OSORA) Clearance End", "End date of CMS (OSORA) clearance for this application."),
  osora_clearance_notes: applicationField("Free-text CMS (OSORA) clearance notes for this application.", "MAX(content) for note_type_id 'CMS (OSORA) Clearance', not the latest note by timestamp; missing/all-null notes become '-'. Text is unredacted and may contain PII or sensitive internal information."),
  review_completion_date: applicationDate("Review Completion Date", "Date the application's Review phase completed."),
  approval_package_start_date: applicationDate("Approval Package Start Date", "Date the application's Approval Package phase started."),
  final_bn_formulation_workbook_uploaded_date: documentDate("Final Budget Neutrality Formulation Workbook", "Most recent upload date of a Final Budget Neutrality Formulation Workbook for this application."),
  q_and_a_file_uploaded_date: documentDate("Q&A", "Most recent upload date of a Q&A document for this application."),
  special_terms_and_conditions_file_uploaded_date: documentDate("Special Terms & Conditions", "Most recent upload date of a Special Terms & Conditions document for this application."),
  formal_omb_policy_concurrent_email_uploaded_date: documentDate("Formal OMB Policy Concurrence Email", "Most recent upload date of a Formal OMB Policy Concurrence Email for this application."),
  approval_letter_uploaded_date: documentDate("Approval Letter", "Most recent upload date of an Approval Letter for this application."),
  signed_decision_memo_uploaded_date: documentDate("Signed Decision Memo", "Most recent upload date of a Signed Decision Memo for this application."),
  approval_package_completion_date: applicationDate("Approval Package Completion Date", "Date the application's Approval Package phase completed."),
  approval_summary_start_date: applicationDate("Approval Summary Start Date", "Date the application's Approval Summary phase started."),
  application_details_marked_complete_date: applicationDate("Application Details Marked Complete Date", "Date this application's details were marked complete."),
  application_demonstration_types_marked_complete_date: applicationDate("Application Demonstration Types Marked Complete Date", "Date this application's demonstration types were marked complete."),
  approval_summary_completion_date: applicationDate("Approval Summary Completion Date", "Date the application's Approval Summary phase completed."),
};

const deliverableFields: Readonly<Record<string, FieldDocumentation>> = {
  state: deliverableField("Name of the deliverable's parent state or territory.", "From the required demonstration/state join; no transformation."),
  demonstration_title: deliverableField("Title of the deliverable's parent demonstration.", "From demonstration.name; no transformation."),
  demonstration_number: deliverableField("Medicaid identifier of the deliverable's parent demonstration.", "From demonstration.medicaid_id; no transformation."),
  effective_date: deliverableField("Effective date of the deliverable's parent demonstration.", "Timestamp converted to America/New_York and formatted as MM/DD/YYYY; unlike the overview, missing values remain JSON null, not '-'.", dateFormat, true),
  expiration_date: deliverableField("Expiration date of the deliverable's parent demonstration.", "Timestamp converted to America/New_York and formatted as MM/DD/YYYY; unlike the overview, missing values remain JSON null, not '-'.", dateFormat, true),
  primary_project_officer: deliverableField("Full name of the parent demonstration's primary Project Officer.", `${nameNotes} Required primary-role inner join excludes unmatched deliverables.`),
  ddme_analyst: deliverableField("Full name of the parent demonstration's primary DDME Analyst, not all assigned analysts.", `${nameNotes} Missing primary assignment gives '-'.`),
  deliverable_type: deliverableField("Report category assigned to the deliverable.", "From deliverable.deliverable_type_id; no transformation."),
  deliverable_name: deliverableField("Name of the deliverable.", "From deliverable.name; no transformation. Free-text names may contain PII."),
  demonstration_types: deliverableField("Demonstration-type tags associated with this deliverable, not every tag of the parent.", "deliverable_demonstration_type.demonstration_type_tag_name_id sorted by tag name and joined with ', '; no associated tags gives '-'."),
  cms_owner: deliverableField("Full name of the CMS owner assigned to this deliverable.", `${nameNotes} Required person inner join on cms_owner_user_id excludes unmatched deliverables.`),
  due_date: deliverableField("Current due date of the deliverable.", requiredDateNotes, dateFormat),
  submission_date: deliverableField("Date of the most recent Submitted Deliverable action.", `Maximum action_timestamp among Submitted Deliverable actions, including resubmissions. ${dateNotes}`, dateFormat),
  extension_request_pending: deliverableField("Whether this deliverable has a Requested extension linked to a Requested Extension action.", "'Yes' only for deliverable_extension.status_id 'Requested' joined via action.active_extension_id; granted/denied requests are not pending. Otherwise 'No'.", "Yes/No"),
  extension_date_requested: deliverableField("Original date requested for the currently pending extension.", `From the pending extension's original_date_requested, not its action timestamp or granted date. ${dateNotes}`, dateFormat),
  reason_for_extension: deliverableField("Reason code for the currently pending extension.", "From the Requested extension's reason_code_id; no pending extension gives '-'."),
  extension_request_comments: deliverableField("Note on the Requested Extension action linked to the currently pending extension.", "From deliverable_action.note for the active Requested extension; missing/null gives '-'. Unredacted free text may contain PII or sensitive internal information; no 32000-character limit is applied to this field."),
  total_extensions_requested: deliverableField("Total number of Requested Extension actions for this deliverable.", "Sum across all actions cast to INTEGER, including requests no longer pending; no matching actions gives 0. Required action-statistics join excludes deliverables with no actions."),
  resubmission_due_date: deliverableField("New due date from the most recent currently outstanding Requested Resubmission action.", `Latest Requested Resubmission by action_timestamp is joined only when its timestamp is strictly after the latest Submitted Deliverable action. No prior submission, or a later/equal submission, gives '-'. ${dateNotes}`, dateFormat),
  resubmission_request_comments: deliverableField("Note from the most recent currently outstanding Requested Resubmission action.", "Latest request note is shown only when the request is strictly after the latest submission; no prior submission, resolved request, or null note gives '-'. Unredacted text may contain PII or sensitive internal information; no 32000-character limit is applied to this field."),
  total_resubmissions_requested: deliverableField("Total number of Requested Resubmission actions for this deliverable.", "Sum across all actions cast to INTEGER, including resolved requests; no matching actions gives 0. Required action-statistics join excludes deliverables with no actions."),
  deliverable_status: deliverableField("Current status of this deliverable.", "From deliverable.status_id; deliverables with status Deleted are excluded from the report collection."),
  last_deliverable_action: deliverableField("Type of the most recent action recorded for this deliverable.", "FIRST_VALUE(action_type_id) ordered by action_timestamp descending across all action types; timestamp ties retain the report's unspecified tie behavior."),
  last_deliverable_action_date: deliverableField("Date of the most recent action recorded for this deliverable.", `Maximum action_timestamp across all action types; required action-statistics join ensures a timestamp. ${requiredDateNotes}`, dateFormat),
  updated_post_acceptance: deliverableField("Whether a public comment was added after the latest finalization of a currently finalized deliverable.", "'Yes' only for current Accepted, Approved, or Received and Filed status when MAX(public_comment.created_at) is strictly after the most recent Accepted Deliverable, Approved Deliverable, or Received and Filed Deliverable action. Otherwise 'No'; private comments do not count.", "Yes/No"),
  deliverable_reviewer: deliverableField("Full name of the person who most recently started reviewing this deliverable.", `${nameNotes} Latest Started Review action that joins a person by user_id, ordered by action_timestamp descending; missing matched reviewer gives '-'. Timestamp ties retain report behavior.`),
  deliverable_review_date: deliverableField("Date of the latest Started Review action with a matched reviewer.", `Maximum Started Review action_timestamp among actions whose user_id joins person, not completion of review. ${dateNotes}`, dateFormat),
  budget_neutrality_variance: deliverableField("Net variance total from the most recently submitted, successfully validated budget-neutrality workbook.", "FIRST_VALUE(net_variance_total) ordered by linked submission action_timestamp descending; workbook.validation_status_id must be Succeeded and document.deliverable_submission_action_id must join an action. Not selected by document creation time. Numeric value cast to TEXT; absent/null gives '-'; timestamp ties retain report behavior.", "Numeric text or '-'"),
  actuals: deliverableField("Actuals value from the most recently submitted, successfully validated budget-neutrality workbook.", "Selected from the same latest successful submitted workbook as the variance, not the latest non-null actuals or an unsubmitted/failed workbook. Source string is unchanged; absent/null gives '-'."),
  public_comments: deliverableField("Aggregated public comments on this deliverable, including author names and dates.", commentNotes, "Author:MM/DD/YYYY:content, CRLF-separated, at most 32000 characters"),
  private_comments: deliverableField("Aggregated private internal comments on this deliverable, including author names and dates.", commentNotes, "Author:MM/DD/YYYY:content, CRLF-separated, at most 32000 characters"),
};

const demonstrationTypeFields: Readonly<Record<string, FieldDocumentation>> = {
  state_territory: demonstrationTypeField("Name of the assigned type's parent state or territory.", "From the required demonstration/state join; no transformation."),
  demonstration_title: demonstrationTypeField("Title of the assigned type's parent demonstration.", "From demonstration.name; no transformation."),
  demonstration_number: demonstrationTypeField("Medicaid identifier of the assigned type's parent demonstration.", "From demonstration.medicaid_id; no transformation."),
  chip_id: demonstrationTypeField("CHIP identifier of the parent demonstration when any of its assignments has the exact CHIP tag.", "Window MAX across all assignments of the parent; the same CHIP identifier is present on every type row, including non-CHIP tags. No CHIP assignment/null identifier gives '-'; not a UUID."),
  status: demonstrationTypeField("Current status of the assigned type's parent demonstration.", "From demonstration.status_id, not a separate type status; no transformation."),
  status_update_date: demonstrationTypeField("Date the parent demonstration's status was last updated.", requiredDateNotes, dateFormat),
  demonstration_effective_date: demonstrationTypeField("Effective date of the parent demonstration, not the individual type assignment.", dateNotes, dateFormat),
  demonstration_expiration_date: demonstrationTypeField("Expiration date of the parent demonstration, not the individual type assignment.", dateNotes, dateFormat),
  primary_project_officer: demonstrationTypeField("Full name of the parent demonstration's primary Project Officer.", `${nameNotes} Required primary-role inner join excludes unmatched type assignments.`),
  primary_state_poc: demonstrationTypeField("Full name of the parent demonstration's primary State Point of Contact.", `${nameNotes} Missing primary assignment gives '-'.`),
  application_approval_date: demonstrationTypeField("Application Approval Date for the parent demonstration itself, not a child amendment or renewal.", `From application_date for the unique demonstration/application pair with date_type_id 'Application Approval Date'. ${dateNotes}`, dateFormat),
  demonstration_type: demonstrationTypeField("Name of this demonstration-type tag assignment.", "From demonstration_type_tag_assignment.tag_name_id; no transformation or concatenation."),
  demonstration_type_effective_date: demonstrationTypeField("Effective date specific to this demonstration-type assignment.", requiredDateNotes, dateFormat),
  demonstration_type_expiration_date: demonstrationTypeField("Expiration date specific to this demonstration-type assignment.", requiredDateNotes, dateFormat),
};

export const DATA_CONTRACT_METADATA = {
  demonstration_reporting: {
    description: "Demonstration overview with independently aggregated application, deliverable, and demonstration-type report rows. Report formatting is preserved, including '-' sentinels and null parent dates in deliverables; names, notes, and public/private comments are unredacted and may contain PII or sensitive internal information. Non-nullability relies on the source schema's required values and primary-role/date/tag/pending-extension uniqueness constraints. Timestamp ties for latest actions, reviewers, workbooks, and comment order retain the reports' unspecified tie behavior.",
    rowGrain: "One row per demonstration returned by the Demonstration Overview Report's required state and primary Project Officer joins.",
    keyColumns: ["demonstration_id"],
    fields: {
      demonstration_id: {
        description: "Stable UUID of the demonstration, used as the parent dataset key.",
        nullable: false,
        sourceReport: overviewReport,
        format: "UUID",
        notes: "Added from demonstration.id without transformation; parent rows are sorted by this source identifier.",
      },
      ...overviewFields,
      applications: {
        description: "Application Details Report rows belonging to this demonstration, including the demonstration itself as an application, amendments, and extensions reported as Renewals.",
        nullable: false,
        sourceReport: applicationReport,
        format: "JSON array",
        notes: "Independently aggregated per parent demonstration, ordered by application.id; source ordering IDs are not exported. No matching applications gives []. Primary officer and parent state joins retain the report's filtering semantics. Dates are display strings, missing optional values use '-', and names/clearance notes may contain PII.",
        items: {
          rowGrain: "One row per application returned by the Application Details Report for the parent demonstration. Only applications whose parent demonstration has a primary Project Officer are included.",
          fields: applicationFields,
        },
      },
      deliverables: {
        description: "Deliverable Status Report rows belonging to this demonstration, with action statistics, pending requests, reviewer, validated budget-neutrality data, and public/private comments.",
        nullable: false,
        sourceReport: deliverableReport,
        format: "JSON array",
        notes: "Independently aggregated per demonstration, ordered by deliverable.id; source ordering IDs are not exported. No matching report rows gives []. Deleted deliverables and those without action statistics, a CMS owner, parent state, or primary officer are excluded as in the report. Parent effective/expiration dates may be JSON null; other missing optional values use '-'. Public/private comment aggregates are each limited to 32000 characters, but notes are not. Names and free text may contain PII or sensitive internal information.",
        items: {
          rowGrain: "One row per non-deleted deliverable returned by the Deliverable Status Report for the parent demonstration, assuming the source's unique pending-extension rules. Only deliverables whose parent demonstration has a primary Project Officer, that have a matched CMS owner, and that have at least one deliverable action are included.",
          fields: deliverableFields,
        },
      },
      demonstration_types: {
        description: "Demonstration Types Report rows belonging to this demonstration, including assignment-specific dates and parent context.",
        nullable: false,
        sourceReport: demonstrationTypesReport,
        format: "JSON array",
        notes: "Independently aggregated per demonstration, ordered by the source assignment key (demonstration_id, tag_name_id); the parent UUID and ordering key are not extra child fields. No matching assignments gives []. Required parent state and primary officer joins retain report filtering; dates are display strings and optional parent dates/POC use '-'. CHIP is calculated across all assignments of each parent before JSON aggregation; names contain PII.",
        items: {
          rowGrain: "One row per demonstration_type_tag_assignment key (demonstration_id, tag_name_id) returned by the Demonstration Types Report. Only assignments whose parent demonstration has a primary Project Officer are included.",
          fields: demonstrationTypeFields,
        },
      },
    },
  },
} satisfies Record<string, DataContractMetadata>;