import { z } from "zod";

export const basicTestReportSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});
