A running list of TODO items that might not point at any part of the code in particular but that we want to capture

1. Ensure no fake / mocked data makes it to prod
   - For the `faker_data/` folder - remove this if seeding volume allows to test things like pagination. Otherwise move it to a place in our below the fold dev environment to test it.
   - Add linting rule to make sure that components cannot import from `mock-data/`. Hook these up to the GQL queries to use that data in the proper way.

2. Look into importing just `types.ts` from `server/`. Currently in the package.json we're installing it the same as the rest of our modules. This has the effect of bringing everything to the node_modules when we just need the one file. There's a couple ways to go about this:
   - Make a "package" out of the `types.ts` folder.
   - Make a file `client/server-types.ts` that just pulls in the types directly from the filepath (`../server/src/types.ts` or something) and re-exports them for use in the client, removing the dependency.
