import { createContext, useContext } from "react";
import { Person, User } from "demos-server";

export type CurrentUser = Pick<User, "id" | "username"> & {
  person: Pick<Person, "id" | "personType" | "fullName" | "firstName" | "lastName" | "email">;
};

interface UserContextValue {
  currentUser: CurrentUser;
}

export const Ctx = createContext<UserContextValue | undefined>(undefined);

export function getCurrentUser() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error("getCurrentUser must be used within <UserProvider>");
  }

  return ctx;
}
