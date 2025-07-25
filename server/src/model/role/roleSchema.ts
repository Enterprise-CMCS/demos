import { gql } from "graphql-tag";
import { User } from "../user/userSchema.js";
import { Permission } from "../permission/permissionSchema.js";

export const roleSchema = gql`
  type Role {
    id: String!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    users: [User!]!
    permissions: [Permission!]!
  }

  input AddRoleInput {
    id: String!
    name: String!
    description: String!
    userIds: [ID!]
    permissionIds: [ID!]
  }

  input UpdateRoleInput {
    name: String
    description: String
    userIds: [ID!]
    permissionIds: [ID!]
  }

  type Mutation {
    addRole(input: AddRoleInput!): Role
    updateRole(id: String!, input: UpdateRoleInput!): Role
    deleteRole(id: String!): Role
  }

  type Query {
    roles: [Role]!
    role(id: ID!): Role
  }
`;

export type DateTime = Date;
export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  users: User[];
  permissions: Permission[];
}

export interface AddRoleInput {
  id: string;
  name: string;
  description: string;
  userIds?: string[];
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  userIds?: string[];
  permissionIds?: string[];
}
