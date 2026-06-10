import React, { useState } from "react";
import { DatePicker } from "./DatePicker";
import { Button } from "components/button";
import { addDays, formatISO } from "date-fns";

const computeEndDate = (startDate: string): string => {
  if (!startDate) return "";
  return formatISO(addDays(new Date(startDate), 10), { representation: "date" });
};

export const DatePickerSandbox: React.FC = () => {
  const [plainDate, setPlainDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [typingDate, setTypingDate] = useState("");
  const [blurDate, setBlurDate] = useState("");

  const endDate = computeEndDate(startDate);

  return (
    <div className="flex flex-col gap-md">
      {/* Plain DatePicker with custom validation message */}
      <div>
        <h3 className="font-semibold mb-sm">Plain DatePicker (custom validation)</h3>
        <DatePicker
          name="plain-date"
          label="Pick a Date (anything but march)"
          value={plainDate}
          onChange={setPlainDate}
          getValidationMessage={() =>
            plainDate.slice(5, 7) === "03" ? "No dates in march allowed" : ""
          }
        />
      </div>

      <div>
        <h3 className="font-semibold mb-sm">Calculated Date (end = start + 10 days)</h3>
        <div className="flex gap-md">
          <DatePicker
            name="start-date"
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />
          <DatePicker
            name="end-date"
            label="End Date (controlled)"
            value={endDate}
            onChange={() => {}}
            isDisabled
          />
        </div>
      </div>

      {/* Blur / commit behavior: shows last committed value vs displayed value */}
      <div>
        <h3 className="font-semibold mb-sm">
          Commit Behavior (type a date to see when it propagates)
        </h3>
        <p className="text-sm text-text-secondary mb-sm">
          Out-of-range values are displayed in the input but not propagated. Committed value updates
          only when the date is valid and in range.
        </p>
        <DatePicker
          name="typing-date"
          label="Type a Date"
          value={typingDate}
          onChange={setTypingDate}
        />
        <p className="text-sm mt-xs">
          Last committed value: <span className="font-mono">{typingDate || "(none)"}</span>
        </p>
      </div>

      {/* Blur / required + button enable behavior */}
      <div>
        <h3 className="font-semibold mb-sm">Required Date + Button Enable</h3>
        <p className="text-sm text-text-secondary mb-sm">
          The button is only enabled once a valid date is committed.
        </p>
        <div className="flex gap-md items-end">
          <DatePicker
            name="blur-date"
            label="Required Date"
            value={blurDate}
            onChange={setBlurDate}
            isRequired
          />
          <Button name="blur-submit" disabled={!blurDate} onClick={() => {}}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};
