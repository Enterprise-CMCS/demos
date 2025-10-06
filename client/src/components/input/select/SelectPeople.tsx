import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Select, SelectProps } from "./Select";
import { Person as ServerPerson, PersonType } from "demos-server";
import { Option } from "./Select";

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
type PersonId = Person["id"];

export const SelectPeople = ({
  placeholder = "Select Person",
  id = "person-select",
  label = "Person",
  personTypes,
  ...rest
}: Omit<SelectProps, "options"> & {
  personTypes?: PersonType[];
}) => {
  const { data, loading, error } = useQuery<{ people: Person[] }>(GET_USER_SELECT_OPTIONS_QUERY);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading users.</p>;
  if (!data || !data.people) return <p>No users found.</p>;

  let people = data.people;
  if (personTypes) {
    people = data.people.filter((person) => personTypes.includes(person.personType));
  }

  const options: Option<PersonId>[] = people.map((person) => ({
    value: person.id,
    label: person.fullName,
  }));

  return (
    <Select<PersonId> options={options} placeholder={placeholder} id={id} label={label} {...rest} />
  );
};
