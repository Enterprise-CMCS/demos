import { gql } from "graphql-tag";
import { DateType } from "../../types.js";

export const bundlePhaseDateSchema = gql`
  type BundlePhaseDate {
    dateType: DateType!
    dateValue: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    setPhaseDate(bundleId: ID!, phase: Phase!, dateType: DateType!, dateValue: DateTime!): Bundle
  }
`;

export interface BundlePhaseDate {
  dateType: DateType;
  dateValue: Date;
  createdAt: Date;
  updatedAt: Date;
}
