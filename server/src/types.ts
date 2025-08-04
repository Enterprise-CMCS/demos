// Export types for use in the client code
export type {
  User,
  AddUserInput,
  UpdateUserInput,
} from "./model/user/userSchema.js";

export type {
  Demonstration,
  AddDemonstrationInput,
  UpdateDemonstrationInput,
} from "./model/demonstration/demonstrationSchema.js";

export type {
  DemonstrationStatus,
  AddDemonstrationStatusInput,
  UpdateDemonstrationStatusInput,
} from "./model/demonstrationStatus/demonstrationStatusSchema.js";

export type {
  AmendmentStatus,
  AddAmendmentStatusInput,
  UpdateAmendmentStatusInput,
} from "./model/modificationStatus/modificationStatusSchema.js";

export type { State } from "./model/state/stateSchema.js";

export type {
  Role,
  AddRoleInput,
  UpdateRoleInput,
} from "./model/role/roleSchema.js";

export type {
  Permission,
  AddPermissionInput,
  UpdatePermissionInput,
} from "./model/permission/permissionSchema.js";

export type {
  Event,
  LogEventInput,
  EventLoggedStatus,
} from "./model/event/eventSchema.js";

export type {
  Document,
  AddDemonstrationDocumentInput,
  UpdateDemonstrationDocumentInput,
} from "./model/document/documentSchema.js";

import { BUNDLE_TYPE } from "./constants.js";
export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];
