// Vitest and other helpers
import { describe, it, expect } from "vitest";

// Types
import { ZodError } from "zod";

// Functions under test
import { usDateString, usDateStringOrDash } from "./onDemandReportCustomSchemaTypes";

describe("onDemandReportCustomSchemaTypes", () => {
  describe("usDateString", () => {
    it("accepts a valid MM/DD/YYYY date", () => {
      expect(usDateString.safeParse("06/10/2026").success).toBe(true);
    });

    it("rejects an impossible calendar date", () => {
      expect(usDateString.safeParse("02/31/2026").success).toBe(false);
    });

    it("rejects a non-MM/DD/YYYY format", () => {
      expect(usDateString.safeParse("2026-06-10").success).toBe(false);
    });

    it("rejects the dash sentinel", () => {
      expect(usDateString.safeParse("-").success).toBe(false);
    });

    it("throws a ZodError with the custom message when parsing an invalid date", () => {
      expect(() => usDateString.parse("02/31/2026")).toThrow(ZodError);

      const result = usDateString.safeParse("02/31/2026");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0]).toMatchObject({
          code: "custom",
          message: "Expected a valid MM/DD/YYYY date",
        });
      }
    });
  });

  describe("usDateStringOrDash", () => {
    it("accepts a valid MM/DD/YYYY date", () => {
      expect(usDateStringOrDash.safeParse("06/10/2026").success).toBe(true);
    });

    it("accepts the dash sentinel", () => {
      expect(usDateStringOrDash.safeParse("-").success).toBe(true);
    });

    it("rejects an invalid date string", () => {
      expect(usDateStringOrDash.safeParse("13/01/2026").success).toBe(false);
    });
  });
});
