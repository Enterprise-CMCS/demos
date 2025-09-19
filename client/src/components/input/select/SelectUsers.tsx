import React from "react";
import { gql, useQuery } from "@apollo/client";
import { AutoCompleteSelect, Option } from "./AutoCompleteSelect";

const GET_USER_SELECT_OPTIONS_QUERY = gql`
  query GetUserSelectOptions {
    users {
      id
      fullName
    }
  }
`;

interface UserSelectQueryResult {
  users: { id: string; fullName: string }[];
}

export interface SelectUsersProps {
  onSelect: (id: string) => void;
  initialUserId?: string;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const getOptionsFromQueryResult = (queryResult: UserSelectQueryResult): Option[] => {
  return queryResult.users.map((user) => ({
    label: user.fullName,
    value: user.id,
  }));
};

export const SelectUsers: React.FC<SelectUsersProps> = ({
  onSelect,
  initialUserId,
  label = "Users",
  isRequired = false,
  isDisabled = false,
}) => {
  const [selectedUserId, setSelectedUserId] = React.useState<string>(initialUserId || "");
  const { data, loading, error } = useQuery<UserSelectQueryResult>(GET_USER_SELECT_OPTIONS_QUERY);

  const handleSelect = (id: string) => {
    setSelectedUserId(id);
    onSelect(id);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading users.</p>;
  if (!data) return <p>No users found.</p>;

  return (
    <AutoCompleteSelect
      id={`users-${label.toLowerCase()}`}
      label={label}
      options={getOptionsFromQueryResult(data)}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={handleSelect}
      isRequired={isRequired}
      isDisabled={isDisabled || loading || !!error}
      value={selectedUserId}
    />
  );
};
