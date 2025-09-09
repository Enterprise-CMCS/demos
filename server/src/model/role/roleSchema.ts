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
`;

export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  users: User[];
  permissions: Permission[];
}
