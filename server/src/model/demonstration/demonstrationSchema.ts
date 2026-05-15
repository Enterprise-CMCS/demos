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
    currentPhaseName: PhaseName! @auth(requires: "Access CMS-Only Fields")
    phases: [ApplicationPhase!]! @auth(requires: "Access CMS-Only Fields")
    documents: [Document!]! @auth(requires: "Access CMS-Only Fields")
    amendments: [Amendment!]! @auth(requires: "Access CMS-Only Fields")
    extensions: [Extension!]! @auth(requires: "Access CMS-Only Fields")
    roles: [DemonstrationRoleAssignment!]! @auth(requires: "Access CMS-Only Fields")
    primaryProjectOfficer: Person!
    clearanceLevel: ClearanceLevel! @auth(requires: "Access CMS-Only Fields")
    tags: [Tag!]! @auth(requires: "Access CMS-Only Fields")
    demonstrationTypes: [DemonstrationTypeAssignment!]!
    suggestedApplicationTags: [TagName!]! @auth(requires: "Access CMS-Only Fields")
    deliverables: [Deliverable!]! @auth(requires: "Access CMS-Only Fields")
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
      @auth(requires: "Access CMS-Only Mutations")
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
      @auth(requires: "Access CMS-Only Mutations")
    deleteDemonstration(id: ID!): Demonstration @auth(requires: "Delete Demonstration")
  }

  type Query {
    demonstrations: [Demonstration!]! @auth(requires: "Access CMS-Only Queries")
    demonstration(id: ID!): Demonstration @auth(requires: "Access CMS-Only Queries")
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
