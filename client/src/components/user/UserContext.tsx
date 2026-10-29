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
export type DemosApplicationSection =
  "ApplicationWorkflow" | "DemonstrationDetail" | "Homepage" | "DeliverableManagement";

/**
 * Determines if a section of the application should be readonly for the current user.
 */
export function isReadonly(
  currentUser: CurrentUser,
  applicationSection?: DemosApplicationSection
): boolean {
  // demos-restricted-cms-user is readonly across the entire application
  if (currentUser.person.personType === "demos-restricted-cms-user") {
    return true;
  }

  // demos-cms-reviewer-user is readonly in workflow and demonstration detail sections
  if (
    currentUser.person.personType === "demos-cms-reviewer-user" &&
    (applicationSection === "ApplicationWorkflow" || applicationSection === "DemonstrationDetail")
  ) {
    return true;
  }

  // demos-oact-user is readonly in the homepage & demonstration detail sections
  if (
    currentUser.person.personType === "demos-oact-user" &&
    (applicationSection === "Homepage" || applicationSection === "DemonstrationDetail")
  ) {
    return true;
  }

  return false;
}

/**
 * Determines if a section of the application should be hidden for the current user.
 */
export function isHidden(
  currentUser: CurrentUser,
  applicationSection: DemosApplicationSection
): boolean {
  // demos-oact-user cannot access deliverables
  if (
    currentUser.person.personType === "demos-oact-user" &&
    applicationSection === "DeliverableManagement"
  ) {
    return true;
  }

  return false;
}
