import {
  ADMIN_DEMONSTRATION_ROLES,
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  CLEARANCE_LEVELS,
  CMS_USER_DEMONSTRATION_ROLES,
  DATE_TYPES,
  DOCUMENT_TYPES,
  EVENT_TYPES,
  EXPECTED_TIMESTAMPS,
  GRANT_LEVELS,
  LOG_LEVELS,
  NOTE_TYPES,
  PERSON_TYPES,
  PHASE_NAME,
  PHASE_NAMES_WITH_TRACKED_STATUS,
  PHASE_STATUS,
  REVIEW_PHASE_DATE_TYPES,
  REVIEW_PHASE_NOTE_TYPES,
  ROLES,
  SDG_DIVISIONS,
  SIGNATURE_LEVEL,
  STATE_USER_DEMONSTRATION_ROLES,
  TAG_CONFIGURATION_SOURCES,
  TAG_CONFIGURATION_STATUSES,
  TAG_TYPES,
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
  UploadDocumentResponse,
} from "./model/document/documentSchema.js";

export type { SetApplicationClearanceLevelInput } from "./model/application/applicationSchema.js";

export type {
  ApplicationPhase,
  CompletePhaseInput,
  SetApplicationPhaseStatusInput,
} from "./model/applicationPhase/applicationPhaseSchema.js";
export type { Application } from "./model/application/applicationSchema.js";
export type {
  ApplicationDate,
  ApplicationDateInput,
  SetApplicationDateInput,
  SetApplicationDatesInput,
} from "./model/applicationDate/applicationDateSchema.js";

export type {
  ApplicationNote,
  ApplicationNoteInput,
  SetApplicationNotesInput,
} from "./model/applicationNote/applicationNoteSchema.js";

export type ClearanceLevel = (typeof CLEARANCE_LEVELS)[number];
export type LocalDate = string & { readonly __brand: "LocalDate" };
export type DateTimeOrLocalDate = Date | LocalDate;
export type NonEmptyString = string;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];
export type ApplicationType = (typeof APPLICATION_TYPES)[number];
export type SdgDivision = (typeof SDG_DIVISIONS)[number];
export type SignatureLevel = (typeof SIGNATURE_LEVEL)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type PhaseName = (typeof PHASE_NAME)[number];
export type PhaseNameWithTrackedStatus = (typeof PHASE_NAMES_WITH_TRACKED_STATUS)[number];
export type PhaseStatus = (typeof PHASE_STATUS)[number];
export type PersonType = (typeof PERSON_TYPES)[number];
export type GrantLevel = (typeof GRANT_LEVELS)[number];
export type Role = (typeof ROLES)[number];
export type DateType = (typeof DATE_TYPES)[number];
export type ExpectedTimestamp = (typeof EXPECTED_TIMESTAMPS)[number];
export type LogLevel = (typeof LOG_LEVELS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type NoteType = (typeof NOTE_TYPES)[number];
export type AdminDemonstrationRole = (typeof ADMIN_DEMONSTRATION_ROLES)[number];
export type CmsUserDemonstrationRole = (typeof CMS_USER_DEMONSTRATION_ROLES)[number];
export type StateUserDemonstrationRole = (typeof STATE_USER_DEMONSTRATION_ROLES)[number];
export type ReviewPhaseDateTypes = (typeof REVIEW_PHASE_DATE_TYPES)[number];
export type ReviewPhaseNoteTypes = (typeof REVIEW_PHASE_NOTE_TYPES)[number];
export type TagConfigurationStatus = (typeof TAG_CONFIGURATION_STATUSES)[number];
export type TagConfigurationSource = (typeof TAG_CONFIGURATION_SOURCES)[number];
export type TagType = (typeof TAG_TYPES)[number];
