import React from "react";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import statuses from "faker_data/demonstrationStatuses.json";

export interface Status {
  id: number;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SelectDemoStatuses: React.FC<{
  onStatusChange: (status: string) => void;
}> = ({ onStatusChange }) => {
  // map the raw objects to an array of strings
  const options = (statuses as Status[]).map(s => s.name);

  return (
    <div className="p-4">
      <label htmlFor="demo-status" className="block mb-2 font-medium">
        Select Status
      </label>
      <AutoCompleteSelect
        id="demo-status"
        options={options}
        placeholder="Start typing a status..."
        onSelect={onStatusChange}
      />
    </div>
  );
};
