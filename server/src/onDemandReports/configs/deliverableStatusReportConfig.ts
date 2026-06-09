import { z } from "zod";
import { APPLICATION_STATUS, STATES_AND_TERRITORIES } from "../../constants";
import {
  OnDemandReportColumnHeader,
  OnDemandReportColumnSchema,
  OnDemandReportConfiguration,
} from "./onDemandReportConfigTypes";
import { deliverableStatusReportQuery } from "./deliverableStatusReportQuery";

type DeliverableStatusReportColumn = "id" | "name" | "description" | "state" | "status";

const deliverableStatusReportSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    state: z.enum(STATES_AND_TERRITORIES.map((state) => state.id)),
    status: z.enum(APPLICATION_STATUS),
  } satisfies OnDemandReportColumnSchema<DeliverableStatusReportColumn>)
  .strict();

const deliverableStatusReportColumnHeaders = {
  id: "ID",
  name: "Demonstration Name",
  description: "Demonstration Description",
  state: "State Code",
  status: "Demonstration Status",
} satisfies OnDemandReportColumnHeader<DeliverableStatusReportColumn>;

export const deliverableStatusReportConfiguration = {
  sqlQuery: deliverableStatusReportQuery,
  reportRowSchema: deliverableStatusReportSchema,
  excelConfiguration: { columnNames: deliverableStatusReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
