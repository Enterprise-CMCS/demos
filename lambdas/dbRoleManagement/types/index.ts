export interface Role {
  name: string;
  memberships: string[];
  systemRole?: boolean;
}

export interface CDKRole {
  name: string;
  memberships: string[];
  systemRole?: string;
}
