interface Role {
  name: string;
  memberships: string[];
  // `systemRole: true` means that the password will be managed by secrets manager
  // `false` means that the password is for a developer and a password will be stored
  // in AWS Parameter store. This is meant to be a temporary password updated
  // and rotated by the developer
  systemRole?: boolean;
}

export const dev: Role[] = [
  {
    name: "demos_server",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_upload",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_delete_infected_file",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
];

export const test: Role[] = [
  {
    name: "demos_server",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_upload",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_delete_infected_file",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
];

export const impl: Role[] = [
  {
    name: "demos_server",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_upload",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_delete_infected_file",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
];

export const prod: Role[] = [
  {
    name: "demos_server",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_upload",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
  {
    name: "demos_delete_infected_file",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    systemRole: true,
  },
];
