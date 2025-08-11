import React from "react";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DatePicker } from "./DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { format, isAfter, parse } from "date-fns";

// this assumes the date is in the past.
export async function pickDateInCalendar({
  datePickerRoot,
  year,
  month,
  day,
}: {
  datePickerRoot: HTMLElement;
  year: number;
  month: number;
  day: number;
}) {
  // Open the calendar widget by clicking the icon button
  const openPickerButton = within(datePickerRoot).getByRole("button", {
    name: /choose date/i,
  });
  expect(openPickerButton).toBeInTheDocument();
  await userEvent.click(openPickerButton);

  await waitFor(() => {
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // Switch to year view
  const switchViewButton = screen.getByLabelText(/switch to year view/i);
  expect(switchViewButton).toBeInTheDocument();
  await userEvent.click(switchViewButton);

  // Assert year view is open
  const yearViewButton = screen.getByLabelText(/switch to calendar view/i);
  expect(yearViewButton).toBeInTheDocument();

  // Select year
  const yearButton = screen.getByRole("radio", { name: String(year) });
  expect(yearButton).toBeInTheDocument();
  await userEvent.click(yearButton);

  // Navigate to the correct month
  const targetDate = new Date(year, month - 1);
  const targetMonthName = format(targetDate, "MMMM");

  // Keep clicking appropriate direction until we reach the target month
  const calendarDialog = screen.getByRole("dialog");
  let currentMonthHeader = calendarDialog.querySelector(".MuiPickersCalendarHeader-label");
  let monthNavigationCount = 0;
  const maxMonthNavigations = 12;

  while (
    !currentMonthHeader?.textContent?.includes(targetMonthName) &&
    monthNavigationCount < maxMonthNavigations
  ) {
    // Parse current month and year from header
    const currentHeaderText = currentMonthHeader?.textContent || "";
    const currentDate = parse(currentHeaderText, "MMMM yyyy", new Date());

    // Determine if we need to go forward or backward
    const shouldGoForward = isAfter(currentDate, "month");

    const navigationButton = shouldGoForward
      ? screen.getByRole("button", { name: "Next month" })
      : screen.getByRole("button", { name: "Previous month" });

    await userEvent.click(navigationButton);
    monthNavigationCount++;

    // Wait for the month to change
    await waitFor(() => {
      currentMonthHeader = calendarDialog.querySelector(".MuiPickersCalendarHeader-label");
    });
  }

  // Select day - find the active day button (not from adjacent months)
  const dayButtons = screen.getAllByRole("gridcell", { name: String(day) });
  const activeDayButton = dayButtons.find(
    (button) =>
      !button.hasAttribute("disabled") &&
      !button.classList.contains("MuiPickersDay-dayOutsideMonth")
  );

  expect(activeDayButton).toBeDefined();
  await userEvent.click(activeDayButton!);
}

describe("Input component", () => {
  it("renders label and input", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker>Date Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(screen.getByText("Date Picker")).toBeInTheDocument();

    expect(screen.getByRole("group")).toBeInTheDocument();

    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("renders required asterisk when required is true", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker required>Required Date Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("Required Date Picker")).toBeInTheDocument();

    expect(screen.getByRole("group")).toBeInTheDocument();

    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("does not render required asterisk when required is false", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker>Not-Required Date Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
    expect(screen.getByText("Not-Required Date Picker")).toBeInTheDocument();

    expect(screen.getByRole("group")).toBeInTheDocument();

    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker label="this is the label">Test Date Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(screen.getByText("this is the label", { selector: "label" })).toBeInTheDocument();

    expect(screen.getByRole("group")).toBeInTheDocument();

    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("renders with defaultValue", () => {
    const now = new Date();
    const Component = () => {
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker value={now} />
        </LocalizationProvider>
      );
    };
    render(<Component />);
    expect(screen.getByDisplayValue(format(now, "MM/dd/yyyy"))).toBeInTheDocument();
  });

  it("renders as disabled when isDisabled is true", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker disabled>Disabled Date Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
    const month = screen.getByLabelText("Month");
    const day = screen.getByLabelText("Day");
    const year = screen.getByLabelText("Year");
    expect(month).toHaveAttribute("aria-disabled", "true");
    expect(day).toHaveAttribute("aria-disabled", "true");
    expect(year).toHaveAttribute("aria-disabled", "true");
  });

  it("calls onChange when value changes", async () => {
    const handleChange = vi.fn();
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker onChange={handleChange} />
      </LocalizationProvider>
    );
    // Fill out all sections to form a valid date
    const month = screen.getByLabelText("Month");
    const day = screen.getByLabelText("Day");
    const year = screen.getByLabelText("Year");
    await userEvent.clear(month);
    await userEvent.type(month, "12");
    await userEvent.clear(day);
    await userEvent.type(day, "25");
    await userEvent.clear(year);
    await userEvent.type(year, "2025");
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders time picker sections", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker type="time">Test Time Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(screen.getByLabelText(/hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minutes/i)).toBeInTheDocument();
    const ampm = screen.queryByLabelText(/meridiem/i);
    expect(ampm).toBeInTheDocument();
  });

  it("renders datetime picker", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker type="datetime">Test Time Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(screen.getByLabelText(/month/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minutes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meridiem/i)).toBeInTheDocument();
  });

  it("updates value correctly", async () => {
    let pickedValue: string | undefined;
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          name="required-date-picker"
          onChange={(value) => {
            pickedValue = value ? format(value, "MM/dd/yyyy") : undefined;
          }}
        />
      </LocalizationProvider>
    );
    const input = screen.getByRole("group").querySelector('input[name="required-date-picker"]');
    expect(input).not.toBeNull();
    const datePickerRoot = input!.closest('[role="group"]');
    expect(datePickerRoot).not.toBeNull();

    await pickDateInCalendar({
      datePickerRoot: datePickerRoot as HTMLElement,
      year: 2025,
      month: 7,
      day: 4,
    });

    expect(pickedValue).toBe("07/04/2025");
  });
});
