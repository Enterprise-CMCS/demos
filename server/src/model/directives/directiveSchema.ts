import { gql } from "graphql-tag";

export const directiveSchema = gql`
  directive @cmsOnly on FIELD_DEFINITION | OBJECT
  directive @belongsToDemonstration on FIELD_DEFINITION | OBJECT
`;
