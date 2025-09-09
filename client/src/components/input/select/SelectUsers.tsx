import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { AutoCompleteSelect, Option } from "./AutoCompleteSelect";
import { USER_OPTIONS_QUERY } from "queries/userQueries";

export interface SelectUsersProps {
  label?: string;
  onStateChange: (id: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  currentUserId?: string;
  value?: string;
}

export const SelectUsers: React.FC<SelectUsersProps> = ({
  label = "Users",
  onStateChange,
  isRequired = false,
  isDisabled = false,
  currentUserId,
  value,
}) => {
  const { data, loading, error } = useQuery<{ users: { id: string; fullName: string }[] }>(
    USER_OPTIONS_QUERY
  );

  const options: Option[] = useMemo(
    () =>
      (data?.users || []).map((u) => ({
        label: u.fullName,
        value: String(u.id),
      })),
    [data]
  );

  const defaultLabel =
    options.find((o) => o.value === currentUserId)?.label ?? "";

  return (
    <AutoCompleteSelect
      id={`users-${label.toLowerCase()}`}
      label={label}
      options={options}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={onStateChange}
      isRequired={isRequired}
      isDisabled={isDisabled || loading || !!error}
      defaultValue={defaultLabel}
      value={value}
    />
  );
};
