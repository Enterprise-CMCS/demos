import { DemonstrationTypeStatus, Tag } from "../../types.js";
import { gql } from "graphql-tag";

export const demonstrationTypeTagAssignmentSchema = gql`
  scalar DemonstrationTypeStatus

  type DemonstrationTypeAssignment {
    demonstrationTypeName: Tag!
    effectiveDate: DateTime!
    expirationDate: DateTime!
    status: DemonstrationTypeStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface DemonstrationTypeAssignment {
  demonstrationTypeName: Tag;
  effectiveDate: Date;
  expirationDate: Date;
  status: DemonstrationTypeStatus;
  createdAt: Date;
  updatedAt: Date;
}
