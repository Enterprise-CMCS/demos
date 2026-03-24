import { gql } from "@apollo/client";
import type { Demonstration, DemonstrationTypeAssignment } from "demos-server";
import { WorkflowApplication } from "components/application";

export const PARENT_DEMONSTRATION_FIELDS = gql`
  fragment PARENT_DEMONSTRATION_FIELDS on Demonstration {
    id
    status
    demonstrationTypes {
      demonstrationTypeName
      status
      effectiveDate
      approvalStatus
      expirationDate
      createdAt
    }
  }
`;

export type ParentDemonstrationFields = Pick<Demonstration, "id" | "status"> & {
  demonstrationTypes: Pick<
    DemonstrationTypeAssignment,
    | "demonstrationTypeName"
    | "status"
    | "effectiveDate"
    | "expirationDate"
    | "createdAt"
    | "approvalStatus"
  >[];
};

export type ApplicationWorkflowSubApplication = WorkflowApplication &
  Pick<Demonstration, "name" | "description" | "effectiveDate" | "signatureLevel" | "status"> & {
    demonstration: ParentDemonstrationFields;
  };
