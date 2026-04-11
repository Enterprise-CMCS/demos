import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("calls onSelectYear with the year number when a year is selected", async () => {
    const user = userEvent.setup();
    const onSelectYear = vi.fn();
    render(
      <QuarterlyDeliverableSchedule
        onSelectYear={onSelectYear}
        demonstrationEffectiveDate={new Date("2024-01-01")}
        demonstrationExpirationDate={new Date("2026-12-31")}
      />
    );

    await user.selectOptions(screen.getByRole("combobox"), "Year 2");

    expect(onSelectYear).toHaveBeenCalledWith(2);
  });

  it("displays provided quarterly due dates in the date pickers", () => {
    render(
      <QuarterlyDeliverableSchedule
        onSelectYear={vi.fn()}
        quarterlyDueDates={["2026-01-15", "2026-04-15", "2026-07-15", "2026-10-15"]}
      />
    );

    expect(screen.getByTestId("quarter-1")).toHaveValue("2026-01-15");
    expect(screen.getByTestId("quarter-2")).toHaveValue("2026-04-15");
    expect(screen.getByTestId("quarter-3")).toHaveValue("2026-07-15");
    expect(screen.getByTestId("quarter-4")).toHaveValue("2026-10-15");
  });

  it("calls onSelectQuarterDate with the correct quarter index and date when a date is changed", () => {
    const onSelectQuarterDate = vi.fn();
    render(
      <QuarterlyDeliverableSchedule
        onSelectYear={vi.fn()}
        onSelectQuarterDate={onSelectQuarterDate}
      />
    );

    fireEvent.change(screen.getByTestId("quarter-3"), { target: { value: "2026-07-15" } });

    expect(onSelectQuarterDate).toHaveBeenCalledWith(2, "2026-07-15");
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
