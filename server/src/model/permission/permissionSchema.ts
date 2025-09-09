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
`;

export interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}
