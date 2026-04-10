import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  getOptionsForYearSelect,
  QuarterlyDeliverableSchedule,
} from "./QuarterlyDeliverableSchedule";

describe("QuarterlyDeliverableSchedule", () => {
  it("renders 4 quarter datepickers", () => {
    render(<QuarterlyDeliverableSchedule onSelectYear={vi.fn()} />);

    expect(screen.getAllByLabelText(/Quarter/i)).toHaveLength(4);
  });

  it("shows correct year options in the year select", () => {
    render(
      <QuarterlyDeliverableSchedule
        onSelectYear={vi.fn()}
        demonstrationEffectiveDate={new Date("2024-01-01")}
        demonstrationExpirationDate={new Date("2026-12-31")}
      />
    );

    const yearSelect = screen.getByRole("combobox") as HTMLSelectElement;
    const options = Array.from(yearSelect.options).map(({ label, value }) => ({ label, value }));

    expect(options).toEqual([
      { label: "Select", value: "" },
      { label: "Year 1", value: "1" },
      { label: "Year 2", value: "2" },
      { label: "Year 3", value: "3" },
    ]);
  });
});

describe("getOptionsForYearSelect", () => {
  it("returns a single year option when dates are in the same calendar year", () => {
    const result = getOptionsForYearSelect(new Date("2026-01-01"), new Date("2026-12-31"));

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns inclusive year options across calendar years", () => {
    const result = getOptionsForYearSelect(new Date("2024-01-01"), new Date("2026-12-31"));

    expect(result).toEqual([
      { label: "Year 1", value: "1" },
      { label: "Year 2", value: "2" },
      { label: "Year 3", value: "3" },
    ]);
  });

  it("returns at least one option when expiration is before effective date", () => {
    const result = getOptionsForYearSelect(new Date("2026-12-31"), new Date("2026-01-01"));

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns a single year option when effective date is undefined", () => {
    const result = getOptionsForYearSelect(undefined, new Date("2026-12-31"));

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns a single year option when expiration date is undefined", () => {
    const result = getOptionsForYearSelect(new Date("2026-01-01"), undefined);

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns a single year option when both dates are undefined", () => {
    const result = getOptionsForYearSelect(undefined, undefined);

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });
});
