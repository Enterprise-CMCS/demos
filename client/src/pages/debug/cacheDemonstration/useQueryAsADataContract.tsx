import { gql, useMutation, useQuery } from "@apollo/client";
import { Button } from "components/button";
import { Demonstration as ServerDemonstration } from "demos-server";
import React from "react";
import { InnerUseQueryAsADataContract } from "./InnerUseQueryAsADataContract";

type Demonstration = Pick<ServerDemonstration, "id" | "description">;

export const UseQueryAsADataContract = ({ demonstrationId }: { demonstrationId: string }) => {
  const [inputDescription, setInputDescription] = React.useState("");
  const GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION = gql`
    query GetJustTheDescriptionOfADemonstration($id: ID!) {
      demonstration(id: $id) {
        id
        description
      }
    }
  `;

  const { data, loading, error } = useQuery<{ demonstration: Demonstration }>(
    GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION,
    {
      variables: { id: demonstrationId },
    }
  );

  const UPDATE_THE_DESCRIPTION_OF_A_DEMONSTRATION_MUTATION_WITH_NO_DATA_RETURNED = gql`
    mutation UpdateTheDescriptionOfADemonstrationWithNoDataReturned(
      $id: ID!
      $input: UpdateDemonstrationInput!
    ) {
      updateDemonstration(id: $id, input: $input) {
        __typename
      }
    }
  `;

  const [mutateWithNoReturn] = useMutation(
    UPDATE_THE_DESCRIPTION_OF_A_DEMONSTRATION_MUTATION_WITH_NO_DATA_RETURNED
  );

  const UPDATE_THE_DESCRIPTION_OF_A_DEMONSTRATION_MUTATION_WITH_DATA_RETURNED = gql`
    mutation UpdateTheDescriptionOfADemonstrationWithDataReturned(
      $id: ID!
      $input: UpdateDemonstrationInput!
    ) {
      updateDemonstration(id: $id, input: $input) {
        id
        description
      }
    }
  `;

  const [mutateWithDataReturn] = useMutation(
    UPDATE_THE_DESCRIPTION_OF_A_DEMONSTRATION_MUTATION_WITH_DATA_RETURNED
  );

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error || !data) {
    return <p>Error loading demonstration description.</p>;
  }

  const demonstration = data.demonstration;

  const handleUpdateDescriptionWithNoReturn = async () => {
    await mutateWithNoReturn({
      variables: { id: demonstrationId, input: { description: inputDescription } },
    });
  };

  const handleUpdateDescriptionWithReturn = async () => {
    await mutateWithDataReturn({
      variables: { id: demonstrationId, input: { description: inputDescription } },
    });
  };

  return (
    <>
      <h2 className="font-bold text-lg">useQuery as a Data Contract</h2>
      <div className="flex flex-col gap-2">
        <p>
          Scenario: we have two components, a Caller and a Callee. Both components need to display
          the same description field of a demonstration. A more traditional approach would be for
          the Caller to fetch the data and pass it down to the Callee as a prop. However, with
          Apollo&apos;s cache, both components can independently query for the description field
          using useQuery. Since Apollo caches the data, the second query will hit the cache and not
          result in an additional network request.
        </p>
        <p>
          An important note is that to utilize the cache, Apollo must know how to identify the
          objects returned. For the objects that have an ID field, this is simple: we just return
          the id in our queries. I will be implicitly adding the ID field to each of my queries.
        </p>
        <p>
          Description from this component:{" "}
          <span className="font-semibold">{demonstration.description}</span>
        </p>
        <p>
          Description from the inner component:{" "}
          <span className="font-semibold">
            <InnerUseQueryAsADataContract demonstrationId={demonstrationId} />
          </span>
        </p>
        <p>
          Big Idea: in the network tab of the browser devtools, we only see a query for
          &quot;GetJustTheDescriptionOfADemonstration&quot; and do not see a second network request
          for &quot;GetJustTheDescriptionOfADemonstration2&quot;. Apollo was able to satisfy the
          second query from the cache.{" "}
          <span className="font-bold">useQuery then acts as a data contract</span>, ensuring that
          the data needed is available.
        </p>
        <p>
          Now lets mutate the data from within this component with two different mutators. The first
          mutates the data, and asks for only the typename back from the server. Follow up questions
          arise: how should we refetch the data to keep the frontend in sync?
        </p>
        <ol className="list-disc list-inside flex flex-col">
          <li>
            Should we use <code>GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION</code> or{" "}
            <code>GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_2?</code>
          </li>
          <li>
            what if <code>GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_2</code> no longer queries the
            description field, do we need to point this mutator to a different query?
          </li>
          <li>
            is there a more &quot;core&quot; query that both queries derive from that would be more
            appropriate to refetch?
          </li>
          <li>
            if we want to modify <code>GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION</code>, should we
            make sure to also modify <code>GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_2</code> to
            keep them in sync
          </li>
          <li>
            does this pattern scale when many components need the same data? Do we end up with a web
            of queries that all need to be kept in sync?
          </li>
          <li>
            does our manual fetching need explicit configurations to bypass the caching mechanism so
            we actually get fresh data back?
          </li>
        </ol>
        <p>
          The second mutator asks the server for the freshly modified data. Doing so returns data in
          the <em>same</em> request as the mutation; no followup fetching is needed, the changes to
          other referenced queries is irrelevent, and every component that uses the data is
          automatically updated.{" "}
          <span className="font-bold">
            This is the pattern{" "}
            <a
              className="text-blue-600 underline"
              href="https://www.apollographql.com/docs/react/data/mutations#include-modified-objects-in-mutation-responses"
            >
              recognized as best practice by Apollo itself
            </a>
          </span>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputDescription}
            onChange={(e) => setInputDescription(e.target.value)}
            className="bg-white border border-gray-400 px-3 py-1"
            placeholder="Enter new description"
          />
          <Button
            name="button-update-description-no-return"
            onClick={handleUpdateDescriptionWithNoReturn}
          >
            Update the description with no return
          </Button>
          <Button
            name="button-update-description-return"
            onClick={handleUpdateDescriptionWithReturn}
          >
            Update the description with data returned
          </Button>
        </div>
      </div>
    </>
  );
};
