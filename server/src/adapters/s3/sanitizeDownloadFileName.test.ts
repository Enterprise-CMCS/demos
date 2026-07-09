import { describe, it, expect } from "vitest";
import { sanitizeDownloadFileName } from "./sanitizeDownloadFileName";

describe("sanitizeDownloadFileName", () => {
  const fallback = "123e4567-e89b-12d3-a456-426614174000";

  it("returns a normal name unchanged", () => {
    expect(sanitizeDownloadFileName("Quarterly Report", fallback)).toBe("Quarterly Report");
  });

  it("strips characters that are invalid in file names", () => {
    expect(sanitizeDownloadFileName('Report: Q1/Q2 "final"', fallback)).toBe("Report Q1Q2 final");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeDownloadFileName("  spaced out  ", fallback)).toBe("spaced out");
  });

  it("falls back to the provided UUID when the name is entirely invalid", () => {
    expect(sanitizeDownloadFileName("///", fallback)).toBe(fallback);
  });

  it("falls back when the name is empty", () => {
    expect(sanitizeDownloadFileName("", fallback)).toBe(fallback);
  });

  it("sanitizes the fallback itself if it contains separators", () => {
    expect(sanitizeDownloadFileName("", "reports/on-demand/abc")).toBe("reportson-demandabc");
  });
});
