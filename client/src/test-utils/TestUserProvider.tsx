import React from "react";
import { Ctx, CurrentUser } from "components/user/UserContext";

export function TestUserProvider({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: CurrentUser;
}) {
  return <Ctx.Provider value={{ currentUser }}>{children}</Ctx.Provider>;
}
