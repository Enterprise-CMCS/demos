import { demonstrationSchema } from "./demonstration/demonstrationSchema.js";
import { demonstrationResolvers } from "./demonstration/demonstrationResolvers.js";

import { demonstrationStatusSchema } from "./demonstrationStatus/demonstrationStatusSchema.js";
import { demonstrationStatusResolvers } from "./demonstrationStatus/demonstrationStatusResolvers.js";

import { documentSchema } from "./document/documentSchema.js";
import { documentResolvers } from "./document/documentResolvers.js";

import { eventSchema, eventResolvers } from "./event/index.js";

import { modificationSchema } from "./modification/modificationSchema.js";
import { modificationStatusSchema } from "./modificationStatus/modificationStatusSchema.js";

import { modificationResolvers } from "./modification/modificationResolvers.js";
import { modificationStatusResolvers } from "./modificationStatus/modificationStatusResolvers.js";

import { permissionSchema } from "./permission/permissionSchema.js";
import { permissionResolvers } from "./permission/permissionResolvers.js";

import { roleSchema } from "./role/roleSchema.js";
import { roleResolvers } from "./role/roleResolvers.js";

import { stateSchema } from "./state/stateSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";

import { userSchema } from "./user/userSchema.js";
import { userResolvers } from "./user/userResolvers.js";

import { JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition } from "graphql-scalars";
import { cmcsDivisionSchema } from "./cmcsDivision/cmcsDivisionSchema.js";
import { signatureLevelSchema } from "./signatureLevel/signatureLevelSchema.js";
import { contactTypeSchema } from "./contactType/contactTypeSchema.js";
import { documentTypeSchema } from "./documentType/documentTypeSchema.js";
import { bundleSchema } from "./bundle/bundleSchema.js";
import { contactSchema } from "./contact/contactSchema.js";
import { contactResolvers } from "./contact/contactResolvers.js";

const scalarTypes = [JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition];

export const typeDefs = [
  demonstrationSchema,
  demonstrationStatusSchema,
  documentSchema,
  eventSchema,
  modificationSchema,
  modificationStatusSchema,
  permissionSchema,
  roleSchema,
  stateSchema,
  userSchema,
  cmcsDivisionSchema,
  signatureLevelSchema,
  contactTypeSchema,
  contactSchema,
  documentTypeSchema,
  bundleSchema,
  ...scalarTypes,
];

export const resolvers = [
  demonstrationResolvers,
  demonstrationStatusResolvers,
  documentResolvers,
  eventResolvers,
  modificationResolvers,
  modificationStatusResolvers,
  permissionResolvers,
  roleResolvers,
  stateResolvers,
  userResolvers,
  contactResolvers,
];
