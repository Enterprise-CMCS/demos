import { z } from "zod";
import {
  OnDemandReportColumnConfiguration,
  OnDemandReportColumnSchema,
  OnDemandReportConfiguration,
} from "./onDemandReportConfigTypes";
import { demonstrationOverviewReportQueries } from "./demonstrationOverviewReportQueries";
import {
  APPLICATION_STATUS,
  SDG_DIVISIONS,
  SIGNATURE_LEVEL,
  STATES_AND_TERRITORIES,
} from "../../constants";
import { usDateString, usDateStringOrDash } from "./onDemandReportCustomSchemaTypes";

type DemonstrationOverviewReportColumn =
  | "state_territory"
  | "demonstration_title"
  | "demonstration_number"
  | "chip_id"
  | "status"
  | "status_update_date"
  | "sdg_division"
  | "signature_level"
  | "effective_date"
  | "expiration_date"
  | "extension_in_progress"
  | "amendment_in_progress"
  | "approved_amendment_applications"
  | "primary_project_officer"
  | "project_officers"
  | "primary_policy_tech_director"
  | "primary_ddme_analyst"
  | "ddme_analysts"
  | "primary_state_poc"
  | "state_pocs"
  | "primary_monitoring_evaluation_tech_director"
  | "application_approval_date";

export const demonstrationOverviewReportSchema = z
  .object({
    state_territory: z.enum(STATES_AND_TERRITORIES.map((state) => state.id)),
    demonstration_title: z.string(),
    demonstration_number: z.string(),
    chip_id: z.string(),
    status: z.enum(APPLICATION_STATUS),
    status_update_date: usDateString,
    sdg_division: z.enum([...SDG_DIVISIONS, "-"]),
    signature_level: z.enum([...SIGNATURE_LEVEL, "-"]),
    effective_date: usDateStringOrDash,
    expiration_date: usDateStringOrDash,
    extension_in_progress: z.enum(["Yes", "No"]),
    amendment_in_progress: z.enum(["Yes", "No"]),
    approved_amendment_applications: z.int(),
    primary_project_officer: z.string(),
    project_officers: z.string(),
    primary_policy_tech_director: z.string(),
    primary_ddme_analyst: z.string(),
    ddme_analysts: z.string(),
    primary_state_poc: z.string(),
    state_pocs: z.string(),
    primary_monitoring_evaluation_tech_director: z.string(),
    application_approval_date: usDateStringOrDash,
  } satisfies OnDemandReportColumnSchema<DemonstrationOverviewReportColumn>)
  .strict();

export const demonstrationOverviewReportColumnHeaders = {
  state_territory: { columnName: "State/Territory" },
  demonstration_title: { columnName: "Demonstration Title" },
  demonstration_number: { columnName: "Demonstration Number" },
  chip_id: { columnName: "CHIP ID" },
  status: { columnName: "Status" },
  status_update_date: { columnName: "Status Update Date" },
  sdg_division: { columnName: "SDG Division" },
  signature_level: { columnName: "Signature Level" },
  effective_date: { columnName: "Demonstration Effective Date" },
  expiration_date: { columnName: "Demonstration Expiration Date" },
  extension_in_progress: { columnName: "Extension in Progress" },
  amendment_in_progress: { columnName: "Amendment in Progress" },
  approved_amendment_applications: { columnName: "Approved Amendment Applications" },
  primary_project_officer: { columnName: "Primary Project Officer" },
  project_officers: { columnName: "Project Officers" },
  primary_policy_tech_director: { columnName: "Primary Policy Technical Director" },
  primary_ddme_analyst: { columnName: "Primary DDME Analyst" },
  ddme_analysts: { columnName: "DDME Analysts" },
  primary_state_poc: { columnName: "Primary State POC" },
  state_pocs: { columnName: "State POCs" },
  primary_monitoring_evaluation_tech_director: {
    columnName: "Primary Monitoring & Evaluation Technical Director",
  },
  application_approval_date: { columnName: "Application Approval Date" },
} satisfies OnDemandReportColumnConfiguration<DemonstrationOverviewReportColumn>;

export const demonstrationOverviewReportConfiguration = {
  sqlQueries: demonstrationOverviewReportQueries,
  reportRowSchema: demonstrationOverviewReportSchema,
  excelConfiguration: { columns: demonstrationOverviewReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
