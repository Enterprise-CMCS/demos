import { z } from "zod";
import { isValid, parse } from "date-fns";

export const usDateString = z
  .string()
  .refine((value) => isValid(parse(value, "MM/dd/yyyy", new Date())), {
    message: "Expected a valid MM/DD/YYYY date",
  });

export const usDateStringOrDash = z.union([usDateString, z.literal("-")]);
