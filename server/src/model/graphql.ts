import { bundleSchema } from "./bundle/bundleSchema.js";
import { bundleResolvers } from "./bundle/bundleResolvers.js";

import { bundleStatusSchema } from "./bundleStatus/bundleStatusSchema.js";

import { bundlePhaseSchema } from "./bundlePhase/bundlePhaseSchema.js";
import { bundlePhaseResolvers } from "./bundlePhase/bundlePhaseResolvers.js";

import { bundlePhaseDateSchema } from "./bundlePhaseDate/bundlePhaseDateSchema.js";
import { bundlePhaseDateResolvers } from "./bundlePhaseDate/bundlePhaseDateResolvers.js";

import { dateTypeSchema } from "./dateType/dateTypeSchema.js";

import { demonstrationSchema } from "./demonstration/demonstrationSchema.js";
import { demonstrationResolvers } from "./demonstration/demonstrationResolvers.js";

import { documentSchema } from "./document/documentSchema.js";
import { documentResolvers } from "./document/documentResolvers.js";

import { documentTypeSchema } from "./documentType/documentTypeSchema.js";

import { eventSchema, eventResolvers } from "./event/index.js";

import { modificationSchema } from "./modification/modificationSchema.js";
import { modificationResolvers } from "./modification/modificationResolvers.js";

import { phaseSchema } from "./phase/phaseSchema.js";

import { phaseStatusSchema } from "./phaseStatus/phaseStatusSchema.js";

import { stateSchema } from "./state/stateSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";

import { userSchema } from "./user/userSchema.js";
import { userResolvers } from "./user/userResolvers.js";

import { JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition } from "graphql-scalars";
import { personTypeSchema } from "./personType/personTypeSchema.js";
import { roleSchema } from "./role/roleSchema.js";

import { personSchema } from "./person/personSchema.js";
import { personResolvers } from "./person/personResolvers.js";
import { demonstrationRoleAssignmentSchema } from "./demonstrationRoleAssignment/demonstrationRoleAssignmentSchema.js";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignment/demonstrationRoleAssignmentResolvers.js";

const scalarTypes = [JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition];

export const typeDefs = [
  bundleSchema,
  bundleStatusSchema,
  bundlePhaseSchema,
  bundlePhaseDateSchema,
  dateTypeSchema,
  demonstrationSchema,
  documentSchema,
  documentTypeSchema,
  eventSchema,
  modificationSchema,
  phaseSchema,
  phaseStatusSchema,
  stateSchema,
  userSchema,
  personTypeSchema,
  roleSchema,
  personSchema,
  demonstrationRoleAssignmentSchema,
  ...scalarTypes,
];

export const resolvers = [
  bundleResolvers,
  bundlePhaseResolvers,
  bundlePhaseDateResolvers,
  demonstrationResolvers,
  documentResolvers,
  eventResolvers,
  modificationResolvers,
  stateResolvers,
  userResolvers,
  personResolvers,
  demonstrationRoleAssigmentResolvers,
];
