import {
  DateTimeTypeDefinition,
  DateTypeDefinition,
  JSONObjectDefinition,
} from "graphql-scalars";

import {
  demonstrationResolvers,
} from "./demonstration/demonstrationResolvers.js";
import { demonstrationSchema } from "./demonstration/demonstrationSchema.js";
import {
  demonstrationStatusResolvers,
} from "./demonstrationStatus/demonstrationStatusResolvers.js";
import {
  demonstrationStatusSchema,
} from "./demonstrationStatus/demonstrationStatusSchema.js";
import { documentResolvers } from "./document/documentResolvers.js";
import { documentSchema } from "./document/documentSchema.js";
import { documentTypeResolvers } from "./documentType/documentTypeResolver.js";
import { documentTypeSchema } from "./documentType/documentTypeSchema.js";
import {
  eventResolvers,
  eventSchema,
} from "./event/index.js";
import { extensionResolvers } from "./extension/extensionResolvers.js";
import { extensionSchema } from "./extension/extensionSchema.js";
import { modificationResolvers } from "./modification/modificationResolvers.js";
import { modificationSchema } from "./modification/modificationSchema.js";
import {
  modificationStatusResolvers,
} from "./modificationStatus/modificationStatusResolvers.js";
import {
  modificationStatusSchema,
} from "./modificationStatus/modificationStatusSchema.js";
import { permissionResolvers } from "./permission/permissionResolvers.js";
import { permissionSchema } from "./permission/permissionSchema.js";
import { roleResolvers } from "./role/roleResolvers.js";
import { roleSchema } from "./role/roleSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";
import { stateSchema } from "./state/stateSchema.js";
import { userResolvers } from "./user/userResolvers.js";
import { userSchema } from "./user/userSchema.js";

const scalarTypes = [
  JSONObjectDefinition,
  DateTimeTypeDefinition,
  DateTypeDefinition,
];

export const typeDefs = [
  demonstrationSchema,
  demonstrationStatusSchema,
  documentSchema,
  documentTypeSchema,
  eventSchema,
  modificationSchema,
  modificationStatusSchema,
  permissionSchema,
  roleSchema,
  stateSchema,
  userSchema,
  ...scalarTypes,
  extensionSchema,
];

export const resolvers = [
  demonstrationResolvers,
  demonstrationStatusResolvers,
  documentResolvers,
  documentTypeResolvers,
  eventResolvers,
  modificationResolvers,
  modificationStatusResolvers,
  permissionResolvers,
  roleResolvers,
  stateResolvers,
  userResolvers,
  extensionResolvers,
];
