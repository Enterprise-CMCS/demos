import { demonstrationSchema } from "./demonstration/demonstrationSchema";
import { demonstrationResolvers } from "./demonstration/demonstrationResolvers";

import { demonstrationStatusSchema } from "./demonstrationStatus/demonstrationStatusSchema";
import { demonstrationStatusResolvers } from "./demonstrationStatus/demonstrationStatusResolvers";

import { permissionSchema } from "./permission/permissionSchema";
import { permissionResolvers } from "./permission/permissionResolvers";

import { roleSchema } from "./role/roleSchema";
import { roleResolvers } from "./role/roleResolvers";

import { stateSchema } from "./state/stateSchema";
import { stateResolvers } from "./state/stateResolvers";

import { userSchema } from "./user/userSchema";
import { userResolvers } from "./user/userResolvers";

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
