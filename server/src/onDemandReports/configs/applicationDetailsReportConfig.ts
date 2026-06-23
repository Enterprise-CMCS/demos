import { z } from "zod";
import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  CLEARANCE_LEVELS,
  SDG_DIVISIONS,
  SIGNATURE_LEVEL,
  STATES_AND_TERRITORIES,
} from "../../constants";
import {
  OnDemandReportColumnHeader,
  OnDemandReportColumnSchema,
  OnDemandReportConfiguration,
} from "./onDemandReportConfigTypes";
import { applicationDetailsReportQueries } from "./applicationDetailsReportQueries";
import { usDateStringOrDash } from "./onDemandReportCustomSchemaTypes";

type ApplicationDetailsReportColumn =
  | "state"
  | "application_type"
  | "application_title"
  | "demonstration_number"
  | "chip_id"
  | "primary_project_officer"
  | "status"
  | "sdg_division"
  | "signature_level"
  | "effective_date"
  | "expiration_date"
  | "concept_start_date"
  | "concept_paper_submitted_date"
  | "concept_skipped_date"
  | "concept_completion_date"
  | "application_intake_start_date"
  | "state_application_submitted_date"
  | "completeness_review_due_date"
  | "application_intake_completion_date"
  | "completeness_start_date"
  | "state_application_deemed_complete"
  | "completeness_completion_date"
  | "federal_comment_period_start_date"
  | "federal_comment_period_end_date"
  | "federal_comment_internal_analysis_document_submitted_date"
  | "sdg_preparation_start_date"
  | "expected_approval_date"
  | "sme_initial_review_date"
  | "frt_initial_meeting_date"
  | "bnpmt_initial_meeting_date"
  | "sdg_preparation_completion_date"
  | "review_start_date"
  | "ogd_approval_to_share_with_smes"
  | "draft_approval_package_to_prep"
  | "ddme_approval_received"
  | "state_concurrence"
  | "bn_pmt_approval_to_send_to_omb"
  | "draft_approval_package_shared"
  | "receive_omb_concurrence"
  | "receive_ogc_legal_clearance"
  | "clearance_level_comms_or_osora"
  | "package_sent_for_comms_clearance"
  | "comms_clearance_received"
  | "comms_clearance_notes"
  | "submit_approval_package_to_osora"
  | "osora_r1_comments_due"
  | "osora_r2_comments_due"
  | "cms_osora_clearance_end"
  | "osora_clearance_notes"
  | "review_completion_date"
  | "approval_package_start_date"
  | "final_bn_formulation_workbook_uploaded_date"
  | "q_and_a_file_uploaded_date"
  | "special_terms_and_conditions_file_uploaded_date"
  | "formal_omb_policy_concurrent_email_uploaded_date"
  | "approval_letter_uploaded_date"
  | "signed_decision_memo_uploaded_date"
  | "approval_package_completion_date"
  | "approval_summary_start_date"
  | "application_details_marked_complete_date"
  | "application_demonstration_types_marked_complete_date"
  | "approval_summary_completion_date";

const applicationDetailsReportSchema = z
  .object({
    state: z.enum(STATES_AND_TERRITORIES.map((state) => state.id)),
    application_type: z.enum(APPLICATION_TYPES),
    application_title: z.string(),
    demonstration_number: z.string(),
    chip_id: z.string(),
    primary_project_officer: z.string(),
    status: z.enum(APPLICATION_STATUS),
    sdg_division: z.enum([...SDG_DIVISIONS, "-"]),
    signature_level: z.enum([...SIGNATURE_LEVEL, "-"]),
    effective_date: usDateStringOrDash,
    expiration_date: usDateStringOrDash,
    concept_start_date: usDateStringOrDash,
    concept_paper_submitted_date: usDateStringOrDash,
    concept_skipped_date: usDateStringOrDash,
    concept_completion_date: usDateStringOrDash,
    application_intake_start_date: usDateStringOrDash,
    state_application_submitted_date: usDateStringOrDash,
    completeness_review_due_date: usDateStringOrDash,
    application_intake_completion_date: usDateStringOrDash,
    completeness_start_date: usDateStringOrDash,
    state_application_deemed_complete: usDateStringOrDash,
    completeness_completion_date: usDateStringOrDash,
    federal_comment_period_start_date: usDateStringOrDash,
    federal_comment_period_end_date: usDateStringOrDash,
    federal_comment_internal_analysis_document_submitted_date: usDateStringOrDash,
    sdg_preparation_start_date: usDateStringOrDash,
    expected_approval_date: usDateStringOrDash,
    sme_initial_review_date: usDateStringOrDash,
    frt_initial_meeting_date: usDateStringOrDash,
    bnpmt_initial_meeting_date: usDateStringOrDash,
    sdg_preparation_completion_date: usDateStringOrDash,
    review_start_date: usDateStringOrDash,
    ogd_approval_to_share_with_smes: usDateStringOrDash,
    draft_approval_package_to_prep: usDateStringOrDash,
    ddme_approval_received: usDateStringOrDash,
    state_concurrence: usDateStringOrDash,
    bn_pmt_approval_to_send_to_omb: usDateStringOrDash,
    draft_approval_package_shared: usDateStringOrDash,
    receive_omb_concurrence: usDateStringOrDash,
    receive_ogc_legal_clearance: usDateStringOrDash,
    clearance_level_comms_or_osora: z.enum(CLEARANCE_LEVELS),
    package_sent_for_comms_clearance: usDateStringOrDash,
    comms_clearance_received: usDateStringOrDash,
    comms_clearance_notes: z.string(),
    submit_approval_package_to_osora: usDateStringOrDash,
    osora_r1_comments_due: usDateStringOrDash,
    osora_r2_comments_due: usDateStringOrDash,
    cms_osora_clearance_end: usDateStringOrDash,
    osora_clearance_notes: z.string(),
    review_completion_date: usDateStringOrDash,
    approval_package_start_date: usDateStringOrDash,
    final_bn_formulation_workbook_uploaded_date: usDateStringOrDash,
    q_and_a_file_uploaded_date: usDateStringOrDash,
    special_terms_and_conditions_file_uploaded_date: usDateStringOrDash,
    formal_omb_policy_concurrent_email_uploaded_date: usDateStringOrDash,
    approval_letter_uploaded_date: usDateStringOrDash,
    signed_decision_memo_uploaded_date: usDateStringOrDash,
    approval_package_completion_date: usDateStringOrDash,
    approval_summary_start_date: usDateStringOrDash,
    application_details_marked_complete_date: usDateStringOrDash,
    application_demonstration_types_marked_complete_date: usDateStringOrDash,
    approval_summary_completion_date: usDateStringOrDash,
  } satisfies OnDemandReportColumnSchema<ApplicationDetailsReportColumn>)
  .strict();

