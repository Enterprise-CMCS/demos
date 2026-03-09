import { gql } from "graphql-tag";

export const directiveSchema = gql`
  directive @auth(permissions: [String!]) on FIELD_DEFINITION | OBJECT
`;
