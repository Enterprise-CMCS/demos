import { z } from "zod";

export const basicTestReportSchema = z
  .object({
    col1: z.string(),
  })
  .strict();
