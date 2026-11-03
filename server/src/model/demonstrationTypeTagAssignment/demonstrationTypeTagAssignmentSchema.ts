import { DemonstrationTypeStatus, LocalDate, TagName, TagStatus } from "../../types";
import { gql } from "graphql-tag";

export const demonstrationTypeTagAssignmentSchema = gql`
  scalar DemonstrationTypeStatus

  input DemonstrationTypeDatesInput {
    effectivePlainDate: LocalDate!
    expirationPlainDate: LocalDate!
  }

  input DemonstrationTypeInput {
    demonstrationTypeName: TagName!
    demonstrationTypeDates: DemonstrationTypeDatesInput
  }

  input SetDemonstrationTypesInput {
    demonstrationId: ID!
    demonstrationTypes: [DemonstrationTypeInput!]!
  }

  type DemonstrationTypeAssignment {
    demonstrationTypeName: TagName!
    effectivePlainDate: LocalDate!
    expirationPlainDate: LocalDate!
    status: DemonstrationTypeStatus!
    approvalStatus: TagStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    setDemonstrationTypes(input: SetDemonstrationTypesInput!): Demonstration!
      @auth(requires: ["Modify Applications"])
  }
`;

export interface DemonstrationTypeDatesInput {
  effectivePlainDate: LocalDate;
  expirationPlainDate: LocalDate;
}

export interface DemonstrationTypeInput {
  demonstrationTypeName: TagName;
  demonstrationTypeDates: DemonstrationTypeDatesInput | null;
}

export interface SetDemonstrationTypesInput {
  demonstrationId: string;
  demonstrationTypes: DemonstrationTypeInput[];
}

export interface DemonstrationTypeAssignment {
  demonstrationTypeName: TagName;
  effectivePlainDate: LocalDate;
  expirationPlainDate: LocalDate;
  approvalStatus: TagStatus;
  status: DemonstrationTypeStatus;
  createdAt: Date;
  updatedAt: Date;
}
