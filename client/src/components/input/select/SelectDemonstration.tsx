import React from "react";
import { gql, useQuery } from "@apollo/client";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import { Demonstration as ServerDemonstration } from "demos-server";

export const SELECT_DEMONSTRATION_QUERY = gql`
  query SelectDemonstration {
    demonstrations {
      id
      name
      status
    }
  }
`;

type Demonstration = Pick<ServerDemonstration, "id" | "name" | "status">;

export const SelectDemonstration: React.FC<{
  isRequired?: boolean;
  isDisabled?: boolean;
  onSelect: (id: string) => void;
  value: string;
}> = ({ isRequired = false, isDisabled = false, onSelect, value }) => {
  const {
    data: demonstrationsData,
    loading: demonstrationsLoading,
    error: demonstrationsError,
  } = useQuery<{
    demonstrations: Demonstration[];
  }>(SELECT_DEMONSTRATION_QUERY);

  if (demonstrationsLoading) return <p>Loading...</p>;
  const demonstrations = demonstrationsData?.demonstrations;
  if (demonstrationsError || !demonstrations)
    return <p>Error retrieving list of demonstrations.</p>;

  const approvedDemonstrations = demonstrations.filter(
    (demonstration) => demonstration.status === "Approved"
  );
  if (approvedDemonstrations.length < 1) return <p>No approved demonstrations found.</p>;

  return (
    <AutoCompleteSelect
      id="select-demonstration"
      dataTestId="select-demonstration"
      label="Demonstration"
      options={approvedDemonstrations.map((demonstration) => ({
        label: demonstration.name,
        value: demonstration.id,
      }))}
      placeholder="Select demonstration…"
      onSelect={onSelect}
      isRequired={isRequired}
      isDisabled={isDisabled}
      value={value}
    />
  );
};
