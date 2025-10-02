import { gql } from "graphql-tag";
import { DateType, PhaseName } from "../../types.js";

export const bundlePhaseDateSchema = gql`
  type BundlePhaseDate {
    dateType: DateType!
    dateValue: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input SetPhaseDateInput {
    bundleId: ID!
    phaseName: PhaseName!
    dateType: DateType!
    dateValue: DateTime!
  }

  type Mutation {
    setPhaseDate(input: SetPhaseDateInput): Bundle
  }
`;

export interface SetPhaseDateInput {
  bundleId: string;
  phaseName: PhaseName;
  dateType: DateType;
  dateValue: Date;
}

export interface BundlePhaseDate {
  dateType: DateType;
  dateValue: Date;
  createdAt: Date;
  updatedAt: Date;
}
