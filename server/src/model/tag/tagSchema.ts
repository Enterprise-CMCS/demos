import gql from "graphql-tag";

// Note that tags are dynamic, so we cannot make this a static constant like we've used elsewhere
export const tagSchema = gql`
  scalar Tag
`;

export type Tag = string;
