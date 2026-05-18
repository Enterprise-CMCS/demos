import gql from "graphql-tag";

export const signatureLevelSchema = gql`
  scalar SignatureLevel
  scalar AmendmentSignatureLevel
  scalar ExtensionSignatureLevel
`;
