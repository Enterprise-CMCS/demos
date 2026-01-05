import { gql, useMutation } from "@apollo/client";
import { Button } from "components/button";
import React from "react";
import { Amendment as ServerAmendment } from "demos-server";
import { getTime } from "date-fns";

const ADD_AMENDMENT_QUERY = gql`
  mutation addAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      name
    }
  }
`;

type Amendment = Pick<ServerAmendment, "id" | "name">;

export const DemonstrateMutateWithDirectCacheModification: React.FC<{
  demonstrationId: string;
}> = ({ demonstrationId }) => {
  const [addAmendment, { data: addAmendmentData }] = useMutation<{
    createAmendment: Amendment & {
      demonstration: {
        id: string;
        amendments: Amendment[];
      };
    };
  }>(ADD_AMENDMENT_QUERY, {
    update(cache) {
      cache.evict({
        id: cache.identify({
          __typename: "Demonstration",
          id: demonstrationId,
        }),
        fieldName: "amendments",
      });
    },
  });

  const handleAddAmendment = () => {
    addAmendment({
      variables: {
        input: {
          demonstrationId: demonstrationId,
          name: `Name at timestamp: ${getTime(new Date())}`,
          description: "This amendment was added via the List Manipulation Demo",
        },
      },
    });
  };
  return (
    <div>
      <p>
        Here i have implemented a mutation hook that directly modifies the Apollo cache to evict the
        list of amendments on the parent demonstration when a new amendment is added. This will
        force any active queries for that list to re-fetch the next time they are rendered.
      </p>
      <Button
        name="button-add-amendment-with-cache-modification"
        onClick={() => {
          handleAddAmendment();
        }}
      >
        Add Amendment (with cache eviction)
      </Button>
      <div>
        <p className="font-semibold">Last Added Amendment:</p>
        <div className="ml-1">
          <p>
            Amendment ID:{" "}
            <span className="font-semibold"> {addAmendmentData?.createAmendment.id}</span>
          </p>
          <p>
            Amendment Name:{" "}
            <span className="font-semibold"> {addAmendmentData?.createAmendment.name}</span>
          </p>
        </div>
      </div>

      <p>
        There are more sugical ways to update the cache to prevent a refetch of the entire object,
        but if our goal is to force a full refetch of all related queries this will fulfill our
        needs.
      </p>
    </div>
  );
};
