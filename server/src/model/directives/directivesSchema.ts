import { gql } from "graphql-tag";

export const directivesSchema = gql`
  directive @auth(requires: Permission!) on FIELD_DEFINITION | OBJECT
`;
