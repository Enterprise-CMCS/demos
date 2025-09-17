type MockContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

export type MockContact = {
  id: string;
  fullName: string | null;
  email: string | null;
  contactType: MockContactType | null;
  __typename: "Contact";
};

export const mockContacts = [
  {
    __typename: "Contact",
    id: "1",
    fullName: "John Doe",
    email: "john@doe.com",
    contactType: "Primary Project Officer",
  },
  {
    __typename: "Contact",
    id: "2",
    fullName: "Jane Smith",
    email: "jane@smith.com",
    contactType: "State Representative",
  },
  {
    __typename: "Contact",
    id: "3",
    fullName: "Emily Johnson",
    email: null,
    contactType: "Subject Matter Expert",
  },
] as const satisfies MockContact[];
