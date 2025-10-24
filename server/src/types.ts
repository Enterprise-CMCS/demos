import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  SDG_DIVISIONS,
  SIGNATURE_LEVEL,
  DOCUMENT_TYPES,
  PHASE_NAME,
  PHASE_STATUS,
  PERSON_TYPES,
  GRANT_LEVELS,
  ROLES,
  DATE_TYPES,
  LOG_LEVELS,
  EVENT_TYPES,
} from "./constants.js";

export type {
  DemonstrationRoleAssignment,
  SetDemonstrationRoleInput,
  UnsetDemonstrationRoleInput,
} from "./model/demonstrationRoleAssignment/demonstrationRoleAssignmentSchema.js";

export type { User } from "./model/user/userSchema.js";

export type { Person } from "./model/person/personSchema.js";

export type {
  CreateDemonstrationInput,
  Demonstration,
  UpdateDemonstrationInput,
} from "./model/demonstration/demonstrationSchema.js";

export type { State } from "./model/state/stateSchema.js";

export type { Event, LogEventInput } from "./model/event/eventSchema.js";

export type {
  Amendment,
  CreateAmendmentInput,
  UpdateAmendmentInput,
} from "./model/amendment/amendmentSchema.js";

export type {
  Extension,
  CreateExtensionInput,
  UpdateExtensionInput,
} from "./model/extension/extensionSchema.js";

export type {
  Document,
  UploadDocumentInput,
  UpdateDocumentInput,
} from "./model/document/documentSchema.js";

export type { ApplicationPhase } from "./model/applicationPhase/applicationPhaseSchema.js";
export type { Application } from "./model/application/applicationSchema.js";
export type {
  ApplicationDate,
  SetApplicationDateInput,
} from "./model/applicationDate/applicationDateSchema.js";

export type NonEmptyString = string;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];
export type ApplicationType = (typeof APPLICATION_TYPES)[number];
export type SdgDivision = (typeof SDG_DIVISIONS)[number];
export type SignatureLevel = (typeof SIGNATURE_LEVEL)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type PhaseName = (typeof PHASE_NAME)[number];
export type PhaseStatus = (typeof PHASE_STATUS)[number];
export type PersonType = (typeof PERSON_TYPES)[number];
export type GrantLevel = (typeof GRANT_LEVELS)[number];
export type Role = (typeof ROLES)[number];
export type DateType = (typeof DATE_TYPES)[number];
export type LogLevel = (typeof LOG_LEVELS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
