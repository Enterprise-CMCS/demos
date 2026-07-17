/**
 * Fuzz-style tests for formatDate utilities.
 *
 * Goals:
 * 1. Probe getDateEst with many dates (all months, DST transitions, midnight boundaries)
 * 2. Probe the full pipeline: formatDateForDisplay(getDateEst(serverDate))
 * 3. Test with mocked browser timezones to isolate whether local TZ bleeds into the output
 */
import { vi, afterEach } from "vitest";
import { formatDateForDisplay, getDateEst } from "./formatDate";

afterEach(() => {
  vi.unstubAllEnvs();
});

/**
 * Build an ISO timestamp representing midnight in America/New_York.
 * EDT (UTC-4): mid-March through end of October
 * EST (UTC-5): November through mid-March
 * DST ends the first Sunday of November, so by the 15th the timezone is always EST.
 */
function midnightEasternISO(yyyy: number, mm: number, dd: number): string {
  // EDT runs from ~second Sunday of March through ~first Sunday of November.
  // Using day 15 as the reference: Mar 15-Oct 31 = EDT; Nov 15-Mar 14 = EST.
  const isEDT = (mm >= 4 && mm <= 10) || (mm === 3 && dd >= 15);
  const offset = isEDT ? "04:00:00.000Z" : "05:00:00.000Z";
  const month = String(mm).padStart(2, "0");
  const day = String(dd).padStart(2, "0");
  return `${yyyy}-${month}-${day}T${offset}`;
}

