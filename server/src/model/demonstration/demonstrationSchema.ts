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
  SuggestedApplicationTag,
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
    currentPhaseName: PhaseName! @auth(requires: ["Access CMS Field"])
    phases: [ApplicationPhase!]! @auth(requires: ["Access CMS Field"])
    documents: [Document!]! @auth(requires: ["Access CMS Field"])
    amendments: [Amendment!]! @auth(requires: ["Access CMS Field"])
    extensions: [Extension!]! @auth(requires: ["Access CMS Field"])
    roles: [DemonstrationRoleAssignment!]! @auth(requires: ["Access CMS Field"])
    primaryProjectOfficer: Person!
    clearanceLevel: ClearanceLevel! @auth(requires: ["Access CMS Field"])
    tags: [Tag!]!
    demonstrationTypes: [DemonstrationTypeAssignment!]!
    suggestedApplicationTags: [TagName!]! @auth(requires: ["Access CMS Field"])
    suggestedApplicationTagDetails: [SuggestedApplicationTag!]!
      @auth(requires: ["Access CMS Field"])
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
      @auth(requires: ["Perform CMS Action"])
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
      @auth(requires: ["Perform CMS Action"])
    deleteDemonstration(id: ID!): Demonstration @auth(requires: ["Perform CMS Action"])
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
  suggestedApplicationTagDetails: SuggestedApplicationTag[];
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
