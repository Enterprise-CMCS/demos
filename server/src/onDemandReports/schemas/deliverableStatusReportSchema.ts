import { z } from "zod";
import { APPLICATION_STATUS, STATES_AND_TERRITORIES } from "../../constants";

export const deliverableStatusReportSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    state: z.enum(STATES_AND_TERRITORIES.map((state) => state.id)),
    status: z.enum(APPLICATION_STATUS),
  })
  .strict();
