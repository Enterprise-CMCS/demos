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
};

export const mockContacts: MockContact[] = [
  {
    id: "1",
    fullName: "John Doe",
    email: "john@doe.com",
    contactType: "Primary Project Officer",
  },
  {
    id: "2",
    fullName: "Jane Smith",
    email: "jane@smith.com",
    contactType: "State Representative",
  },
  {
    id: "3",
    fullName: "Emily Johnson",
    email: null,
    contactType: "Subject Matter Expert",
  },
];
