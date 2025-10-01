import {
  BUNDLE_STATUS,
  BUNDLE_TYPE,
  SDG_DIVISIONS,
  SIGNATURE_LEVEL,
  DOCUMENT_TYPES,
  PHASE_NAME,
  PHASE_STATUS,
  PERSON_TYPES,
  GRANT_LEVELS,
  ROLES,
  DATE_TYPES,
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

export type { Event, EventLoggedStatus, LogEventInput } from "./model/event/eventSchema.js";

export type {
  Amendment,
  Extension,
  CreateAmendmentInput,
  CreateExtensionInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./model/modification/modificationSchema.js";

export type {
  Document,
  UploadDocumentInput,
  UpdateDocumentInput,
} from "./model/document/documentSchema.js";

export type { BundlePhase } from "./model/bundlePhase/bundlePhaseSchema.js";
export type { Bundle } from "./model/bundle/bundleSchema.js";
export type {
  BundlePhaseDate,
  SetPhaseDateInput,
} from "./model/bundlePhaseDate/bundlePhaseDateSchema.js";

export type BundleStatus = (typeof BUNDLE_STATUS)[number];
export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];
export type SdgDivision = (typeof SDG_DIVISIONS)[number];
export type SignatureLevel = (typeof SIGNATURE_LEVEL)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type PhaseName = (typeof PHASE_NAME)[number];
export type PhaseStatus = (typeof PHASE_STATUS)[number];
export type PersonType = (typeof PERSON_TYPES)[number];
export type GrantLevel = (typeof GRANT_LEVELS)[number];
export type Role = (typeof ROLES)[number];
export type DateType = (typeof DATE_TYPES)[number];
