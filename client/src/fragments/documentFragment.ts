import { gql } from "@apollo/client";

export const WORKFLOW_DOCUMENT_FIELDS = gql`
  fragment WORKFLOW_DOCUMENT_FIELDS on Document {
    id
    name
    description
    documentType
    phaseName
    createdAt
    owner {
      person {
        fullName
      }
    }
  }
`;
