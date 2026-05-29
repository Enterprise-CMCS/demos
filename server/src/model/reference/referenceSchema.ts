import { gql } from "graphql-tag";
import { NonEmptyString, Tag } from "../../types";

export const referenceSchema = gql`
  type ReferenceAgreement {
    id: ID!
    name: NonEmptyString!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Reference {
    id: ID!
    name: NonEmptyString!
    description: NonEmptyString!
    agreement: ReferenceAgreement
    tags: [Tag!]!
    demonstrationTypes: [Tag!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    references(withTag: TagName): [Reference!]!
  }
`;

export interface ReferenceAgreement {
  id: string;
  name: NonEmptyString;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reference {
  id: string;
  name: NonEmptyString;
  description: NonEmptyString;
  agreement: ReferenceAgreement | null;
  tags: Tag[];
  demonstrationTypes: Tag[];
  createdAt: Date;
  updatedAt: Date;
}
