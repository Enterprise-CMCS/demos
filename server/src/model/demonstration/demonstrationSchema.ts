import { gql } from "graphql-tag";
import {
  Amendment,
  ApplicationPhase,
  ApplicationStatus,
  ClearanceLevel,
  DateTimeOrLocalDate,
  Deliverable,
  DemonstrationRoleAssignment,
  DemonstrationTypeAssignment,
  Document,
  Extension,
  NonEmptyString,
  Person,
  PhaseName,
  SdgDivision,
  SignatureLevel,
  State,
  Tag,
  TagName,
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
    roles: [DemonstrationRoleAssignment!]!
    primaryProjectOfficer: Person!
    clearanceLevel: ClearanceLevel!
    tags: [Tag!]!
    demonstrationTypes: [DemonstrationTypeAssignment!]!
    suggestedApplicationTags: [TagName!]!
    deliverables: [Deliverable!]!
    createdAt: DateTime!
    updatedAt: DateTime!
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
  roles: DemonstrationRoleAssignment[];
  primaryProjectOfficer: Person;
  clearanceLevel: ClearanceLevel;
  tags: Tag[];
  demonstrationTypes: DemonstrationTypeAssignment[];
  suggestedApplicationTags: TagName[];
  deliverables: Deliverable[];
  createdAt: Date;
  updatedAt: Date;
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
