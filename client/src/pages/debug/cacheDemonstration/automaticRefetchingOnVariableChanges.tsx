import { gql, useQuery } from "@apollo/client";
import React from "react";
import { Demonstration as ServerDemonstration } from "demos-server";
const GET_JUST_THE_IDS_OF_ALL_DEMONSTRATIONS = gql`
  query GetJustTheIdsOfAllDemonstrations {
    demonstrations {
      id
    }
  }
`;

const GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_3 = gql`
  query GetJustTheDescriptionOfADemonstration3($id: ID!) {
    demonstration(id: $id) {
      id
      description
    }
  }
`;

type DemonstrationWithId = Pick<ServerDemonstration, "id">;
type DemonstrationWithDescription = Pick<ServerDemonstration, "id" | "description">;

export const AutomaticRefetchingOnVariableChanges: React.FC<{
  demonstrationId: string;
}> = ({ demonstrationId }) => {
  const [selectedDemonstrationId, setSelectedDemonstrationId] = React.useState(demonstrationId);

  const { data: demonstrationWithId } = useQuery<{ demonstrations: DemonstrationWithId[] }>(
    GET_JUST_THE_IDS_OF_ALL_DEMONSTRATIONS
  );

  const { data: demonstrationWithDescription } = useQuery<{
    demonstration: DemonstrationWithDescription;
  }>(GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_3, {
    variables: { id: selectedDemonstrationId },
  });

  const handleSelectChange = (value: string) => {
    setSelectedDemonstrationId(value);
  };

  const demonstrations = demonstrationWithId?.demonstrations;

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-bold mb-2">Automatic Refetching on Variable Changes</h2>
      <p>
        Apollo also presents more tools to help keep the frontend updated; one such tool is the
        automatic requerying when variables input change. This has been implemented in a separate
        component to further enphasize the data contract concept.
      </p>
      <p>
        This component demonstrates Apollo Client&apos;s ability to automatically refetch queries
        when their variables change. Here, i display the demonstration&apos;s description, however,
        i also provide a dropdown to change which demonstration is being viewed.
      </p>
      {!demonstrationId ? (
        <span>No demonstrations found</span>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          <div>
            <strong>Selected Demonstration Description:</strong>{" "}
            {demonstrationWithDescription?.demonstration.description}
          </div>
          <select
            className="border border-gray-300 rounded px-2 py-1"
            onChange={(e) => handleSelectChange(e.target.value)}
            value={selectedDemonstrationId}
          >
            {demonstrations?.map((demonstration) => (
              <option
                key={demonstration.id}
                value={demonstration.id}
                onChange={() => setSelectedDemonstrationId(demonstration.id)}
              >
                {demonstration.id}
              </option>
            ))}
          </select>
          <p>
            importantly, notice how selecting a new demonstration prompts a refetch of the
            GET_JUST_THE_DESCRIPTION_OF_A_DEMONSTRATION_3 query. Also, when a different
            demonstration is edited in the caller component, then the original demonstration is
            selected, the updated description is shown automatically without a refetch occuring.
            This is because the data is <em>already in the cache</em> from the return of the
            mutation request.
          </p>
          <p className="font-semibold italic">
            I want to emphasize that this behavior does not require any configurations or deviations
            from the default behavior of Apollo; extra considerations of when to refetch or how to
            keep data in sync are not necessary in most cases.
          </p>
        </div>
      )}
    </div>
  );
};
