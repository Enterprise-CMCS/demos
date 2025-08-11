import React, { useState } from "react";
import { DatePicker, TYPE_DATETIME, TYPE_TIME } from "./DatePicker";
import { isAfter, subDays, addDays } from "date-fns";

export const DatePickerSandbox: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const isInvalidRange = startDate && endDate && isAfter(startDate, endDate);

  // Create wrapper functions to handle the onChange conversion
  const handleSelectedDateChange = (value: Date | null) => {
    setSelectedDate(value);
  };

  const handleStartDateChange = (value: Date | null) => {
    setStartDate(value);
  };

  const handleEndDateChange = (value: Date | null) => {
    setEndDate(value);
  };

  return (
    <>
      <div>
        <DatePicker>Default Date Picker</DatePicker>
        <DatePicker value={selectedDate} onChange={handleSelectedDateChange}>
          Date Picker with onChange behavior
        </DatePicker>
        {selectedDate && (
          <div style={{ color: "green", marginTop: 4 }}>
            You selected: {selectedDate.toString()}
          </div>
        )}
        <DatePicker label="I am a label" value={selectedDate}>
          DatePicker with Label
        </DatePicker>
        <DatePicker required>Required Date Picker</DatePicker>
        <DatePicker disabled>Disabled Date Picker</DatePicker>
        <DatePicker type={TYPE_TIME}>Time Picker</DatePicker>
        <DatePicker type={TYPE_DATETIME}>DateTime Picker</DatePicker>
        <DatePicker type={TYPE_DATETIME} value={startDate} onChange={handleStartDateChange}>
          Basic Linked DateTime Picker - Start
        </DatePicker>
        <DatePicker type={TYPE_DATETIME} value={endDate} onChange={handleEndDateChange}>
          Basic Linked DateTime Picker - End
        </DatePicker>
        {isInvalidRange && (
          <div style={{ color: "red", marginTop: 4 }}>Start date cannot be after end date.</div>
        )}
        <DatePicker
          data-testid="my-picker"
          value={endDate}
          onChange={handleEndDateChange}
          minDate={subDays(new Date(), 3)}
          maxDate={addDays(new Date(), 3)}
        >
          Required Date Picker with validation (three days before and after today)
        </DatePicker>
      </div>
    </>
  );
};
