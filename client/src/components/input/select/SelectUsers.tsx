import React from "react";
import { gql, useQuery } from "@apollo/client";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import { Person as ServerPerson, PersonType } from "demos-server";
import { Option } from "./Select";

export const GET_USER_SELECT_OPTIONS_QUERY = gql`
  query GetUserSelectOptions {
    people {
      id
      fullName
      personType
      firstName
      lastName
    }
  }
`;

type Person = Pick<ServerPerson, "id" | "fullName" | "personType" | "firstName" | "lastName">;

export interface SelectUsersProps {
  value?: string;
  onSelect: (id: string) => void;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  personTypes?: PersonType[];
}

const getOptionsFromPeople = (people: Person[]): Option[] => {
  return people.map((person) => ({
    label: person.fullName ?? `${person.firstName} ${person.lastName}`,
    value: person.id,
  }));
};

export const SelectUsers: React.FC<SelectUsersProps> = ({
  value,
  onSelect,
  label = "Users",
  isRequired = false,
  isDisabled = false,
  personTypes,
}) => {
  const { data, loading, error } = useQuery<{ people: Person[] }>(GET_USER_SELECT_OPTIONS_QUERY);

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
      dataTestId="select-users"
      label={label}
      options={getOptionsFromPeople(people)}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={onSelect}
      isRequired={isRequired}
      isDisabled={isDisabled || loading || !!error}
      value={value}
    />
  );
};
