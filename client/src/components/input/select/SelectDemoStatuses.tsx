import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { AutoCompleteSelect, Option } from "./AutoCompleteSelect";
import { DEMONSTRATION_STATUS_OPTIONS_QUERY } from "queries/demonstrationQueries";

// This may not be the final type. This is more of just an exmaple of the select.
export interface DemonstrationStatus {
  id: number;
  name: string;
  deletedAt: Date | null;
  createdAt: string;
  updatedAt: string;
}

interface SelectDemoStatusesProps {
  onStatusChange: (status: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export const SelectDemoStatuses: React.FC<SelectDemoStatusesProps> = ({
  onStatusChange,
  isRequired = false,
  isDisabled = false,
}) => {
  const { data, loading, error } = useQuery<{
    demonstrationStatuses: { id: string; name: string }[];
  }>(DEMONSTRATION_STATUS_OPTIONS_QUERY);

  const options: Option[] = useMemo(
    () =>
      (data?.demonstrationStatuses || []).map((s) => ({
        label: s.name,
        value: s.name,
      })),
    [data]
  );

  return (
    <AutoCompleteSelect
      id="demo-status"
      label="Select Status"
      options={options}
      placeholder={
        loading ? "Loading statuses…" : error ? "Error loading statuses" : "Select"
      }
      onSelect={onStatusChange}
      isRequired={isRequired}
      isDisabled={isDisabled || loading || !!error}
    />
  );
};
