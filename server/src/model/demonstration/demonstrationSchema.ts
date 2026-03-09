import { gql } from "graphql-tag";
import {
  Amendment,
  ApplicationPhase,
  ApplicationStatus,
  ClearanceLevel,
  DateTimeOrLocalDate,
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
} from "../../types.js";

export const demonstrationSchema = gql`
  type Demonstration {
    id: ID!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    name: NonEmptyString!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
          "Download Document"
        ]
      )
    description: String
      @auth(
        permissions: [
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    effectiveDate: DateTime
      @auth(
        permissions: [
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    expirationDate: DateTime
      @auth(
        permissions: [
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    sdgDivision: SdgDivision
      @auth(
        permissions: [
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    signatureLevel: SignatureLevel
      @auth(
        permissions: [
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    status: ApplicationStatus!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    state: State!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    currentPhaseName: PhaseName!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    phases: [ApplicationPhase!]!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])

    documents: [Document!]!
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
        ]
      )
    amendments: [Amendment!]!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
        ]
      )
    extensions: [Extension!]!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
        ]
      )
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [DemonstrationRoleAssignment!]!
      @auth(
        permissions: [
          "Manage Demonstration Details"
          "Manage Application Details"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
        ]
      )
    primaryProjectOfficer: Person!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
        ]
      )
    clearanceLevel: ClearanceLevel!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    tags: [Tag!]! @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    demonstrationTypes: [DemonstrationTypeAssignment!]!
      @auth(
        permissions: [
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
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
      @auth(permissions: ["Manage Demonstrations", "Manage Applications"])
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
      @auth(
        permissions: [
          "Manage Demonstrations"
          "Manage Applications"
          "Manage Demonstration Details"
          "Manage Application Details"
        ]
      )
    deleteDemonstration(id: ID!): Demonstration
      @auth(permissions: ["Manage Demonstrations", "Manage Applications"])
  }

  type Query {
    demonstrations: [Demonstration!]!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
        ]
      )
    demonstration(id: ID!): Demonstration
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
        ]
      )
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
  tags: Tag[];
  demonstrationTypes: DemonstrationTypeAssignment[];
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
