import React from "react";

export const RefetchQueriesDemonstrationDescription = () => {
  return (
    <div className="flex flex-col gap-1">
      <p>
        The purpose of this is to highlight an issue found in the current refetch queries approach.
        When multiple mutations are fired off in quick succession that utilize the same
        refetchQueries,{" "}
        <span className="font-semibold italic">Apollo may deduplicate the refetches</span>. This can
        lead to a scenario where{" "}
        <span className="font-semibold italic">
          latter mutations do not trigger the expected refetch
        </span>{" "}
        because Apollo believes it has already been done.
      </p>
      <p>
        This effect was first noticed during the integration of the Review Phase, where three
        mutations are fired off in quick succession to set the Dates, Notes, and Clearance Level of
        the phase. The frontend would not see all three updates reflected immediately after the
        mutations completed, leading to confusion and inconsistency in the UI (the submit button
        would be enabled though there were no submittable changes).
      </p>
      <p>
        To demonstrate this issue, we have a set a buttons which will interact with the value of the
        content of the PO and OGD note, which will serve as a counter. Using this, we can read the
        current value of the note and increment it by 1 for each network request. In normal
        operation, every request triggers a refetch of the original query, which will give us the
        updated value.
      </p>
      <p>
        Where this gets intesting is when we rapidly fire off multiple mutations in succession.{" "}
        <span className="font-semibold italic">
          If the refetchQueries fetch is still in flight from a previous mutation at the time the
          next mutation completes, Apollo will recognize the upcoming refetch as a duplicated,
          identical query and skip it.
        </span>{" "}
        This means that some of the increments will not be reflected in the UI, even though the
        mutations were successful on the server.
      </p>
      <p>
        To observe this issue, we need to slow down the resolution of the query on the server side.
        You can do this by adding an artificial delay in the{" "}
        <code className="bg-gray-300 text-red-600">applicationPhaseResolvers.ts</code> file in the
        server codebase. Add the following line just before the return statement in the{" "}
        <code className="bg-gray-300 text-red-600">__resolveApplicationPhaseNotes</code> function:{" "}
        <code className="bg-gray-300 text-red-600">
          await new Promise((resolve) =&gt; setTimeout(resolve, 100));
        </code>
      </p>
      <p>
        Click the Rapidly Increment Note button multiple times and observe that the number of
        successful increments sometimes does not match the last received content value. On the first
        instance of this issue, we can resolve it by manually refetching. But further clicking
        without correction exacerbates the issue and a manual refetch will no longer resolve it.
      </p>
      <p>
        With the network tab open in your browser&apos;s developer tools, you can observe the
        mutation requests being sent, followed by the refetch query. When the issue occurs, you will
        see that sometimes the final request is the mutation without a subsequent refetch query.
      </p>
      <p>
        Note that the only difference between these two sets of buttons is the mutation hook passed
        in. Both hooks return no value. One hook specifies in its GQL return a typename and utilizes
        refetch queries; the other specifies in its GQL return the mutated data.
      </p>
    </div>
  );
};
