import { gql } from "graphql-tag";
import { Role } from "../role/roleSchema.js";

export const permissionSchema = gql`
  type Permission {
    id: String!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [Role!]!
  }

  input CreatePermissionInput {
    id: String!
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
    createPermission(input: CreatePermissionInput!): Permission
    updatePermission(id: String!, input: UpdatePermissionInput!): Permission
    deletePermission(id: String!): Permission
  }

  type Query {
    permissions: [Permission!]!
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

export interface CreatePermissionInput {
  id: string;
  name: string;
  description: string;
  roleIds?: string[];
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
  roleIds?: string[];
}
