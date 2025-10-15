import { bundleDateSchema } from "./bundleDate/bundleDateSchema.js";
import { bundleDateResolvers } from "./bundleDate/bundleDateResolvers.js";

import { bundlePhaseSchema } from "./bundlePhase/bundlePhaseSchema.js";
import { bundlePhaseResolvers } from "./bundlePhase/bundlePhaseResolvers.js";

import { bundleSchema } from "./bundle/bundleSchema.js";
import { bundleResolvers } from "./bundle/bundleResolvers.js";

import { bundleStatusSchema } from "./bundleStatus/bundleStatusSchema.js";
import { bundleStatusResolvers } from "./bundleStatus/bundleStatusResolvers.js";

import { sdgDivisionSchema } from "./sdgDivision/sdgDivisionSchema.js";
import { sdgDivisionResolvers } from "./sdgDivision/sdgDivisionResolvers.js";

import { dateTypeSchema } from "./dateType/dateTypeSchema.js";
import { dateTypeResolvers } from "./dateType/dateTypeResolvers.js";

import { demonstrationRoleAssignmentSchema } from "./demonstrationRoleAssignment/demonstrationRoleAssignmentSchema.js";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignment/demonstrationRoleAssignmentResolvers.js";

import { demonstrationSchema } from "./demonstration/demonstrationSchema.js";
import { demonstrationResolvers } from "./demonstration/demonstrationResolvers.js";

import { documentSchema } from "./document/documentSchema.js";
import { documentResolvers } from "./document/documentResolvers.js";

import { documentTypeSchema } from "./documentType/documentTypeSchema.js";
import { documentTypeResolvers } from "./documentType/documentTypeResolvers.js";

import { eventSchema } from "./event/eventSchema.js";
import { eventResolvers } from "./event/eventResolvers.js";

import { modificationSchema } from "./modification/modificationSchema.js";
import { modificationResolvers } from "./modification/modificationResolvers.js";

import { personSchema } from "./person/personSchema.js";
import { personResolvers } from "./person/personResolvers.js";

import { personTypeSchema } from "./personType/personTypeSchema.js";

import { phaseSchema } from "./phase/phaseSchema.js";
import { phaseResolvers } from "./phase/phaseResolvers.js";

import { phaseStatusSchema } from "./phaseStatus/phaseStatusSchema.js";
import { phaseStatusResolvers } from "./phaseStatus/phaseStatusResolvers.js";

import { roleSchema } from "./role/roleSchema.js";

import { signatureLevelSchema } from "./signatureLevel/signatureLevelSchema.js";
import { signatureLevelResolvers } from "./signatureLevel/signatureLevelResolvers.js";

import { stateSchema } from "./state/stateSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";

import { userSchema } from "./user/userSchema.js";
import { userResolvers } from "./user/userResolvers.js";

import {
  JSONObjectDefinition,
  DateTimeTypeDefinition,
  DateTypeDefinition,
  NonEmptyStringTypeDefinition,
} from "graphql-scalars";
import { customScalarResolvers } from "../customScalarResolvers.js";

const scalarTypes = [
  JSONObjectDefinition,
  DateTimeTypeDefinition,
  DateTypeDefinition,
  NonEmptyStringTypeDefinition,
];

export const typeDefs = [
  bundleDateSchema,
  bundlePhaseSchema,
  bundleSchema,
  bundleStatusSchema,
  dateTypeSchema,
  demonstrationRoleAssignmentSchema,
  demonstrationSchema,
  documentSchema,
  documentTypeSchema,
  eventSchema,
  modificationSchema,
  personSchema,
  personTypeSchema,
  phaseSchema,
  phaseStatusSchema,
  roleSchema,
  sdgDivisionSchema,
  signatureLevelSchema,
  stateSchema,
  userSchema,
  ...scalarTypes,
];

export const resolvers = [
  bundleDateResolvers,
  bundlePhaseResolvers,
  bundleResolvers,
  bundleStatusResolvers,
  customScalarResolvers,
  dateTypeResolvers,
  demonstrationResolvers,
  demonstrationRoleAssigmentResolvers,
  documentResolvers,
  documentTypeResolvers,
  eventResolvers,
  modificationResolvers,
  personResolvers,
  phaseResolvers,
  phaseStatusResolvers,
  sdgDivisionResolvers,
  signatureLevelResolvers,
  stateResolvers,
  userResolvers,
];