describe("formatDate fuzz", () => {
  describe("getDateEst - one date per month (midnight Eastern timestamp)", () => {
    const cases: [string, string][] = [
      ["2026-01-15T05:00:00.000Z", "2026-01-15"], // EST (UTC-5)
      ["2026-02-10T05:00:00.000Z", "2026-02-10"],
      ["2026-03-20T04:00:00.000Z", "2026-03-20"], // EDTstarts mid-March
      ["2026-04-01T04:00:00.000Z", "2026-04-01"],
      ["2026-05-01T04:00:00.000Z", "2026-05-01"],
      ["2026-06-15T04:00:00.000Z", "2026-06-15"],
      ["2026-07-04T04:00:00.000Z", "2026-07-04"],
      ["2026-08-31T04:00:00.000Z", "2026-08-31"],
      ["2026-09-20T04:00:00.000Z", "2026-09-20"],
      ["2026-10-31T04:00:00.000Z", "2026-10-31"],
      ["2026-11-20T05:00:00.000Z", "2026-11-20"], // EST resumes early Nov
      ["2026-12-31T05:00:00.000Z", "2026-12-31"],
    ];

    it.each(cases)("getDateEst(%s) === %s", (iso, expected) => {
      expect(getDateEst(new Date(iso))).toBe(expected);
    });
  });

  describe("getDateEst - DST transition boundaries", () => {
    it("spring-forward day: just before (EST midnight = T05:00Z)", () => {
      // 2026 DST spring-forward: March 8 at 2am → clocks jump to 3am
      expect(getDateEst(new Date("2026-03-08T05:00:00.000Z"))).toBe("2026-03-08");
    });

    it("spring-forward day: just after (EDT midnight = T04:00Z)", () => {
      expect(getDateEst(new Date("2026-03-09T04:00:00.000Z"))).toBe("2026-03-09");
    });

    it("fall-back day: just before (EDT midnight = T04:00Z)", () => {
      // 2026 DST fall-back: November 1 at 2am → clocks fall back to 1am
      expect(getDateEst(new Date("2026-11-01T04:00:00.000Z"))).toBe("2026-11-01");
    });

    it("fall-back day: just after (EST midnight = T05:00Z)", () => {
      expect(getDateEst(new Date("2026-11-02T05:00:00.000Z"))).toBe("2026-11-02");
    });
  });

  describe("getDateEst - midnight UTC inputs (possible off-by-one)", () => {
    it("2026-09-20T00:00:00.000Z should NOT be treated as Sep 20 (it is Sep 19 at 8pm EDT)", () => {
      // This test documents the expected behavior when the server stores midnight UTC.
      // midnight UTC in EDT = 2026-09-19T20:00 → getDateEst returns 2026-09-19.
      // If this is failing in production it means the server is using midnight UTC instead of midnight Eastern.
      const result = getDateEst(new Date("2026-09-20T00:00:00.000Z"));
      expect(result).toBe("2026-09-19"); // correct: 8pm EDT the prior day
    });

    it("2026-01-15T00:00:00.000Z should return Jan 14 (it is Jan 14 at 7pm EST)", () => {
      const result = getDateEst(new Date("2026-01-15T00:00:00.000Z"));
      expect(result).toBe("2026-01-14");
    });
  });

  describe("formatDateForDisplay(getDateEst(serverDate)) - full pipeline", () => {
    const cases: [string, string][] = [
      ["2026-09-20T04:00:00.000Z", "09/20/2026"],
      ["2026-01-15T05:00:00.000Z", "01/15/2026"],
      ["2026-07-04T04:00:00.000Z", "07/04/2026"],
      ["2026-12-31T05:00:00.000Z", "12/31/2026"],
    ];

    it.each(cases)("formatDateForDisplay(getDateEst(new Date(%s))) === %s", (iso, expected) => {
      const result = formatDateForDisplay(getDateEst(new Date(iso)));
      expect(result).toBe(expected);
    });
  });

  const timezonesToMock = [
    "UTC",
    "America/Los_Angeles", // PST/PDT - UTC-8/7
    "America/Chicago", // CST/CDT - UTC-6/5
    "America/Denver", // MST/MDT - UTC-7/6
    "Pacific/Auckland", // NZST - UTC+12/13
    "Asia/Kolkata", // IST  - UTC+5:30
    "Europe/London", // GMT/BST - UTC+0/+1
  ];

  describe("getDateEst is independent of local (browser) timezone", () => {
    it.each(timezonesToMock)(
      "TZ=%s: getDateEst(2026-09-20T04:00:00.000Z) still returns 2026-09-20",
      (tz) => {
        vi.stubEnv("TZ", tz);
        const result = getDateEst(new Date("2026-09-20T04:00:00.000Z"));
        expect(result).toBe("2026-09-20");
      }
    );
  });

  describe("formatDateForDisplay(getDateEst(date)) is independent of local timezone", () => {
    it.each(timezonesToMock)(
      "TZ=%s: full pipeline for 2026-09-20T04:00:00.000Z returns 09/20/2026",
      (tz) => {
        vi.stubEnv("TZ", tz);
        const result = formatDateForDisplay(getDateEst(new Date("2026-09-20T04:00:00.000Z")));
        expect(result).toBe("09/20/2026");
      }
    );
  });

  describe("getDateEst with date-only string input (no time component) - documents limitation", () => {
    it("'2026-09-20' (no time) is parsed as midnight UTC → shifts to 2026-09-19 in EDT", () => {
      const dateOnlyString = "2026-09-20" as unknown as Date;
      // midnight UTC = 2026-09-19T20:00 EDT → getDateEst returns the prior day
      expect(getDateEst(dateOnlyString)).toBe("2026-09-19");
    });

    it("'2026-01-15' (no time) is parsed as midnight UTC → shifts to 2026-01-14 in EST", () => {
      const dateOnlyString = "2026-01-15" as unknown as Date;
      // midnight UTC = 2026-01-14T19:00 EST → getDateEst returns the prior day
      expect(getDateEst(dateOnlyString)).toBe("2026-01-14");
    });
  });

  describe("getDateEst sweep - 15th of every month, 2025-2027", () => {
    for (let year = 2025; year <= 2027; year++) {
      for (let month = 1; month <= 12; month++) {
        const iso = midnightEasternISO(year, month, 15);
        const expected = `${year}-${String(month).padStart(2, "0")}-15`;
        it(`getDateEst(${iso}) === ${expected}`, () => {
          expect(getDateEst(new Date(iso))).toBe(expected);
        });
      }
    }
  });
});
