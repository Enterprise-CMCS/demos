import { Person } from "demos-server";

export type MockPerson = Pick<Person, "id" | "fullName" | "personType" | "displayName" | "email">;

export const mockPeople: MockPerson[] = [
  {
    id: "1",
    fullName: "John Doe",
    personType: "demos-cms-user",
    displayName: "john.doe",
    email: "john.doe@email.com",
  },
  {
    id: "2",
    fullName: "Jane Smith",
    personType: "demos-cms-user",
    displayName: "jane.smith",
    email: "jane.smith@email.com",
  },
  {
    id: "3",
    fullName: "Jim Smith",
    personType: "demos-cms-user",
    displayName: "jane.smith",
    email: "jane.smith@email.com",
  },
  {
    id: "4",
    fullName: "Darth Smith",
    personType: "demos-cms-user",
    displayName: "darth.smith",
    email: "darth.smith@email.com",
  },
  {
    id: "5",
    fullName: "Bob Johnson",
    personType: "demos-cms-user",
    displayName: "bob.johnson",
    email: "bob.johnson@email.com",
  },
  {
    id: "6",
    fullName: "Alice Brown",
    personType: "demos-cms-user",
    displayName: "alice.brown",
    email: "alice.brown@email.com",
  },
  {
    id: "7",
    fullName: "Carlos Rivera",
    personType: "demos-cms-user",
    displayName: "carlos.rivera",
    email: "carlos.rivera@email.com",
  },
  {
    id: "8",
    fullName: "Emily Clark",
    personType: "demos-cms-user",
    displayName: "emily.clark",
    email: "emily.clark@email.com",
  },
  {
    id: "9",
    fullName: "Cara Lee",
    personType: "demos-cms-user",
    displayName: "cara.lee",
    email: "cara.lee@email.com",
  },
  {
    id: "10",
    fullName: "David Chen",
    personType: "demos-cms-user",
    displayName: "david.chen",
    email: "david.chen@email.com",
  },
];
