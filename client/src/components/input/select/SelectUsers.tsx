import React from "react";
import { gql, useQuery } from "@apollo/client";
import { AutoCompleteSelect, Option } from "./AutoCompleteSelect";
import { Person as ServerPerson, PersonType } from "demos-server";

export const GET_USER_SELECT_OPTIONS_QUERY = gql`
  query GetUserSelectOptions {
    people {
      id
      fullName
      personType
    }
  }
`;

type Person = Pick<ServerPerson, "id" | "fullName" | "personType">;

export interface SelectUsersProps {
  onSelect: (id: string) => void;
  initialUserId?: string;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  personTypes?: PersonType[];
}

const getOptionsFromPeople = (people: Person[]): Option[] => {
  return people.map((person) => ({
    label: person.fullName,
    value: person.id,
  }));
};

export const SelectUsers: React.FC<SelectUsersProps> = ({
  onSelect,
  initialUserId,
  label = "Users",
  isRequired = false,
  isDisabled = false,
  personTypes,
}) => {
  const [selectedUserId, setSelectedUserId] = React.useState<string>(initialUserId || "");
  const { data, loading, error } = useQuery<{ people: Person[] }>(GET_USER_SELECT_OPTIONS_QUERY);

  const handleSelect = (id: string) => {
    setSelectedUserId(id);
    onSelect(id);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading users.</p>;
  if (!data || !data.people) return <p>No users found.</p>;

  let people = data.people;
  if (personTypes) {
    people = data.people.filter((person) => personTypes.includes(person.personType));
  }

  return (
    <AutoCompleteSelect
      id={`users-${label.toLowerCase()}`}
      label={label}
      options={getOptionsFromPeople(people)}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={handleSelect}
      isRequired={isRequired}
      isDisabled={isDisabled || loading || !!error}
      value={selectedUserId}
    />
  );
};
