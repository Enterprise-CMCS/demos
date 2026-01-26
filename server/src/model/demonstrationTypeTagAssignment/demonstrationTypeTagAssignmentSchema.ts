import { DemonstrationTypeStatus, Tag } from "../../types.js";
import { gql } from "graphql-tag";

export const demonstrationTypeTagAssignmentSchema = gql`
  scalar DemonstrationTypeStatus

  type DemonstrationTypeAssignment {
    demonstrationType: Tag!
    effectiveDate: DateTime!
    expirationDate: DateTime!
    status: DemonstrationTypeStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface DemonstrationTypeAssignment {
  demonstrationType: Tag;
  effectiveDate: Date;
  expirationDate: Date;
  status: DemonstrationTypeStatus;
  createdAt: Date;
  updatedAt: Date;
}
