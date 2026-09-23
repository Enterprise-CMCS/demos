import gql from "graphql-tag";

// Note that tagNames are dynamic, so we cannot make this a static constant like we've used elsewhere
export const tagNameSchema = gql`
  scalar TagName

  type Mutation {
    renameTag(oldName: TagName!, newName: TagName!): TagName!
      @auth(requires: ["Perform Admin Action"])
  }
`;

// This type alias exists to maintain consistency between GraphQL schema and TypeScript types.
export type TagName = string; // NOSONAR: typescript:S6564
