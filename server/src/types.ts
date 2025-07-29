import { BUNDLE_TYPE } from "./constants.js";

// Export types for use in the client code
export type {
  AddUserInput,
  UpdateUserInput,
  User,
} from "./model/user/userSchema.js";

export type {
  AddDemonstrationInput,
  Demonstration,
  UpdateDemonstrationInput,
} from "./model/demonstration/demonstrationSchema.js";

export type {
  AddDemonstrationStatusInput,
  DemonstrationStatus,
  UpdateDemonstrationStatusInput,
} from "./model/demonstrationStatus/demonstrationStatusSchema.js";

export type {
  AddAmendmentStatusInput,
  AmendmentStatus,
  UpdateAmendmentStatusInput,
} from "./model/modificationStatus/modificationStatusSchema.js";

export type { State } from "./model/state/stateSchema.js";

export type {
  AddRoleInput,
  Role,
  UpdateRoleInput,
} from "./model/role/roleSchema.js";

export type {
  AddPermissionInput,
  Permission,
  UpdatePermissionInput,
} from "./model/permission/permissionSchema.js";

export type {
  Event,
  EventLoggedStatus,
  LogEventInput,
} from "./model/event/eventSchema.js";

export type EventData = Record<
  string,
  string | number | boolean | null | undefined
>;

export type LogEventArguments = {
  eventType: string; // use your EventType enum if available in server
  eventData?: EventData; // additional event data
};

export interface GQLContext {
  logEvent?: (payload: LogEventArguments) => Promise<void>;
  user?: { id: string };
}

export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];
