import { Contact } from "demos-server";
import { MockUser, mockUsers } from "./userMocks";

export type MockContact = Pick<Contact, "contactType"> & {
  user: MockUser;
};

export const mockContacts: MockContact[] = [
  {
    user: mockUsers[0],
    contactType: "Project Officer",
  },
  {
    user: mockUsers[1],
    contactType: "State Point of Contact",
  },
  {
    user: mockUsers[2],
    contactType: "Policy Technical Director",
  },
];
