import {
  Person,
  Document,
  PhaseName,
  PhaseStatus,
  ApplicationDate,
  ApplicationNote,
  ApplicationStatus,
  ClearanceLevel,
  Tag,
  DemonstrationTypeAssignment,
} from "demos-server";

export type ApplicationWorkflowDocument = Pick<
  Document,
  "id" | "name" | "description" | "documentType" | "phaseName" | "createdAt"
> & {
  owner: { person: Pick<Person, "fullName"> };
};

export type SimplePhase = {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: Pick<ApplicationDate, "dateType" | "dateValue">[];
  phaseNotes: Pick<ApplicationNote, "noteType" | "content">[];
};

export type WorkflowApplication = {
  id: string;
  currentPhaseName: PhaseName;
  status: ApplicationStatus;
  phases: SimplePhase[];
  documents: ApplicationWorkflowDocument[];
  tags: Tag[];
  clearanceLevel: ClearanceLevel;
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

export type WorkflowApplicationType = "demonstration" | "amendment" | "extension";
