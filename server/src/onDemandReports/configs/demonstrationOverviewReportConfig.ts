import { z } from "zod";
import {
  OnDemandReportColumnHeader,
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
  state_territory: "State/Territory",
  demonstration_title: "Demonstration Title",
  demonstration_number: "Demonstration Number",
  chip_id: "CHIP ID",
  status: "Status",
  status_update_date: "Status Update Date",
  sdg_division: "SDG Division",
  signature_level: "Signature Level",
  effective_date: "Demonstration Effective Date",
  expiration_date: "Demonstration Expiration Date",
  extension_in_progress: "Extension in Progress",
  amendment_in_progress: "Amendment in Progress",
  approved_amendment_applications: "Approved Amendment Applications",
  primary_project_officer: "Primary Project Officer",
  project_officers: "Project Officers",
  primary_policy_tech_director: "Primary Policy Technical Director",
  primary_ddme_analyst: "Primary DDME Analyst",
  ddme_analysts: "DDME Analysts",
  primary_state_poc: "Primary State POC",
  state_pocs: "State POCs",
  primary_monitoring_evaluation_tech_director: "Primary Monitoring & Evaluation Technical Director",
  application_approval_date: "Application Approval Date",
} satisfies OnDemandReportColumnHeader<DemonstrationOverviewReportColumn>;

export const demonstrationOverviewReportConfiguration = {
  sqlQueries: demonstrationOverviewReportQueries,
  reportRowSchema: demonstrationOverviewReportSchema,
  excelConfiguration: { columnNames: demonstrationOverviewReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
