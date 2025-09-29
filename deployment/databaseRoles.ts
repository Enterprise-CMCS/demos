interface Role {
  name: string;
  memberships: string[];
  systemRole?: boolean;
}

export const dev: Role[] = [
  {
    name: "demos_server",
    memberships: ["demos_read", "demos_write", "demos_delete"],
    // `systemRole: true` means that the password will be managed by secrets manager
    systemRole: true,
  },
];

export const test: Role[] = [];

export const impl: Role[] = [];

export const prod: Role[] = [];
