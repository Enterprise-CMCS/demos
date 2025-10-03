import { gql } from "graphql-tag";
import { DateType } from "../../types.js";

export const bundleDateSchema = gql`
  type BundleDate {
    dateType: DateType!
    dateValue: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input SetBundleDateInput {
    bundleId: ID!
    dateType: DateType!
    dateValue: DateTime!
  }

  type Mutation {
    setBundleDate(input: SetBundleDateInput): Bundle
  }
`;

export interface SetBundleDateInput {
  bundleId: string;
  dateType: DateType;
  dateValue: Date;
}

export interface BundleDate {
  dateType: DateType;
  dateValue: Date;
  createdAt: Date;
  updatedAt: Date;
}
