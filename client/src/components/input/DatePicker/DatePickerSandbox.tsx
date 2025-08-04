import React, { useState } from "react";
import { DatePicker, TYPE_DATETIME, TYPE_TIME } from "./DatePicker";
import dayjs, { Dayjs } from "dayjs";

export const DatePickerSandbox: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const isInvalidRange = startDate && endDate && startDate.isAfter(endDate);

  return (
    <>
      <div>
        <DatePicker>Default Date Picker</DatePicker>
        <DatePicker value={selectedDate} onChange={setSelectedDate}>
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
        <DatePicker
          type={TYPE_DATETIME}
          value={startDate}
          onChange={setStartDate}
        >
          Basic Linked DateTime Picker - Start
        </DatePicker>
        <DatePicker type={TYPE_DATETIME} value={endDate} onChange={setEndDate}>
          Basic Linked DateTime Picker - End
        </DatePicker>
        {isInvalidRange && (
          <div style={{ color: "red", marginTop: 4 }}>
            Start date cannot be after end date.
          </div>
        )}
        <DatePicker
          data-testid="my-picker"
          value={endDate}
          onChange={setEndDate}
          minDate={dayjs().subtract(3, "day")}
          maxDate={dayjs().add(3, "day")}
        >
          Required Date Picker with validation (three days before and after
          today)
        </DatePicker>
      </div>
    </>
  );
};
