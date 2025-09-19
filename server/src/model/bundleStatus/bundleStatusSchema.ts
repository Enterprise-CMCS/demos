import gql from "graphql-tag";

export const bundleStatusSchema = gql`
  """
  A string representing the status of a demonstration, amendment, or extension. Acceptable values are:
  - Pre-Submission
  - Under Review
  - Approved
  - Denied
  - Withdrawn
  - On-hold
  """
  scalar BundleStatus
`;
