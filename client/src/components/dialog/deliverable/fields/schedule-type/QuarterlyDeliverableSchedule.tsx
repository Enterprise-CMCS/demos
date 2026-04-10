import React, { useState } from "react";
import { differenceInCalendarYears } from "date-fns";

import { DatePicker } from "components/input/date/DatePicker";
import { Select } from "components/input/select/Select";

export function getOptionsForYearSelect(
  demonstrationEffectiveDate?: Date,
  demonstrationExpirationDate?: Date
) {
  const dateMissing = !demonstrationEffectiveDate || !demonstrationExpirationDate;
  const numYears = dateMissing
    ? 1
    : differenceInCalendarYears(demonstrationExpirationDate, demonstrationEffectiveDate) + 1;

  return Array.from({ length: numYears }, (_, index) => {
    const year = index + 1;
    return {
      label: `Year ${year}`,
      value: String(year),
    };
  });
}

export function QuarterlyDeliverableSchedule({
  demonstrationEffectiveDate,
  demonstrationExpirationDate,
  onSelectYear,
  quarterlyDueDates,
  onSelectQuarterDate,
}: {
  demonstrationEffectiveDate?: Date;
  demonstrationExpirationDate?: Date;
  onSelectYear: (year: number) => void;
  quarterlyDueDates?: string[];
  onSelectQuarterDate?: (quarterIndex: number, dueDate: string) => void;
}) {
  const [selectedYear, setSelectedYear] = useState(1);

  const getQuarterDueDate = (quarterIndex: number) => quarterlyDueDates?.[quarterIndex] ?? "";

  return (
    <div className="grid grid-cols-5 gap-sm">
      <div className="col-span-1">
        <Select
          label="Year"
          options={getOptionsForYearSelect(demonstrationEffectiveDate, demonstrationExpirationDate)}
          value={String(selectedYear)}
          onSelect={(value: string) => {
            // Strip the "Year " prefix from the label to get the numeric year value
            const year = Number(value.replace("Year ", ""));
            onSelectYear(year);
            setSelectedYear(year);
          }}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-1"
          key={1}
          label="1st Quarter"
          value={getQuarterDueDate(0)}
          onChange={(newDate: string) => onSelectQuarterDate?.(0, newDate)}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-2"
          key={2}
          label="2nd Quarter"
          value={getQuarterDueDate(1)}
          onChange={(newDate: string) => onSelectQuarterDate?.(1, newDate)}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-3"
          key={3}
          label="3rd Quarter"
          value={getQuarterDueDate(2)}
          onChange={(newDate: string) => onSelectQuarterDate?.(2, newDate)}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-4"
          key={4}
          label="4th Quarter"
          value={getQuarterDueDate(3)}
          onChange={(newDate: string) => onSelectQuarterDate?.(3, newDate)}
          isRequired={true}
        />
      </div>
    </div>
  );
}
