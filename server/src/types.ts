import { BUNDLE_TYPE } from "./constants.js";

// Export types for use in the client code
export type {
  User,
  CreateUserInput,
  UpdateUserInput,
} from "./model/user/userSchema.js";

export type {
  Demonstration,
  CreateDemonstrationInput,
  UpdateDemonstrationInput,
} from "./model/demonstration/demonstrationSchema.js";

export type {
  DemonstrationStatus,
  CreateDemonstrationStatusInput,
  UpdateDemonstrationStatusInput,
} from "./model/demonstrationStatus/demonstrationStatusSchema.js";

export type {
  AmendmentStatus,
  CreateAmendmentStatusInput,
  AddExtensionStatusInput,
  ExtensionStatus,
  UpdateAmendmentStatusInput,
  UpdateExtensionStatusInput,
} from "./model/modificationStatus/modificationStatusSchema.js";

export type { State } from "./model/state/stateSchema.js";

export type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from "./model/role/roleSchema.js";

export type {
  Permission,
  CreatePermissionInput,
  UpdatePermissionInput,
} from "./model/permission/permissionSchema.js";

export type {
  Event,
  EventLoggedStatus,
  LogEventInput,
} from "./model/event/eventSchema.js";

export type {
  CreateAmendmentInput,
  AddExtensionInput,
  Amendment,
  Extension,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./model/modification/modificationSchema.js";

export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];
