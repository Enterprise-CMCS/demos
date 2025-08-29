import { gql } from "graphql-tag";
import { ContactType } from "../contactType/contactTypeSchema";
import { Bundle } from "../bundle/bundleSchema";
import { User } from "../user/userSchema";

export const contactSchema = gql`
  type Contact {
    id: ID!
    contactType: ContactType!
    bundle: Bundle!
    user: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateContactInput {
    contactTypeId: String!
    bundleId: ID!
    userId: ID!
  }

  type Mutation {
    createContact(input: CreateContactInput!): Contact
    deleteContacts(ids: [ID!]!): Int!
  }

  type Query {
    contacts: [Contact!]!
    contact(id: ID!): Contact
  }
`;

export interface Contact {
  id: string;
  contactType: ContactType;
  bundle: Bundle;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  contactTypeId: string;
  bundleId: string;
  userId: string;
}
