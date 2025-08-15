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
});
