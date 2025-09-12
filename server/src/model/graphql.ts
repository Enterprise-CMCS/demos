import { gql } from "graphql-tag";

import { dateTypeSchema } from "./dateType/dateTypeSchema.js";

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

import { phaseSchema } from "./phase/phaseSchema.js";

import { phaseStatusSchema } from "./phaseStatus/phaseStatusSchema.js";

import { stateSchema } from "./state/stateSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";

import { userSchema } from "./user/userSchema.js";
import { userResolvers } from "./user/userResolvers.js";

import { JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition } from "graphql-scalars";
import { personTypeSchema } from "./personType/personTypeSchema.js";
import { roleSchema } from "./role/roleSchema.js";

const scalarTypes = [JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition];

const mockDemonstrationSchemaExtension = gql`
  type Contact {
    id: String!
    fullName: String!
    email: String!
    contactType: String!
  }

  extend type Demonstration {
    contacts: [Contact!]!
  }
`;

// TO BE REPLACED WITH ACTUAL RESOLVERS WHEN CONTACTS ARE FULLY IMPLEMENTED
const mockDemonstrationResolverExtension = {
  Demonstration: {
    contacts: async () => {
      return [
        {
          id: "1",
          fullName: "John Doe",
          email: "john.doe@email.com",
          contactType: "Project Officer",
        },
      ];
    },
  },
};

export const typeDefs = [
  dateTypeSchema,
  demonstrationSchema,
  demonstrationStatusSchema,
  documentSchema,
  eventSchema,
  modificationSchema,
  modificationStatusSchema,
  phaseSchema,
  phaseStatusSchema,
  stateSchema,
  userSchema,
  personTypeSchema,
  mockDemonstrationSchemaExtension,
  roleSchema,
  ...scalarTypes,
];

export const resolvers = [
  demonstrationResolvers,
  demonstrationStatusResolvers,
  documentResolvers,
  eventResolvers,
  modificationResolvers,
  modificationStatusResolvers,
  stateResolvers,
  userResolvers,
  mockDemonstrationResolverExtension,
];
