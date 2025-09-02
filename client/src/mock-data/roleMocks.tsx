import { Role } from "demos-server";

export type MockRole = Pick<Role, "id" | "name" | "description">;
export const mockRoles = [
  {
    id: "CMS_USER",
    name: "CMS User",
    description: "CMS User Role",
  },
];
