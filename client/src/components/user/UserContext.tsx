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

// Sections of the app will calculate `isReadonly` different for specific user types.
type DemosApplicationSection = "ApplicationWorkflow" | "Homepage";
export function isReadonly(
  currentUser: CurrentUser,
  applicationSection: DemosApplicationSection
): boolean {
  // demos-restricted-cms-user is always readonly
  if (currentUser.person.personType === "demos-restricted-cms-user") {
    return true;
  }

  // demos-cms-reviewer-user is readonly in ApplicationWorkflow, editable elsewhere
  if (
    currentUser.person.personType === "demos-cms-reviewer-user" &&
    applicationSection === "ApplicationWorkflow"
  ) {
    return true;
  }

  return false;
}
