import React from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { Demonstration as ServerDemonstration } from "demos-server";
import { UseQueryAsADataContract } from "./useQueryAsADataContract";
import { AutomaticRefetchingOnVariableChanges } from "./automaticRefetchingOnVariableChanges";
import { CacheCaveats } from "./CacheCaveats";
import { ListManipulation } from "./ListManipulation/ListManipulation";

const GET_JUST_THE_IDS_OF_ALL_DEMONSTRATIONS = gql`
  query getJustTheIdsOfAllDemonstrations {
    demonstrations {
      id
    }
  }
`;

type Demonstration = Pick<ServerDemonstration, "id">;

export const CacheDemonstration = () => {
  const { data, loading, error } = useQuery<{ demonstrations: Demonstration[] }>(
    GET_JUST_THE_IDS_OF_ALL_DEMONSTRATIONS
  );

  const demonstrationId = data?.demonstrations?.[0]?.id;

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Cache Demonstration</h1>
      <div className="flex flex-col gap-2">
        <p>
          The purpose of this demonstration is to aid in developing understanding of Apollo`&apos;s
          cache to push towards patterns that are more easily repeatable and more robust against
          changing requirements
        </p>
        <p>Big ideas:</p>
        <ol className="list-decimal list-inside flex flex-col gap-1">
          <li>
            We are already using the cache; this demonstration does not intend to introduce it, but
            to deepen understanding of its behavior. Many of our existing components already rely on
            it.
          </li>
          <li>
            Think in data, not queries. The cache is a client-side database of the data which is
            queried against <em>before</em> a request ever leaves the browser. We already have a
            global store of all the data the client has ever requested in a runtime, so we dont need
            to pass data around between components as much. Think of useQuery hooks as &quot;data
            contracts&quot;, not as the true mechanism for fetching data
          </li>
          <li>
            Isolating mutations to only return the data that was changed (and a typename) allows the
            application to decouple unrelated areas such that components can be developed in
            isolation more easily. The effects of modifying a query do not cascade to reliant
            mutations.
          </li>
          <li>
            bypassing the cache is possible, but the default behavior of Apollo appears to suggest
            that it should be sparingly used. Issues of asynchronous updates, cross-component data
            synchronization, and built-in decoupling mechanisms have all been observed when not
            utilizing the cache effectively.
          </li>
          <li>
            Type-definitions can be vastly simplified as data does not need to pass from component
            to component. Instead, each component can query the data it needs directly from the
            cache.
          </li>
        </ol>

        <p>
          for the bulk of this demonstration, we will fetch a single demonstration and pass only its
          ID through components. For that, I will query for all demonstrations, but only use the
          first one. Each query used will have a unique name to demonstrate that a dependency on a
          specific query is not necessary.
        </p>

        {loading ? (
          <span>Loading...</span>
        ) : error ? (
          <span>error</span>
        ) : !demonstrationId ? (
          <span>No demonstrations found</span>
        ) : (
          <>
            Subject Demonstration: <span>{demonstrationId}</span>
            <div className="border-t py-2">
              <UseQueryAsADataContract demonstrationId={demonstrationId} />
            </div>
            <div className="border-t py-2">
              <AutomaticRefetchingOnVariableChanges demonstrationId={demonstrationId} />
            </div>
            <div className="border-t py-2">
              <ListManipulation demonstrationId={demonstrationId} />
            </div>
            <div className="border-t py-2">
              <CacheCaveats demonstrationId={demonstrationId} />
            </div>
          </>
        )}
      </div>
    </>
  );
};
