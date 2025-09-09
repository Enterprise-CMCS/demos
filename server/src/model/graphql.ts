import { gql } from "graphql-tag";

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

import { phaseSchema } from "./phase/phaseSchema.js";
import { phaseStatusSchema } from "./phaseStatus/phaseStatusSchema.js";

import { roleSchema } from "./role/roleSchema.js";
import { roleResolvers } from "./role/roleResolvers.js";

import { stateSchema } from "./state/stateSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";

import { userSchema } from "./user/userSchema.js";
import { userResolvers } from "./user/userResolvers.js";

import { JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition } from "graphql-scalars";
import { personTypeSchema } from "./personType/personTypeSchema.js";

const scalarTypes = [JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition];

const mockDemonstrationSchemaExtension = gql`
  type Contact {
    id: String!
    fullName: String!
    email: String!
    contactType: String!
  }

  type DemonstrationTypes {
    id: String!
  }

  extend type Demonstration {
    contacts: [Contact!]!
    demonstrationTypes: [DemonstrationTypes!]!
  }
`;

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
    demonstrationTypes: async () => {
      return [];
    },
  },
};

export const typeDefs = [
  demonstrationSchema,
  demonstrationStatusSchema,
  documentSchema,
  eventSchema,
  modificationSchema,
  modificationStatusSchema,
  permissionSchema,
  phaseSchema,
  phaseStatusSchema,
  roleSchema,
  stateSchema,
  userSchema,
  personTypeSchema,
  mockDemonstrationSchemaExtension,
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
  mockDemonstrationResolverExtension,
];
