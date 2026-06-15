import { z } from "zod";
import {
  DELIVERABLE_ACTION_TYPES,
  DELIVERABLE_EXTENSION_REASON_CODES,
  DELIVERABLE_STATUSES,
  DELIVERABLE_TYPES,
  STATES_AND_TERRITORIES,
} from "../../constants";
import {
  OnDemandReportColumnHeader,
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
  | "actuals";

const deliverableStatusReportSchema = z
  .object({
    state: z.enum(STATES_AND_TERRITORIES.map((state) => state.id)),
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
    actuals: z.enum(["Actual", "Actual + Projected", "-"]),
  } satisfies OnDemandReportColumnSchema<DeliverableStatusReportColumn>)
  .strict();

const deliverableStatusReportColumnHeaders = {
  state: "State/Territory",
  demonstration_title: "Demonstration Title",
  demonstration_number: "Demonstration Number",
  effective_date: "Effective Date",
  expiration_date: "Expiration Date",
  primary_project_officer: "Primary Project Officer",
  ddme_analyst: "DDME Analyst",
  deliverable_type: "Deliverable Type",
  deliverable_name: "Deliverable Name",
  demonstration_types: "Demonstration Type",
  cms_owner: "CMS Owner",
  due_date: "Due Date",
  submission_date: "Submission Date",
  extension_request_pending: "Extension Request Pending",
  extension_date_requested: "Extension Date Requested",
  reason_for_extension: "Reason for Extension",
  extension_request_comments: "Extension Request Comments",
  total_extensions_requested: "Total Extensions Requested",
  resubmission_due_date: "Resubmission Due Date",
  resubmission_request_comments: "Resubmission Request Comments",
  total_resubmissions_requested: "Total Resubmissions Requested",
  deliverable_status: "Deliverable Status",
  last_deliverable_action: "Last Deliverable Action",
  last_deliverable_action_date: "Last Deliverable Action Date",
  updated_post_acceptance: "Updated Post Acceptance",
  deliverable_reviewer: "Deliverable Reviewer",
  deliverable_review_date: "Deliverable Review Date",
  budget_neutrality_variance: "Budget Neutrality Variance",
  actuals: "Actuals",
} satisfies OnDemandReportColumnHeader<DeliverableStatusReportColumn>;

export const deliverableStatusReportConfiguration = {
  sqlQueries: deliverableStatusReportQueries,
  reportRowSchema: deliverableStatusReportSchema,
  excelConfiguration: { columnNames: deliverableStatusReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
