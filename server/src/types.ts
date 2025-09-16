import {
  BUNDLE_TYPE,
  CMCS_DIVISION,
  SIGNATURE_LEVEL,
  DOCUMENT_TYPES,
  PHASE,
  PHASE_STATUS,
  PERSON_TYPES,
  GRANT_LEVELS,
  ROLES,
  DATE_TYPES,
} from "./constants.js";

export type { CreateUserInput, UpdateUserInput, User } from "./model/user/userSchema.js";

export type {
  CreateDemonstrationInput,
  Demonstration,
  UpdateDemonstrationInput,
} from "./model/demonstration/demonstrationSchema.js";

export type {
  CreateDemonstrationStatusInput,
  DemonstrationStatus,
  UpdateDemonstrationStatusInput,
} from "./model/demonstrationStatus/demonstrationStatusSchema.js";

export type {
  AddExtensionStatusInput,
  AmendmentStatus,
  CreateAmendmentStatusInput,
  ExtensionStatus,
  UpdateAmendmentStatusInput,
  UpdateExtensionStatusInput,
} from "./model/modificationStatus/modificationStatusSchema.js";

export type { State } from "./model/state/stateSchema.js";

export type { Event, EventLoggedStatus, LogEventInput } from "./model/event/eventSchema.js";

export type {
  AddExtensionInput,
  Amendment,
  CreateAmendmentInput,
  Extension,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./model/modification/modificationSchema.js";

export type {
  Document,
  UploadDocumentInput,
  UpdateDocumentInput,
} from "./model/document/documentSchema.js";

export type { BundlePhase } from "./model/bundlePhase/bundlePhaseSchema.js";
export type { BundlePhaseDate } from "./model/bundlePhaseDate/bundlePhaseDateSchema.js";
export { Bundle } from "./model/bundle/bundleSchema.js";

export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];
export type CmcsDivision = (typeof CMCS_DIVISION)[number];
export type SignatureLevel = (typeof SIGNATURE_LEVEL)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type Phase = (typeof PHASE)[number];
export type PhaseStatus = (typeof PHASE_STATUS)[number];
export type PersonType = (typeof PERSON_TYPES)[number];
export type GrantLevel = (typeof GRANT_LEVELS)[number];
export type Role = (typeof ROLES)[number];
export type DateType = (typeof DATE_TYPES)[number];
