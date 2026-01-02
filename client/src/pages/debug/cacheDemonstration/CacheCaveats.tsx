import React from "react";

export const CacheCaveats: React.FC<{ demonstrationId: string }> = () => {
  return (
    <>
      <h2 className="text-lg font-bold mb-2">Cache Caveats</h2>
      <p>
        Values in lists can be tricky when it comes to cache updates. Apollo Client references items
        by ID, so lists of objects that do not reference a single object to keep them bundled
        together require explicit management. This is a more appropriate use case for refetching
        queries or direct cache updates. Fortunately, there are a limited number of places in our
        app where this is relevant, mainly the toplevel list of demonstrations. All of our other
        lists can be derived by reference to some other object with an ID (mostly a single
        demonstration).
      </p>
      <p>
        Objects that dont have IDs are also tricky. Apollo Client cannot reference them in the cache
        without explicitly providing a way to identify them. This is done through the use of
        typePolicies configured on the ApolloClient instance. Using the database as a reference for
        composite keys, all of our objects do have a way to be identified, so we should be able to
        configure typePolicies as needed to handle these cases. For example, phaseNotes do not have
        IDs, but they can be uniquely identified by the combination of their application ID and
        noteType.
      </p>
      <p>
        while it is not an issue with the cache itself, if we are returning data from mutations that
        are shared between Unioned types (currently Demonstrations, Amendments, and Extensions), it
        can be a little cumbersome to ensure that the data is correctly returned in each case. This
        often leads to repeated lists of fields in query or mutation return types. This can be
        mitigated by defining fragments for shared fields, but it is still something to be aware of.
        Ideally, the graphql schema would be designed to have a common interface for these shared
        types, but that is not currently the case.
      </p>
      <p>
        where it is cumbersome, we likely dont need the full benefits of caching. For instance,
        returning a list of notes on the demonstration does not require that each note is itself
        cached. We can get the primary benefits (automatic refetching on invalidation) by ensuring
        that the associated object itself is cached, and the notes can be treated as a simple list
        of data that is returned as part of the demonstration object. Updates to the notes on that
        cached demonstration object will automatically prompt a refetch of the associated queries,
        as it recognizes that its associated cache data has been modified without an explicit merge
        strategy.
      </p>
    </>
  );
};
