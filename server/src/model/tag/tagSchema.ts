import gql from "graphql-tag";

// Note that tags are dynamic, so we cannot make this a static constant like we've used elsewhere
export const tagSchema = gql`
  scalar Tag
`;

// This type alias exists to maintain consistency between GraphQL schema and TypeScript types.
/* sonar. ignore. nextline TypescriptS4323 */
export type Tag = string;
