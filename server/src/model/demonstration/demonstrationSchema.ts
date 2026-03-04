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
  type Demonstration @viewApplication {
    id: ID! @viewDemonstration
    name: NonEmptyString! @viewDemonstration
    description: String @viewDemonstration
    effectiveDate: DateTime @viewDemonstration
    expirationDate: DateTime @viewDemonstration
    sdgDivision: SdgDivision
    signatureLevel: SignatureLevel
    status: ApplicationStatus!
    state: State! @viewDemonstration
    currentPhaseName: PhaseName!
    phases: [ApplicationPhase!]!
    documents: [Document!]!
    amendments: [Amendment!]!
    extensions: [Extension!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [DemonstrationRoleAssignment!]!
    primaryProjectOfficer: Person! @viewDemonstration
    clearanceLevel: ClearanceLevel!
    tags: [Tag!]! @viewDemonstration
    demonstrationTypes: [DemonstrationTypeAssignment!]! @viewDemonstration
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
    demonstrations: [Demonstration!]! @public
    demonstration(id: ID!): Demonstration @public
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
