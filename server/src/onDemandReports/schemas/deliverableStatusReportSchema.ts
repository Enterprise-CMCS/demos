import { z } from "zod";

export const deliverableStatusReportSchema = z
  .object({
    col1: z.string(),
  })
  .strict();
