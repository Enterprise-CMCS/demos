import React from "react";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DatePicker } from "./DatePicker";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";

export async function pickDateInCalendar({
  datePickerRoot,
  year,
  month,
  day,
}: {
  datePickerRoot: HTMLElement;
  year: string | number;
  month: string | number;
  day: string | number;
}) {
  // Open the calendar widget by clicking the icon button
  const openPickerButton = within(datePickerRoot).getByRole("button", {
    name: /choose date/i,
  });
  expect(openPickerButton).toBeInTheDocument();
  await userEvent.click(openPickerButton);

  console.log(openPickerButton); // Should be the calendar icon button
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

  // Assert correct month is shown
  const monthName =
    typeof month === "number"
      ? dayjs()
        .month(Number(month) - 1)
        .format("MMMM")
      : String(month);
  const header = screen.getByText(new RegExp(`${monthName} ${year}`));
  expect(header).toBeInTheDocument();

  // Select day
  const dayButton = screen.getByRole("gridcell", { name: String(day) });
  expect(dayButton).toBeInTheDocument();
  await userEvent.click(dayButton);

  // Optionally, confirm selection if your widget requires it
  const okButton = screen.queryByRole("button", { name: /ok|confirm/i });
  if (okButton) {
    expect(okButton).toBeInTheDocument();
    await userEvent.click(okButton);
  }
}

describe("Input component", () => {
  it("renders label and input", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker label="this is the label">Test Date Picker</DatePicker>
      </LocalizationProvider>
    );
    expect(
      screen.getByText("this is the label", { selector: "label" })
    ).toBeInTheDocument();

    expect(screen.getByRole("group")).toBeInTheDocument();

    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("renders with defaultValue", () => {
    const now = dayjs();
    const Component = () => {
      return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker value={now} />
        </LocalizationProvider>
      );
    };
    render(<Component />);
    expect(
      screen.getByDisplayValue(now.format("MM/DD/YYYY"))
    ).toBeInTheDocument();
  });

  it("renders as disabled when isDisabled is true", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          name="required-date-picker"
          onChange={(value) => {
            pickedValue = value ? value.format("MM/DD/YYYY") : undefined;
          }}
        />
      </LocalizationProvider>
    );
    const input = screen
      .getByRole("group")
      .querySelector("input[name=\"required-date-picker\"]");
    expect(input).not.toBeNull();
    const datePickerRoot = input!.closest("[role=\"group\"]");
    expect(datePickerRoot).not.toBeNull();

    await pickDateInCalendar({
      datePickerRoot: datePickerRoot as HTMLElement,
      year: 2025,
      month: "July",
      day: 4,
    });

    expect(pickedValue).toBe("07/04/2025");
  });
});
