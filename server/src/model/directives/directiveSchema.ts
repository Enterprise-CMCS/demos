import { gql } from "graphql-tag";

export const directiveSchema = gql`
  directive @public on FIELD_DEFINITION | OBJECT
  directive @viewApplication on FIELD_DEFINITION | OBJECT
  directive @viewDemonstration on FIELD_DEFINITION | OBJECT
`;
