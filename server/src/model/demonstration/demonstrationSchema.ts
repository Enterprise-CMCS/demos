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
    currentPhaseName: PhaseName! @auth(requires: "Access Application Workflow")
    phases: [ApplicationPhase!]! @auth(requires: "Access Application Workflow")
    documents: [Document!]! @auth(requires: "Access Application Documents")
    amendments: [Amendment!]! @auth(requires: "Access Demonstration Modifications")
    extensions: [Extension!]! @auth(requires: "Access Demonstration Modifications")
    roles: [DemonstrationRoleAssignment!]! @auth(requires: "Access Demonstration Contacts")
    primaryProjectOfficer: Person!
    clearanceLevel: ClearanceLevel! @auth(requires: "Access Application Workflow")
    tags: [Tag!]! @auth(requires: "Access Application Workflow")
    demonstrationTypes: [DemonstrationTypeAssignment!]!
      @auth(requires: "Access Demonstration DemonstrationTypes")
    suggestedApplicationTags: [TagName!]! @auth(requires: "Access Application Workflow")
    deliverables: [Deliverable!]! @auth(requires: "Access Demonstration Deliverables")
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateDemonstrationInput {
    name: NonEmptyString!
    stateId: ID!
    projectOfficerUserId: String!
    description: String
    sdgDivision: SdgDivision
  }

  input UpdateDemonstrationInput {
    name: NonEmptyString
    description: String
    effectiveDate: DateTimeOrLocalDate
    expirationDate: DateTimeOrLocalDate
    sdgDivision: SdgDivision
    status: ApplicationStatus
    stateId: ID
    projectOfficerUserId: String
  }

  type Mutation {
    createDemonstration(input: CreateDemonstrationInput!): Demonstration
      @auth(requires: "Create Demonstration")
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
      @auth(requires: "Manage Demonstration")
    deleteDemonstration(id: ID!): Demonstration @auth(requires: "Delete Demonstration")
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
}

export interface UpdateDemonstrationInput {
  name?: NonEmptyString;
  description?: string;
  effectiveDate?: DateTimeOrLocalDate | null;
  expirationDate?: DateTimeOrLocalDate | null;
  sdgDivision?: SdgDivision;
  status?: ApplicationStatus;
  stateId?: string;
  projectOfficerUserId?: string;
}
