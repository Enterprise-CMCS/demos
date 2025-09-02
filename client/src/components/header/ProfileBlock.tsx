import React, { useState } from "react";
import { ChevronDownIcon } from "components/icons";
import { Avatar } from "./Avatar";
import { getCurrentUser } from "components/user/UserContext";
import { SignoutLink, SigninLink } from "../auth/AuthLinks";

export const ProfileBlock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { currentUser, loading, error } = getCurrentUser();

  if (loading) return <div className="animate-pulse h-6 w-28 bg-white/20 rounded" />;
  if (error) { console.error("[ProfileBlock] currentUser error:", error); return null; }

  if (!currentUser) {
    return (
      // this really should not be seen, user would be behind login wall.
      <SigninLink />
    );
  }
  // TODO: Add ability to set username, fullname, and displayName (if we keep all 3)
  const name = currentUser.fullName || currentUser.displayName || currentUser.email;
  const firstCharacter = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div
      id="profile-container"
      className="relative flex items-center gap-x-1 mr-2 cursor-pointer select-none"
      onClick={() => setOpen(value => !value)}
    >
      <Avatar character={firstCharacter} />
      <span id="profile-name" className="text-lg font-semibold">{name}</span>
      <span><ChevronDownIcon className={open ? "rotate-180" : ""} /></span>

      {open && (
        <ul className="absolute top-12 right-0 min-w-full bg-white border border-gray-300 rounded shadow-lg z-50">
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <SignoutLink />
          </li>
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <button onClick={(e) => e.stopPropagation()}>View Roles</button>
          </li>
        </ul>
      )}
    </div>
  );
};
