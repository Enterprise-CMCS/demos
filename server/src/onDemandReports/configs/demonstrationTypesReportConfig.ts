import { z } from "zod";
import { APPLICATION_STATUS, STATES_AND_TERRITORIES } from "../../constants";
import {
  OnDemandReportColumnConfiguration,
  OnDemandReportColumnSchema,
  OnDemandReportConfiguration,
} from "./onDemandReportConfigTypes";
import { demonstrationTypesReportQueries } from "./demonstrationTypesReportQueries";
import { usDateString, usDateStringOrDash } from "./onDemandReportCustomSchemaTypes";

type DemonstrationTypesReportColumn =
  | "state_territory"
  | "demonstration_title"
  | "demonstration_number"
  | "chip_id"
  | "status"
  | "status_update_date"
  | "demonstration_effective_date"
  | "demonstration_expiration_date"
  | "primary_project_officer"
  | "primary_state_poc"
  | "application_approval_date"
  | "demonstration_type"
  | "demonstration_type_effective_date"
  | "demonstration_type_expiration_date";

const demonstrationTypesReportSchema = z
  .object({
    state_territory: z.enum(STATES_AND_TERRITORIES.map((state) => state.name)),
    demonstration_title: z.string(),
    demonstration_number: z.string(),
    chip_id: z.string(),
    status: z.enum(APPLICATION_STATUS),
    status_update_date: usDateString,
    demonstration_effective_date: usDateStringOrDash,
    demonstration_expiration_date: usDateStringOrDash,
    primary_project_officer: z.string(),
    primary_state_poc: z.string(),
    application_approval_date: usDateStringOrDash,
    demonstration_type: z.string(),
    demonstration_type_effective_date: usDateString,
    demonstration_type_expiration_date: usDateString,
  } satisfies OnDemandReportColumnSchema<DemonstrationTypesReportColumn>)
  .strict();

const demonstrationTypesReportColumnHeaders = {
  state_territory: { columnName: "State/Territory" },
  demonstration_title: { columnName: "Demonstration Title" },
  demonstration_number: { columnName: "Demonstration Number" },
  chip_id: { columnName: "CHIP ID" },
  status: { columnName: "Status" },
  status_update_date: { columnName: "Status Update Date" },
  demonstration_effective_date: { columnName: "Demonstration Effective Date" },
  demonstration_expiration_date: { columnName: "Demonstration Expiration Date" },
  primary_project_officer: { columnName: "Primary Project Officer" },
  primary_state_poc: { columnName: "Primary State POC" },
  application_approval_date: { columnName: "Application Approval Date" },
  demonstration_type: { columnName: "Demonstration Type" },
  demonstration_type_effective_date: { columnName: "Demonstration Type Effective Date" },
  demonstration_type_expiration_date: { columnName: "Demonstration Type Expiration Date" },
} satisfies OnDemandReportColumnConfiguration<DemonstrationTypesReportColumn>;

export const demonstrationTypesReportConfiguration = {
  sqlQueries: demonstrationTypesReportQueries,
  reportRowSchema: demonstrationTypesReportSchema,
  excelConfiguration: { columns: demonstrationTypesReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
