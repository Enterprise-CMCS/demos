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
  State,
  AddStateInput,
  UpdateStateInput,
} from "./model/state/stateSchema.js";

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
  EventHydrated,
  EventLoggedStatus
} from "./model/event/eventSchema.js";

export type {
  EventType,
  EventTypeId
} from "./model/event/eventTypeSchema.js"
