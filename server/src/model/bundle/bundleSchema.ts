import gql from "graphql-tag";
import { Amendment, Demonstration, Extension } from "../../types";

export type Bundle = Demonstration | Amendment | Extension;

export const bundleSchema = gql`
  union Bundle = Demonstration | Amendment | Extension
`;
