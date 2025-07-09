import { demonstrationSchema } from "./demonstration/demonstrationSchema.js";
import { demonstrationResolvers } from "./demonstration/demonstrationResolvers.js";

import { demonstrationStatusSchema } from "./demonstrationStatus/demonstrationStatusSchema.js";
import { demonstrationStatusResolvers } from "./demonstrationStatus/demonstrationStatusResolvers.js";

import { eventSchema } from "./event/eventSchema.js";
import { eventTypeSchema } from "./event/eventTypeSchema.js";

import { permissionSchema } from "./permission/permissionSchema.js";
import { permissionResolvers } from "./permission/permissionResolvers.js";

import { roleSchema } from "./role/roleSchema.js";
import { roleResolvers } from "./role/roleResolvers.js";

import { stateSchema } from "./state/stateSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";

import { userSchema } from "./user/userSchema.js";
import { userResolvers } from "./user/userResolvers.js";

import {
  JSONObjectDefinition,
  DateTimeTypeDefinition,
  DateTypeDefinition,
} from "graphql-scalars";

const scalarTypes = [
  JSONObjectDefinition,
  DateTimeTypeDefinition,
  DateTypeDefinition,
];

export const typeDefs = [
  demonstrationSchema,
  demonstrationStatusSchema,
  eventSchema,
  eventTypeSchema,
  permissionSchema,
  roleSchema,
  stateSchema,
  userSchema,
  ...scalarTypes,
];

export const resolvers = [
  demonstrationResolvers,
  demonstrationStatusResolvers,
  permissionResolvers,
  roleResolvers,
  stateResolvers,
  userResolvers,
];
