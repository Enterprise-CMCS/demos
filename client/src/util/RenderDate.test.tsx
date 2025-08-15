/* eslint-disable no-nonstandard-date-rendering/no-nonstandard-date-rendering */

import { renderDate, renderTimestamp, renderDateTime } from "./RenderDate";

describe("RenderDate utilities", () => {
  const testDate = new Date("2023-04-15T13:45:30Z");
  const leapYearDate = new Date("2024-02-29T23:59:59Z");
  const startOfYear = new Date("2022-01-01T00:00:00Z");
  const endOfYear = new Date("2022-12-31T23:59:59Z");
  const noon = new Date("2023-07-04T12:00:00Z");
  const midnight = new Date("2023-07-04T00:00:00Z");
  const singleDigitMonthDay = new Date("2023-03-05T07:08:09Z");

  it("formats date as MM/dd/yyyy", () => {
    expect(renderDate(testDate)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(renderDate(leapYearDate)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(renderDate(startOfYear)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(renderDate(endOfYear)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(renderDate(noon)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(renderDate(midnight)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(renderDate(singleDigitMonthDay)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("formats timestamp as ISO string", () => {
    expect(renderTimestamp(testDate)).toBe(testDate.toISOString());
    expect(renderTimestamp(leapYearDate)).toBe(leapYearDate.toISOString());
    expect(renderTimestamp(startOfYear)).toBe(startOfYear.toISOString());
    expect(renderTimestamp(endOfYear)).toBe(endOfYear.toISOString());
    expect(renderTimestamp(noon)).toBe(noon.toISOString());
    expect(renderTimestamp(midnight)).toBe(midnight.toISOString());
    expect(renderTimestamp(singleDigitMonthDay)).toBe(singleDigitMonthDay.toISOString());
  });

  it("formats date and time as MM/dd/yyyy HH:mm", () => {
    expect(renderDateTime(testDate)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(renderDateTime(leapYearDate)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(renderDateTime(startOfYear)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(renderDateTime(endOfYear)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(renderDateTime(noon)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(renderDateTime(midnight)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(renderDateTime(singleDigitMonthDay)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it("handles single-digit months and days", () => {
    expect(renderDate(singleDigitMonthDay)).toMatch(/^03\/05\/2023$/);
    expect(renderDateTime(singleDigitMonthDay)).toMatch(/^03\/05\/2023 07:08$/);
  });

  it("displays UTC dates in local time", () => {
    const utcDate = new Date(Date.UTC(2023, 0, 2, 0, 0, 0)); // Jan 2, 2023, 00:00:00 UTC

    // The rendered date should match the local date for that UTC instant
    // (e.g., if your local timezone is GMT-5, this will be Jan 1, 2023, 19:00:00 local)
    const localDateString = utcDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    expect(renderDate(utcDate)).toBe(localDateString);

    // The rendered datetime should match the local time for that UTC instant
    const localDateTimeString = `${localDateString} ${utcDate.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}`;
    expect(renderDateTime(utcDate)).toBe(localDateTimeString);
  });
});
