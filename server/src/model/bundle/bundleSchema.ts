import { Demonstration, Amendment, Extension } from "../../types.js";
import { gql } from "graphql-tag";

export const bundleSchema = gql`
  union Bundle = Demonstration | Amendment | Extension
`;

export type Bundle = Demonstration | Amendment | Extension;
