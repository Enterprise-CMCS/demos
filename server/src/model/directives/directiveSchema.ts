import { gql } from "graphql-tag";

export const directiveSchema = gql`
  directive @cmsOnly on FIELD_DEFINITION | OBJECT
  # directive @assignedDemonstration on FIELD_DEFINITION
`;
