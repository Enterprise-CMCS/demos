import { gql } from "@apollo/client";

export const WORKFLOW_PHASE_FIELDS = gql`
  fragment WORKFLOW_PHASE_FIELDS on ApplicationPhase {
    phaseName
    phaseStatus
    phaseDates {
      dateType
      dateValue
      plainDate
    }
    phaseNotes {
      noteType
      content
    }
  }
`;
