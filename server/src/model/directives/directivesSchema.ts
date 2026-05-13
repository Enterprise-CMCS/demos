import { gql } from "graphql-tag";

export const directivesSchema = gql`
  directive @auth(requires: String!) on FIELD_DEFINITION | OBJECT
`;
