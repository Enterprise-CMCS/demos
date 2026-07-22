import { describe, it, expect } from "vitest";
import { sanitizeDownloadFileName } from "./sanitizeDownloadFileName";

describe("sanitizeDownloadFileName", () => {
  const fallback = "123e4567-e89b-12d3-a456-426614174000";

  it("returns a normal name unchanged", () => {
    expect(sanitizeDownloadFileName("Quarterly Report", fallback)).toBe("Quarterly Report");
  });

  it("keeps characters that are valid in file names", () => {
    const name = "Smith & Jones_final v2.1 (draft) #3, 100% approved";
    expect(sanitizeDownloadFileName(name, fallback)).toBe(name);
  });

  it("keeps non-ASCII characters", () => {
    expect(sanitizeDownloadFileName("Café Résumé – naïve", fallback)).toBe("Café Résumé – naïve");
  });

  it("replaces characters that are invalid in file names with a space", () => {
    expect(sanitizeDownloadFileName("Budget FY25/26", fallback)).toBe("Budget FY25 26");
  });

  it("collapses the whitespace left behind by a run of invalid characters", () => {
    expect(sanitizeDownloadFileName('DEMOS-892 (3) \\ / : * ? " < > |', fallback)).toBe(
      "DEMOS-892 (3)"
    );
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
    expect(sanitizeDownloadFileName("", "reports/on-demand/abc")).toBe("reports on-demand abc");
  });
});
