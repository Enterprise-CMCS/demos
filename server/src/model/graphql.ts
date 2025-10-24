import { amendmentSchema } from "./amendment/amendmentSchema.js";
import { amendmentResolvers } from "./amendment/amendmentResolvers.js";

import { applicationDateSchema } from "./applicationDate/applicationDateSchema.js";
import { applicationDateResolvers } from "./applicationDate/applicationDateResolvers.js";

import { applicationPhaseSchema } from "./applicationPhase/applicationPhaseSchema.js";
import { applicationPhaseResolvers } from "./applicationPhase/applicationPhaseResolvers.js";

import { applicationSchema } from "./application/applicationSchema.js";
import { applicationResolvers } from "./application/applicationResolvers.js";

import { applicationStatusSchema } from "./applicationStatus/applicationStatusSchema.js";
import { applicationStatusResolvers } from "./applicationStatus/applicationStatusResolvers.js";

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

import { eventTypeSchema } from "./eventType/eventTypeSchema.js";
import { eventTypeResolvers } from "./eventType/eventTypeResolvers.js";

import { extensionSchema } from "./extension/extensionSchema.js";
import { extensionResolvers } from "./extension/extensionResolvers.js";

import { logLevelSchema } from "./logLevel/logLevelSchema.js";
import { logLevelResolvers } from "./logLevel/logLevelResolvers.js";

import { personSchema } from "./person/personSchema.js";
import { personResolvers } from "./person/personResolvers.js";

import { personTypeSchema } from "./personType/personTypeSchema.js";
import { personTypeResolvers } from "./personType/personTypeResolvers.js";

import { phaseSchema } from "./phase/phaseSchema.js";
import { phaseResolvers } from "./phase/phaseResolvers.js";

import { phaseStatusSchema } from "./phaseStatus/phaseStatusSchema.js";
import { phaseStatusResolvers } from "./phaseStatus/phaseStatusResolvers.js";

import { roleSchema } from "./role/roleSchema.js";
import { roleResolvers } from "./role/roleResolvers.js";

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
  amendmentSchema,
  applicationDateSchema,
  applicationPhaseSchema,
  applicationSchema,
  applicationStatusSchema,
  dateTypeSchema,
  demonstrationRoleAssignmentSchema,
  demonstrationSchema,
  documentSchema,
  documentTypeSchema,
  eventSchema,
  eventTypeSchema,
  extensionSchema,
  logLevelSchema,
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
  amendmentResolvers,
  applicationDateResolvers,
  applicationPhaseResolvers,
  applicationResolvers,
  applicationStatusResolvers,
  customScalarResolvers,
  dateTypeResolvers,
  demonstrationResolvers,
  demonstrationRoleAssigmentResolvers,
  documentResolvers,
  documentTypeResolvers,
  eventResolvers,
  eventTypeResolvers,
  extensionResolvers,
  logLevelResolvers,
  personResolvers,
  personTypeResolvers,
  phaseResolvers,
  phaseStatusResolvers,
  roleResolvers,
  sdgDivisionResolvers,
  signatureLevelResolvers,
  stateResolvers,
  userResolvers,
];
