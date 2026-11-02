import { describe, it, expect } from "vitest";
import { TZDate } from "@date-fns/tz";
import { parseAndValidateEffectiveAndExpirationDates } from "./parseAndValidateEffectiveAndExpirationDates.js";

describe("parseAndValidateEffectiveAndExpirationDates", () => {
  const localDate = "2025-10-31";

  it("should return an empty object when no date inputs are provided", () => {
    const result = parseAndValidateEffectiveAndExpirationDates({});

    expect(result).toEqual({});
  });

  it("should parse local dates into Eastern TZ dates", () => {
    const result = parseAndValidateEffectiveAndExpirationDates({
      effectivePlainDate: localDate,
      expirationPlainDate: localDate,
    });

    expect(result.effectiveDate).toBeInstanceOf(TZDate);
    expect(result.expirationDate).toBeInstanceOf(TZDate);
  });

  it("should explicitly set dates to null when input is null", () => {
    const result = parseAndValidateEffectiveAndExpirationDates({
      effectivePlainDate: null,
      expirationPlainDate: null,
    });

    expect(result).toEqual({
      effectiveDate: null,
      expirationDate: null,
    });
  });

  it("should normalize effectiveDate to start of day", () => {
    const result = parseAndValidateEffectiveAndExpirationDates({
      effectivePlainDate: localDate,
    });

    expect(result.effectiveDate).toBeInstanceOf(TZDate);
    expect(result.effectiveDate!.getHours()).toBe(0);
    expect(result.effectiveDate!.getMinutes()).toBe(0);
    expect(result.effectiveDate!.getSeconds()).toBe(0);
  });

  it("should normalize expirationDate to end of day", () => {
    const result = parseAndValidateEffectiveAndExpirationDates({
      expirationPlainDate: localDate,
    });

    expect(result.expirationDate).toBeInstanceOf(TZDate);
    expect(result.expirationDate!.getHours()).toBe(23);
    expect(result.expirationDate!.getMinutes()).toBe(59);
    expect(result.expirationDate!.getSeconds()).toBe(59);
  });
});
