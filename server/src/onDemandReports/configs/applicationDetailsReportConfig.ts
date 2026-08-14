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
  OnDemandReportColumnConfiguration,
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
    state: z.enum(STATES_AND_TERRITORIES.map((state) => state.name)),
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
  state: { columnName: "State/Territory" },
  application_type: { columnName: "Application Type" },
  application_title: { columnName: "Application Title" },
  demonstration_number: { columnName: "Demonstration Number" },
  chip_id: { columnName: "CHIP ID" },
  primary_project_officer: { columnName: "Primary Project Officer" },
  status: { columnName: "Status" },
  sdg_division: { columnName: "SDG Division" },
  signature_level: { columnName: "Signature Level" },
  effective_date: { columnName: "Effective Date" },
  expiration_date: { columnName: "Expiration Date" },
  concept_start_date: { columnName: "Concept Start Date" },
  concept_paper_submitted_date: { columnName: "Concept Paper Submitted Date" },
  concept_skipped_date: { columnName: "Concept Skipped Date" },
  concept_completion_date: { columnName: "Concept Completion Date" },
  application_intake_start_date: { columnName: "Application Intake Start Date" },
  state_application_submitted_date: { columnName: "State Application Submitted Date" },
  completeness_review_due_date: { columnName: "Completeness Review Due Date" },
  application_intake_completion_date: { columnName: "Application Intake Completion Date" },
  completeness_start_date: { columnName: "Completeness Start Date" },
  state_application_deemed_complete: { columnName: "State Application Deemed Complete" },
  completeness_completion_date: { columnName: "Completeness Completion Date" },
  federal_comment_period_start_date: { columnName: "Federal Comment Period Start Date" },
  federal_comment_period_end_date: { columnName: "Federal Comment Period End Date" },
  federal_comment_internal_analysis_document_submitted_date: {
    columnName: "Federal Comment Internal Analysis Document Submitted Date",
  },
  sdg_preparation_start_date: { columnName: "SDG Preparation Start Date" },
  expected_approval_date: { columnName: "Expected Approval Date" },
  sme_initial_review_date: { columnName: "SME Initial Review Date" },
  frt_initial_meeting_date: { columnName: "FRT Initial Meeting Date" },
  bnpmt_initial_meeting_date: { columnName: "BNPMT Initial Meeting Date" },
  sdg_preparation_completion_date: { columnName: "SDG Preparation Completion Date" },
  review_start_date: { columnName: "Review Start Date" },
  ogd_approval_to_share_with_smes: { columnName: "OGD Approval to Share with SMEs" },
  draft_approval_package_to_prep: { columnName: "Draft Approval Package to Prep" },
  ddme_approval_received: { columnName: "DDME Approval Received" },
  state_concurrence: { columnName: "State Concurrence" },
  bn_pmt_approval_to_send_to_omb: { columnName: "BN PMT Approval to Send to OMB" },
  draft_approval_package_shared: { columnName: "Draft Approval Package Shared" },
  receive_omb_concurrence: { columnName: "Receive OMB Concurrence" },
  receive_ogc_legal_clearance: { columnName: "Receive OGC Legal Clearance" },
  clearance_level_comms_or_osora: { columnName: "Clearance Level (COMMs or OSORA)" },
  package_sent_for_comms_clearance: { columnName: "Package Sent for COMMs Clearance" },
  comms_clearance_received: { columnName: "COMMs Clearance Received" },
  comms_clearance_notes: { columnName: "COMMS Clearance Notes" },
  submit_approval_package_to_osora: { columnName: "Submit Approval Package to OSORA" },
  osora_r1_comments_due: { columnName: "OSORA R1 Comments Due" },
  osora_r2_comments_due: { columnName: "OSORA R2 Comments Due" },
  cms_osora_clearance_end: { columnName: "CMS (OSORA) Clearance End" },
  osora_clearance_notes: { columnName: "OSORA Clearance Notes" },
  review_completion_date: { columnName: "Review Completion Date" },
  approval_package_start_date: { columnName: "Approval Package Start Date" },
  final_bn_formulation_workbook_uploaded_date: {
    columnName: "Final BN Formulation Workbook Uploaded Date",
  },
  q_and_a_file_uploaded_date: { columnName: "Q&A File Uploaded Date" },
  special_terms_and_conditions_file_uploaded_date: {
    columnName: "Special Terms & Conditions File Uploaded Date",
  },
  formal_omb_policy_concurrent_email_uploaded_date: {
    columnName: "Formal OMB Policy Concurrent Email Uploaded Date",
  },
  approval_letter_uploaded_date: { columnName: "Approval Letter Uploaded Date" },
  signed_decision_memo_uploaded_date: { columnName: "Signed Decision Memo Uploaded Date" },
  approval_package_completion_date: { columnName: "Approval Package Completion Date" },
  approval_summary_start_date: { columnName: "Approval Summary Start Date" },
  application_details_marked_complete_date: {
    columnName: "Application Details Marked Complete Date",
  },
  application_demonstration_types_marked_complete_date: {
    columnName: "Application Demonstration Types Marked Complete Date",
  },
  approval_summary_completion_date: { columnName: "Approval Summary Completion Date" },
} satisfies OnDemandReportColumnConfiguration<ApplicationDetailsReportColumn>;

export const applicationDetailsReportConfiguration = {
  sqlQueries: applicationDetailsReportQueries,
  reportRowSchema: applicationDetailsReportSchema,
  excelConfiguration: { columns: applicationDetailsReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
