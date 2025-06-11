import React from "react";
import { AutoCompleteSelect, Option } from "./AutoCompleteSelect";
import users from "faker_data/users.json";

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

export interface SelectUsersProps {
  label?: string;
  onStateChange: (id: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  currentUserId?: string;
}

export const SelectUsers: React.FC<SelectUsersProps> = ({
  label = "Users",
  onStateChange,
  isRequired = false,
  isDisabled = false,
  currentUserId,
}) => {
  const options: Option[] = (users as User[]).map((u) => ({
    label: u.name,
    value: String(u.id),
  }));
  const defaultLabel = options.find((o) => o.value === currentUserId)?.label ?? "";

  return (
    <AutoCompleteSelect
      id={`users-${label.toLowerCase()}`}
      label={label}
      options={options}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={onStateChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      defaultValue={defaultLabel}
    />
  );
};
