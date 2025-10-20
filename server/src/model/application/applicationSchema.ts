import { Demonstration, Amendment, Extension } from "../../types.js";
import { gql } from "graphql-tag";

export const applicationSchema = gql`
  union Application = Demonstration | Amendment | Extension
`;

export type Application = Demonstration | Amendment | Extension;
