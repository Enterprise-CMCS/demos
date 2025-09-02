import { BUNDLE_TYPE, CMCS_DIVISION, SIGNATURE_LEVEL, DOCUMENT_TYPES } from "./constants.js";

// Export types for use in the client code
export type {
  CreateUserInput,
  UpdateUserInput,
  User,
} from "./model/user/userSchema.js";

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

export type {
  CreateRoleInput,
  Role,
  UpdateRoleInput,
} from "./model/role/roleSchema.js";

export type {
  CreatePermissionInput,
  Permission,
  UpdatePermissionInput,
} from "./model/permission/permissionSchema.js";

export type {
  Event,
  EventLoggedStatus,
  LogEventInput,
} from "./model/event/eventSchema.js";

export type {
  AddExtensionInput,
  Amendment,
  CreateAmendmentInput,
  Extension,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./model/modification/modificationSchema.js";

export type { Document,
  UploadDocumentInput,
  UpdateDocumentInput,
 } from "./model/document/documentSchema.js";

export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];
export type CmcsDivision = (typeof CMCS_DIVISION)[number];
export type SignatureLevel = (typeof SIGNATURE_LEVEL)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
