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
}: {
  demonstrationEffectiveDate?: Date;
  demonstrationExpirationDate?: Date;
}) {
  const [selectedYear, setSelectedYear] = useState(1);

  return (
    <div className="grid grid-cols-5 gap-sm">
      <div className="col-span-1">
        <Select
          label="Year"
          options={getOptionsForYearSelect(demonstrationEffectiveDate, demonstrationExpirationDate)}
          value={String(selectedYear)}
          onSelect={(value: string) => setSelectedYear(Number(value))}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-1"
          key={1}
          label="1st Quarter"
          value={""}
          onChange={(newDate: string) => {
            console.log(newDate);
          }}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-2"
          key={2}
          label="2nd Quarter"
          value={""}
          onChange={(newDate: string) => {
            console.log(newDate);
          }}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-3"
          key={3}
          label="3rd Quarter"
          value={""}
          onChange={(newDate: string) => {
            console.log(newDate);
          }}
          isRequired={true}
        />
      </div>

      <div className="col-span-1">
        <DatePicker
          name="quarter-4"
          key={4}
          label="4th Quarter"
          value={""}
          onChange={(newDate: string) => {
            console.log(newDate);
          }}
          isRequired={true}
        />
      </div>
    </div>
  );
}
