import { gql, useQuery } from "@apollo/client";
import { Button } from "components/button";
import {
  Demonstration as ServerDemonstration,
  ApplicationPhase as ServerApplicationPhase,
  ApplicationNote as ServerApplicationNote,
} from "demos-server";
import React from "react";
import { useSetApplicationNotes } from "./useSetApplicationNotes";
import { RefetchQueriesDemonstrationDescription } from "./refetchQueriesDemonstrationDescription";
import { IncrementerButtons } from "./IncrementerButtons";

type ApplicationNote = Pick<ServerApplicationNote, "noteType" | "content">;
type ApplicationPhase = Pick<ServerApplicationPhase, "phaseName"> & {
  phaseNotes: ApplicationNote[];
};
type Demonstration = Pick<ServerDemonstration, "id"> & {
  phases: ApplicationPhase[];
};

export const GET_APPLICATION_NOTES_QUERY = gql`
  query GetApplicationNotes {
    demonstrations {
      id
      phases {
        phaseName
        phaseNotes {
          noteType
          content
        }
      }
    }
  }
`;

export const RefetchQueriesDemonstration: React.FC = () => {
  const [incrementCount, setIncrementCount] = React.useState(0);
  const {
    setApplicationNotesDirectReturn,
    setApplicationNotesWithRefetch,
    setApplicationNotesWithAwaitedRefetch,
  } = useSetApplicationNotes();
  const { data, loading, error, refetch } = useQuery<{ demonstrations: Demonstration[] }>(
    GET_APPLICATION_NOTES_QUERY
  );

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error || !data) {
    return <p>Error loading notes.</p>;
  }
  if (data.demonstrations.length === 0) {
    return <p>No demonstrations found.</p>;
  }
  const demonstration = data.demonstrations[0];
  const reviewPhase = demonstration.phases.find(
    (phase: ApplicationPhase) => phase.phaseName === "Review"
  );
  if (!reviewPhase) {
    return <p>No Review phase found.</p>;
  }
  const poAndOgdNote = reviewPhase.phaseNotes.find(
    (note: ApplicationNote) => note.noteType === "PO and OGD"
  );

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">Refetch Queries Demonstration</h1>

      <RefetchQueriesDemonstrationDescription />

      <p className="font-semibold">Last Recieved PO and OGD Content: {poAndOgdNote?.content}</p>
      <p className="font-semibold">Number of successful increments: {incrementCount}</p>
      {`${incrementCount}` != poAndOgdNote?.content && (
        <p className="text-red-600 italic">
          Anomaly Detected, increment count does not match recieved content
        </p>
      )}
      <Button size="large" name="button-manually-refetch-query" onClick={() => refetch()}>
        Manually Refetch Query
      </Button>

      <div className="flex flex-col gap-1">
        <h2 className="font-bold">Mutation utilizing refetch</h2>
      </div>
      <IncrementerButtons
        demonstrationId={demonstration.id}
        poAndOdgNoteContent={poAndOgdNote?.content}
        setIncrementCount={setIncrementCount}
        mutate={setApplicationNotesWithRefetch}
      />
      <div className="flex flex-col gap-1">
        <h2 className="font-bold">Mutation returning data directly</h2>
      </div>
      <IncrementerButtons
        demonstrationId={demonstration.id}
        poAndOdgNoteContent={poAndOgdNote?.content}
        setIncrementCount={setIncrementCount}
        mutate={setApplicationNotesDirectReturn}
      />
      <div className="flex flex-col gap-1">
        <h2 className="font-bold">Mutation utilizing refetch</h2>
      </div>
      <IncrementerButtons
        demonstrationId={demonstration.id}
        poAndOdgNoteContent={poAndOgdNote?.content}
        setIncrementCount={setIncrementCount}
        mutate={setApplicationNotesWithAwaitedRefetch}
      />
    </div>
  );
};
