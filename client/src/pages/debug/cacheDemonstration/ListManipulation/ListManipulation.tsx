import { useMutation, useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "components/button";
import { getTime } from "date-fns";
import { Demonstration as ServerDemonstration, Amendment as ServerAmendment } from "demos-server";
import React from "react";
import { DemonstrateUpdate } from "./DemonstrateUpdate";
import { DemonstrateMutateWithListReturn } from "./DemonstrateMutateWithListReturn";
import { DemonstrateMutateWithDirectCacheModification } from "./DemonstrateMutateWithDirectCacheModification";

const GET_ALL_AMENDMENTS_ON_A_DEMONSTRATION = gql`
  query getAllAmendmentsOnADemonstration($id: ID!) {
    demonstration(id: $id) {
      id
      amendments {
        id
        name
      }
    }
  }
`;

const ADD_AMENDMENT_QUERY = gql`
  mutation addAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      name
    }
  }
`;

type Amendment = Pick<ServerAmendment, "id" | "name">;
type Demonstration = Pick<ServerDemonstration, "id"> & {
  amendments: Amendment[];
};

export const ListManipulation: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const { data, refetch } = useQuery<{
    demonstration: Demonstration;
  }>(GET_ALL_AMENDMENTS_ON_A_DEMONSTRATION, {
    variables: { id: demonstrationId },
  });

  const [addAmendment, { data: addAmendmentMutationData }] = useMutation<{
    createAmendment: Amendment;
  }>(ADD_AMENDMENT_QUERY);

  const amendments = data?.demonstration?.amendments;

  const handleAddAmendmentWithReturnOfAddedAmendment = () => {
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
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-bold mb-2">List Manipulation</h2>
      <p>
        When adding or removing object from listed children of other objects, this <em>can</em> be a
        little tricky, since returning a single object from a creation operation doent include the
        relationship that object may have with other objects. However, this can be mitigated by
        fetching the parent object in the mutation&apos;s return.
      </p>
      <p>
        here is a small demonstration which lists all the Amendments belonging to our target
        demonstration. I have defined a query which fetches the demonstration with its Amendments.
      </p>
      {!amendments ? (
        <span>Error finding amendments.</span>
      ) : (
        <>
          <h2>Amendments on demonstration: {demonstrationId}</h2>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <table className="table-auto border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-2 py-1">Amendment ID</th>
                    <th className="border border-gray-300 px-2 py-1">Amendment Name</th>
                  </tr>
                </thead>
                <tbody>
                  {amendments.map((amendment, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-2 py-1">{amendment.id}</td>
                      <td className="border border-gray-300 px-2 py-1">{amendment.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2">
                <Button name="button-manually-refetch-query" onClick={() => refetch()}>
                  Manually Refetch query
                </Button>
                <Button
                  name="button-add-amendment"
                  onClick={() => {
                    handleAddAmendmentWithReturnOfAddedAmendment();
                  }}
                >
                  Add Amendment
                </Button>
              </div>
              <div className="px-2">
                <p className="font-semibold">Last Added Amendment:</p>
                <div className="ml-1">
                  <p>
                    Amendment ID:{" "}
                    <span className="font-semibold">
                      {" "}
                      {addAmendmentMutationData?.createAmendment.id}
                    </span>
                  </p>
                  <p>
                    Amendment Name:{" "}
                    <span className="font-semibold">
                      {" "}
                      {addAmendmentMutationData?.createAmendment.name}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p>
                Notice how we can use this basic mutation to get data back about the recently added
                amendment, but that has no effect on the main list until we manualy refetch. If we
                update an amendment however, it knows which amendment we&apos;re referring to and
                that it belongs to this demonstration, so the list updates automatically without a
                refetch.
              </p>
              <DemonstrateUpdate amendments={amendments} />
              <p>
                So the question remains, how do we update the list of amendments when we add (or
                remove) one? We have a few options:
              </p>
            </div>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>
                <span className="font-semibold">
                  After the query finishes, manually refresh the list query.{" "}
                </span>
                This is what we&apos;re currently doing in a number of places, and works well when
                the list and mutator are close enough. However, when they are in different
                components, or there are ways to update the list that dont involve this component,
                it can get tedious to remember to do this and update the relevent queries (or update
                this mutation when a query changes).
              </li>
              <li>
                <span className="font-semibold">
                  Use the mutation&apos;s return to update the cache.
                </span>{" "}
                This can be done by fetching the parent object with its list of children in the
                mutation&apos;s return. I demonstrate this below.
                <DemonstrateMutateWithListReturn demonstrationId={demonstrationId} />
              </li>
              <li>
                <span className="font-semibold">Update the cache directly to update the list.</span>{" "}
                There are degrees of maniulation possible here. The simplest is to simply invalidate
                the list so prompts relevent refetches automatically.{" "}
                <em>
                  Remember: This does not invalide the return of a specific query, it invalidates
                  the data in the cache.
                </em>{" "}
                <DemonstrateMutateWithDirectCacheModification demonstrationId={demonstrationId} />
              </li>
            </ul>
            <p>
              Importantly, notice how each of these mutations exist in totally separate components
              and dont hold references to each other, yet the list updates. We dont need to pass
              down callbacks or references to refetch functions; each component can operate in
              isolation. The question of &quot;how should query A be refetched after mutation
              B&quot; becomes irrelevant; instead, the question becomes &quot;what data does
              mutation B change&quot;, a question that can be answered in isolation and is already
              core to calling a mutation.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
