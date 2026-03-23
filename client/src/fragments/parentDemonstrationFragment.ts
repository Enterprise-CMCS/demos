import { gql } from "@apollo/client";
import type { Demonstration, Person, State, DemonstrationTypeAssignment } from "demos-server";
import { WorkflowApplication } from "components/application";

export const PARENT_DEMONSTRATION_FIELDS = gql`
  fragment PARENT_DEMONSTRATION_FIELDS on Demonstration {
    state {
      id
      name
    }
    primaryProjectOfficer {
      id
      fullName
    }
    expirationDate
    sdgDivision
    demonstrationTypes {
      demonstrationTypeName
      status
      effectiveDate
      expirationDate
      createdAt
      approvalStatus
    }
  }
`;

export type ParentDemonstrationFields = Pick<Demonstration, "expirationDate" | "sdgDivision"> & {
  state: Pick<State, "id" | "name">;
  primaryProjectOfficer: Pick<Person, "id" | "fullName">;
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
