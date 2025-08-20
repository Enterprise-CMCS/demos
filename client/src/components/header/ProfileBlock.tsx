// src/components/header/ProfileBlock.tsx
import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import { ChevronDownIcon } from "components/icons";
import { Avatar } from "./Avatar";
import { useCurrentUser } from "components/user/UserContext";

export const ProfileBlock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { currentUser, loading, error } = useCurrentUser();
  const auth = useAuth();

  // Minimal, unobtrusive states for header area
  if (loading) {
    return <div className="animate-pulse h-6 w-28 bg-white/20 rounded" />;
  }
  if (error) {
    console.error("[ProfileBlock] currentUser error:", error);
    return null;
  }

  // Not authenticated -> show Login
  if (!currentUser) {
    return (
      <button
        onClick={() => auth.signinRedirect?.()}
        className="text-white bg-black/20 hover:bg-black/30 rounded px-2 py-1"
      >
        Log In
      </button>
    );
  }

  const name = currentUser.displayName || currentUser.email;
  const firstCharacter = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div
      id="profile-container"
      className="relative flex items-center gap-x-1 mr-2 cursor-pointer select-none"
      onClick={() => setOpen((v) => !v)}
    >
      <Avatar character={firstCharacter} />
      <span id="profile-name" className="text-lg font-semibold">
        {name}
      </span>
      <span>
        <ChevronDownIcon className={open ? "rotate-180" : ""} />
      </span>

      {open && (
        <ul
          id="user-actions"
          className="absolute top-12 right-0 min-w-full bg-white border border-gray-300 rounded shadow-lg z-50"
        >
          <li
            className="hover:bg-gray-100 cursor-pointer p-1"
            onClick={(e) => {
              e.stopPropagation();
              auth.signoutRedirect?.();
            }}
          >
            <a>Logout</a>
          </li>
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <a>View Roles</a>
          </li>
        </ul>
      )}
    </div>
  );
};
