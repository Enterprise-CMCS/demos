import { gql } from "graphql-tag";
import { Role } from "../role/roleSchema";

export const permissionSchema = gql`
  type Permission {
    id: ID!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [Role!]!
  }

  input AddPermissionInput {
    name: String!
    description: String!
    roleIds: [ID!]
  }

  input UpdatePermissionInput {
    name: String
    description: String
    roleIds: [ID!]
  }

  type Mutation {
    addPermission(input: AddPermissionInput!): Permission
    updatePermission(input: UpdatePermissionInput!): Permission
    deletePermission(id: ID!): Permission
  }

  type Query {
    permissions: [Permission]!
    permission(id: ID!): Permission
  }
`;

export type DateTime = Date;
export interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  roles: Role[];
}

export interface AddPermissionInput {
  name: string;
  description: string;
  roleIds?: string[];
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
  roleIds?: string[];
}
