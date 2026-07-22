import { z } from "zod";
import {
  DELIVERABLE_ACTION_TYPES,
  DELIVERABLE_EXTENSION_REASON_CODES,
  DELIVERABLE_STATUSES,
  DELIVERABLE_TYPES,
  STATES_AND_TERRITORIES,
} from "../../constants";
import {
  OnDemandReportColumnConfiguration,
  OnDemandReportColumnSchema,
  OnDemandReportConfiguration,
} from "./onDemandReportConfigTypes";
import { deliverableStatusReportQueries } from "./deliverableStatusReportQueries";
import { usDateString, usDateStringOrDash } from "./onDemandReportCustomSchemaTypes";

type DeliverableStatusReportColumn =
  | "state"
  | "demonstration_title"
  | "demonstration_number"
  | "effective_date"
  | "expiration_date"
  | "primary_project_officer"
  | "ddme_analyst"
  | "deliverable_type"
  | "deliverable_name"
  | "demonstration_types"
  | "cms_owner"
  | "due_date"
  | "submission_date"
  | "extension_request_pending"
  | "extension_date_requested"
  | "reason_for_extension"
  | "extension_request_comments"
  | "total_extensions_requested"
  | "resubmission_due_date"
  | "resubmission_request_comments"
  | "total_resubmissions_requested"
  | "deliverable_status"
  | "last_deliverable_action"
  | "last_deliverable_action_date"
  | "updated_post_acceptance"
  | "deliverable_reviewer"
  | "deliverable_review_date"
  | "budget_neutrality_variance"
  | "actuals"
  | "public_comments"
  | "private_comments";

const deliverableStatusReportSchema = z
  .object({
    state: z.enum(STATES_AND_TERRITORIES.map((state) => state.name)),
    demonstration_title: z.string(),
    demonstration_number: z.string(),
    effective_date: usDateString,
    expiration_date: usDateString,
    primary_project_officer: z.string(),
    ddme_analyst: z.string(),
    deliverable_type: z.enum(DELIVERABLE_TYPES),
    deliverable_name: z.string(),
    demonstration_types: z.string(),
    cms_owner: z.string(),
    due_date: usDateString,
    submission_date: usDateStringOrDash,
    extension_request_pending: z.enum(["Yes", "No"]),
    extension_date_requested: usDateStringOrDash,
    reason_for_extension: z.enum([...DELIVERABLE_EXTENSION_REASON_CODES, "-"]),
    extension_request_comments: z.string(),
    total_extensions_requested: z.int(),
    resubmission_due_date: usDateStringOrDash,
    resubmission_request_comments: z.string(),
    total_resubmissions_requested: z.int(),
    deliverable_status: z.enum(DELIVERABLE_STATUSES),
    last_deliverable_action: z.enum(DELIVERABLE_ACTION_TYPES),
    last_deliverable_action_date: usDateString,
    updated_post_acceptance: z.enum(["Yes", "No"]),
    deliverable_reviewer: z.string(),
    deliverable_review_date: usDateStringOrDash,
    budget_neutrality_variance: z.string(),
    actuals: z.enum(["Actuals Only", "Actuals + Projected", "-"]),
    public_comments: z.string(),
    private_comments: z.string(),
  } satisfies OnDemandReportColumnSchema<DeliverableStatusReportColumn>)
  .strict();

const deliverableStatusReportColumnHeaders = {
  state: { columnName: "State/Territory" },
  demonstration_title: { columnName: "Demonstration Title" },
  demonstration_number: { columnName: "Demonstration Number" },
  effective_date: { columnName: "Effective Date" },
  expiration_date: { columnName: "Expiration Date" },
  primary_project_officer: { columnName: "Primary Project Officer" },
  ddme_analyst: { columnName: "DDME Analyst" },
  deliverable_type: { columnName: "Deliverable Type" },
  deliverable_name: { columnName: "Deliverable Name" },
  demonstration_types: { columnName: "Demonstration Type" },
  cms_owner: { columnName: "CMS Owner" },
  due_date: { columnName: "Due Date" },
  submission_date: { columnName: "Submission Date" },
  extension_request_pending: { columnName: "Extension Request Pending" },
  extension_date_requested: { columnName: "Extension Date Requested" },
  reason_for_extension: { columnName: "Reason for Extension" },
  extension_request_comments: { columnName: "Extension Request Comments" },
  total_extensions_requested: { columnName: "Total Extensions Requested" },
  resubmission_due_date: { columnName: "Resubmission Due Date" },
  resubmission_request_comments: { columnName: "Resubmission Request Comments" },
  total_resubmissions_requested: { columnName: "Total Resubmissions Requested" },
  deliverable_status: { columnName: "Deliverable Status" },
  last_deliverable_action: { columnName: "Last Deliverable Action" },
  last_deliverable_action_date: { columnName: "Last Deliverable Action Date" },
  updated_post_acceptance: { columnName: "Updated Post Acceptance" },
  deliverable_reviewer: { columnName: "Deliverable Reviewer" },
  deliverable_review_date: { columnName: "Deliverable Review Date" },
  budget_neutrality_variance: { columnName: "Budget Neutrality Variance" },
  actuals: { columnName: "Actuals" },
  public_comments: { columnName: "Public Comments", columnWidth: 100 },
  private_comments: { columnName: "Private Comments", columnWidth: 100 },
} satisfies OnDemandReportColumnConfiguration<DeliverableStatusReportColumn>;

export const deliverableStatusReportConfiguration = {
  sqlQueries: deliverableStatusReportQueries,
  reportRowSchema: deliverableStatusReportSchema,
  excelConfiguration: { columns: deliverableStatusReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