const applicationDetailsReportColumnHeaders = {
  state: "State/Territory",
  application_type: "Application Type",
  application_title: "Application Title",
  demonstration_number: "Demonstration Number",
  chip_id: "CHIP ID",
  primary_project_officer: "Primary Project Officer",
  status: "Status",
  sdg_division: "SDG Division",
  signature_level: "Signature Level",
  effective_date: "Effective Date",
  expiration_date: "Expiration Date",
  concept_start_date: "Concept Start Date",
  concept_paper_submitted_date: "Concept Paper Submitted Date",
  concept_skipped_date: "Concept Skipped Date",
  concept_completion_date: "Concept Completion Date",
  application_intake_start_date: "Application Intake Start Date",
  state_application_submitted_date: "State Application Submitted Date",
  completeness_review_due_date: "Completeness Review Due Date",
  application_intake_completion_date: "Application Intake Completion Date",
  completeness_start_date: "Completeness Start Date",
  state_application_deemed_complete: "State Application Deemed Complete",
  completeness_completion_date: "Completeness Completion Date",
  federal_comment_period_start_date: "Federal Comment Period Start Date",
  federal_comment_period_end_date: "Federal Comment Period End Date",
  federal_comment_internal_analysis_document_submitted_date:
    "Federal Comment Internal Analysis Document Submitted Date",
  sdg_preparation_start_date: "SDG Preparation Start Date",
  expected_approval_date: "Expected Approval Date",
  sme_initial_review_date: "SME Initial Review Date",
  frt_initial_meeting_date: "FRT Initial Meeting Date",
  bnpmt_initial_meeting_date: "BNPMT Initial Meeting Date",
  sdg_preparation_completion_date: "SDG Preparation Completion Date",
  review_start_date: "Review Start Date",
  ogd_approval_to_share_with_smes: "OGD Approval to Share with SMEs",
  draft_approval_package_to_prep: "Draft Approval Package to Prep",
  ddme_approval_received: "DDME Approval Received",
  state_concurrence: "State Concurrence",
  bn_pmt_approval_to_send_to_omb: "BN PMT Approval to Send to OMB",
  draft_approval_package_shared: "Draft Approval Package Shared",
  receive_omb_concurrence: "Receive OMB Concurrence",
  receive_ogc_legal_clearance: "Receive OGC Legal Clearance",
  clearance_level_comms_or_osora: "Clearance Level (COMMs or OSORA)",
  package_sent_for_comms_clearance: "Package Sent for COMMs Clearance",
  comms_clearance_received: "COMMs Clearance Received",
  comms_clearance_notes: "COMMS Clearance Notes",
  submit_approval_package_to_osora: "Submit Approval Package to OSORA",
  osora_r1_comments_due: "OSORA R1 Comments Due",
  osora_r2_comments_due: "OSORA R2 Comments Due",
  cms_osora_clearance_end: "CMS (OSORA) Clearance End",
  osora_clearance_notes: "OSORA Clearance Notes",
  review_completion_date: "Review Completion Date",
  approval_package_start_date: "Approval Package Start Date",
  final_bn_formulation_workbook_uploaded_date: "Final BN Formulation Workbook Uploaded Date",
  q_and_a_file_uploaded_date: "Q&A File Uploaded Date",
  special_terms_and_conditions_file_uploaded_date: "Special Terms & Conditions File Uploaded Date",
  formal_omb_policy_concurrent_email_uploaded_date:
    "Formal OMB Policy Concurrent Email Uploaded Date",
  approval_letter_uploaded_date: "Approval Letter Uploaded Date",
  signed_decision_memo_uploaded_date: "Signed Decision Memo Uploaded Date",
  approval_package_completion_date: "Approval Package Completion Date",
  approval_summary_start_date: "Approval Summary Start Date",
  application_details_marked_complete_date: "Application Details Marked Complete Date",
  application_demonstration_types_marked_complete_date:
    "Application Demonstration Types Marked Complete Date",
  approval_summary_completion_date: "Approval Summary Completion Date",
} satisfies OnDemandReportColumnHeader<ApplicationDetailsReportColumn>;

export const applicationDetailsReportConfiguration = {
  sqlQueries: applicationDetailsReportQueries,
  reportRowSchema: applicationDetailsReportSchema,
  excelConfiguration: { columnNames: applicationDetailsReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
