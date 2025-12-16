import { describe, it, expect } from "vitest";
import { TZDate } from "@date-fns/tz";
import { DateTimeOrLocalDate } from "../../types.js";
import { resolveEffectiveAndExpirationDates } from "./resolveEffectiveAndExpirationDates.js";

describe("resolveEffectiveAndExpirationDates", () => {
  const startOfDayDateTime =
    "2025-01-01T00:00:00.000-05:00" as DateTimeOrLocalDate;

  const endOfDayDateTime =
    "2025-01-31T23:59:59.999-05:00" as DateTimeOrLocalDate;

  const localDate =
    "2025-10-31" as DateTimeOrLocalDate;

  it("should return an empty object when no date inputs are provided", () => {
    const result = resolveEffectiveAndExpirationDates({});

    expect(result).toEqual({});
  });

  it("should parse and return an effectiveDate at start of day", () => {
    const result = resolveEffectiveAndExpirationDates({
      effectiveDate: startOfDayDateTime,
    });

    expect(result.effectiveDate).toBeInstanceOf(TZDate);
    expect(result).not.toHaveProperty("expirationDate");
  });

  it("should parse and return an expirationDate at end of day", () => {
    const result = resolveEffectiveAndExpirationDates({
      expirationDate: endOfDayDateTime,
    });

    expect(result.expirationDate).toBeInstanceOf(TZDate);
    expect(result).not.toHaveProperty("effectiveDate");
  });

  it("should parse local dates into Eastern TZ dates", () => {
    const result = resolveEffectiveAndExpirationDates({
      effectiveDate: localDate,
      expirationDate: localDate,
    });

    expect(result.effectiveDate).toBeInstanceOf(TZDate);
    expect(result.expirationDate).toBeInstanceOf(TZDate);
  });

  it("should explicitly set dates to null when input is null", () => {
    const result = resolveEffectiveAndExpirationDates({
      effectiveDate: null,
      expirationDate: null,
    });

    expect(result).toEqual({
      effectiveDate: null,
      expirationDate: null,
    });
  });

  it("should normalize effectiveDate to start of day", () => {
    const result = resolveEffectiveAndExpirationDates({
      effectiveDate: "2025-01-01T12:34:56.000-05:00" as DateTimeOrLocalDate,
    });

    expect(result.effectiveDate).toBeInstanceOf(TZDate);
    expect(result.effectiveDate!.getHours()).toBe(0);
    expect(result.effectiveDate!.getMinutes()).toBe(0);
  });

  it("should normalize expirationDate to end of day", () => {
    const result = resolveEffectiveAndExpirationDates({
      expirationDate: "2025-01-31T12:00:00.000-05:00" as DateTimeOrLocalDate,
    });

    expect(result.expirationDate).toBeInstanceOf(TZDate);
    expect(result.expirationDate!.getHours()).toBe(23);
    expect(result.expirationDate!.getMinutes()).toBe(59);
  });
});
