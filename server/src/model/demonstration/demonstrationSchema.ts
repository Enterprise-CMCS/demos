import { gql } from "graphql-tag";
import { Document } from "../document/documentSchema.js";
import { Amendment } from "../amendment/amendmentSchema.js";
import { Extension } from "../extension/extensionSchema.js";
import { State } from "../state/stateSchema.js";
import {
  SdgDivision,
  SignatureLevel,
  PhaseName,
  ApplicationPhase,
  ApplicationStatus,
  DemonstrationRoleAssignment,
  NonEmptyString,
  Person,
  DateTimeOrLocalDate,
  ClearanceLevel,
} from "../../types.js";

export const demonstrationSchema = gql`
  type Demonstration {
    id: ID!
    name: NonEmptyString!
    description: String
    effectiveDate: DateTime
    expirationDate: DateTime
    sdgDivision: SdgDivision
    signatureLevel: SignatureLevel
    status: ApplicationStatus!
    state: State!
    currentPhaseName: PhaseName!
    phases: [ApplicationPhase!]!
    documents: [Document!]!
    amendments: [Amendment!]!
    extensions: [Extension!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [DemonstrationRoleAssignment!]!
    primaryProjectOfficer: Person!
    clearanceLevel: ClearanceLevel!
  }

  input CreateDemonstrationInput {
    name: NonEmptyString!
    stateId: ID!
    projectOfficerUserId: String!
    description: String
    sdgDivision: SdgDivision
    signatureLevel: SignatureLevel
  }

  input UpdateDemonstrationInput {
    name: NonEmptyString
    description: String
    effectiveDate: DateTimeOrLocalDate
    expirationDate: DateTimeOrLocalDate
    sdgDivision: SdgDivision
    signatureLevel: SignatureLevel
    status: ApplicationStatus
    stateId: ID
    projectOfficerUserId: String
  }

  type Mutation {
    createDemonstration(input: CreateDemonstrationInput!): Demonstration
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
    deleteDemonstration(id: ID!): Demonstration
  }

  type Query {
    demonstrations: [Demonstration!]!
    demonstration(id: ID!): Demonstration
  }
`;

export interface Demonstration {
  id: string;
  name: NonEmptyString;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
  status: ApplicationStatus;
  state: State;
  currentPhaseName: PhaseName;
  phases: ApplicationPhase[];
  documents: Document[];
  amendments: Amendment[];
  extensions: Extension[];
  createdAt: Date;
  updatedAt: Date;
  roles: DemonstrationRoleAssignment[];
  primaryProjectOfficer: Person;
  clearanceLevel: ClearanceLevel;
}

export interface CreateDemonstrationInput {
  name: NonEmptyString;
  projectOfficerUserId: string;
  stateId: string;
  description?: string;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
}

export interface UpdateDemonstrationInput {
  name?: NonEmptyString;
  description?: string;
  effectiveDate?: DateTimeOrLocalDate | null;
  expirationDate?: DateTimeOrLocalDate | null;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
  status?: ApplicationStatus;
  stateId?: string;
  projectOfficerUserId?: string;
}
