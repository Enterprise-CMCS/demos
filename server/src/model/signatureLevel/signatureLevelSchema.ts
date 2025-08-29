import gql from "graphql-tag";

export const signatureLevelSchema = gql`
  """
  A string representing a signature level. Expected values are:
  - OA
  - OCD
  - OGD
  """
  scalar SignatureLevel
`;

export const SIGNATURE_LEVEL = ["OA", "OCD", "OGD"] as const;

export type SignatureLevel = (typeof SIGNATURE_LEVEL)[number];
