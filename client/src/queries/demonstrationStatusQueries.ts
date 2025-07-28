import { gql } from "@apollo/client";

export const DEMONSTRATION_STATUS_OPTIONS_QUERY = gql`
  query GetDemonstrationStatuses {
    demonstrationStatuses {
      name
    }
  }
`;
