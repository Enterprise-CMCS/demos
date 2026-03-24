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
    id: ID! @auth(requires: "Resolve Demonstration")
    name: NonEmptyString! @auth(requires: "Resolve Demonstration")
    description: String @auth(requires: "Resolve Demonstration")
    effectiveDate: DateTime @auth(requires: "Resolve Demonstration")
    expirationDate: DateTime @auth(requires: "Resolve Demonstration")
    sdgDivision: SdgDivision @auth(requires: "Resolve Demonstration")
    signatureLevel: SignatureLevel @auth(requires: "Resolve Demonstration")
    status: ApplicationStatus! @auth(requires: "Resolve Demonstration Application Workflow")
    state: State! @auth(requires: "Resolve Demonstration")
    currentPhaseName: PhaseName! @auth(requires: "Resolve Demonstration Application Workflow")
    phases: [ApplicationPhase!]! @auth(requires: "Resolve Demonstration Application Workflow")
    documents: [Document!]! @auth(requires: "Resolve Demonstration Documents")
    amendments: [Amendment!]! @auth(requires: "Resolve Demonstration Modifications")
    extensions: [Extension!]! @auth(requires: "Resolve Demonstration Modifications")
    createdAt: DateTime! @auth(requires: "Resolve Demonstration")
    updatedAt: DateTime! @auth(requires: "Resolve Demonstration")
    roles: [DemonstrationRoleAssignment!]! @auth(requires: "Resolve Demonstration Contacts")
    primaryProjectOfficer: Person! @auth(requires: "Resolve Demonstration")
    clearanceLevel: ClearanceLevel! @auth(requires: "Resolve Demonstration Application Workflow")
    tags: [Tag!]! @auth(requires: "Resolve Demonstration Application Workflow")
    demonstrationTypes: [DemonstrationTypeAssignment!]!
      @auth(requires: "Resolve Demonstration Application Workflow")
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
      @auth(requires: "Mutate Demonstrations")
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
      @auth(requires: "Mutate Demonstrations")
    deleteDemonstration(id: ID!): Demonstration @auth(requires: "Mutate Demonstrations")
  }

  type Query {
    demonstrations: [Demonstration!]! @auth(requires: "Query Demonstrations")
    demonstration(id: ID!): Demonstration @auth(requires: "Query Demonstrations")
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
