import {
  ADMIN_DEMONSTRATION_ROLES,
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  CMS_USER_DEMONSTRATION_ROLES,
  DATE_TYPES,
  DOCUMENT_TYPES,
  EVENT_TYPES,
  EXPECTED_TIMESTAMPS,
  GRANT_LEVELS,
  LOG_LEVELS,
  PERSON_TYPES,
  PHASE_NAME,
  PHASE_STATUS,
  ROLES,
  SDG_DIVISIONS,
  SIGNATURE_LEVEL,
  STATE_USER_DEMONSTRATION_ROLES,
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
  UpdateDocumentInput,
  UploadDocumentInput,
} from "./model/document/documentSchema.js";

export type {
  ApplicationPhase,
  SetApplicationPhaseStatusInput,
} from "./model/applicationPhase/applicationPhaseSchema.js";
export type { Application } from "./model/application/applicationSchema.js";
export type {
  ApplicationDate,
  ApplicationDateInput,
  SetApplicationDateInput,
  SetApplicationDatesInput,
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
export type ExpectedTimestamp = (typeof EXPECTED_TIMESTAMPS)[number];
export type LogLevel = (typeof LOG_LEVELS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type AdminDemonstrationRole = (typeof ADMIN_DEMONSTRATION_ROLES)[number];
export type CmsUserDemonstrationRole = (typeof CMS_USER_DEMONSTRATION_ROLES)[number];
export type StateUserDemonstrationRole = (typeof STATE_USER_DEMONSTRATION_ROLES)[number];
