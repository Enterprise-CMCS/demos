import { gql, useQuery } from "@apollo/client";
import React from "react";
import { Demonstration as ServerDemonstration } from "demos-server";

type Demonstration = Pick<ServerDemonstration, "id" | "description">;

export const InnerUseQueryAsADataContract = ({ demonstrationId }: { demonstrationId: string }) => {
  const GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_2 = gql`
    query GetJustTheDescriptionOfADemonstration2($id: ID!) {
      demonstration(id: $id) {
        id
        description
      }
    }
  `;

  const { data, loading, error } = useQuery<{ demonstration: Demonstration }>(
    GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_2,
    {
      variables: { id: demonstrationId },
    }
  );

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error || !data) {
    return <p>Error loading demonstration description.</p>;
  }

  const demonstration = data.demonstration;

  return <>{demonstration.description}</>;
};
