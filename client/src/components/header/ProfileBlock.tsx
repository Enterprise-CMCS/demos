import React, { useState } from "react";
import { ChevronDownIcon } from "components/icons";
import { Avatar } from "./Avatar";
import { getCurrentUser } from "components/user/UserContext";
import { useAuthActions } from "components/auth/AuthActions";

export const ProfileBlock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { currentUser, loading, error } = getCurrentUser();
  const { signIn, signOut } = useAuthActions();

  if (loading) return <div className="animate-pulse h-6 w-28 bg-white/20 rounded" />;
  if (error) { console.error("[ProfileBlock] currentUser error:", error); return null; }

  if (!currentUser) {
    return (
      <button
        onClick={signIn}
        className="text-white bg-black/20 hover:bg-black/30 rounded px-2 py-1"
      >
        Log In
      </button>
    );
  }
  // Right now, after user creation. We have no good way of setting displayName or fullName
  const name = currentUser.fullName || currentUser.displayName || currentUser.email;
  const firstCharacter = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div
      id="profile-container"
      className="relative flex items-center gap-x-1 mr-2 cursor-pointer select-none"
      onClick={() => setOpen(v => !v)}
    >
      <Avatar character={firstCharacter} />
      <span id="profile-name" className="text-lg font-semibold">{name}</span>
      <span><ChevronDownIcon className={open ? "rotate-180" : ""} /></span>

      {open && (
        <ul className="absolute top-12 right-0 min-w-full bg-white border border-gray-300 rounded shadow-lg z-50">
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); signOut(); }}
            >
              Logout
            </button>
          </li>
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <button onClick={(e) => e.stopPropagation()}>View Roles</button>
          </li>
        </ul>
      )}
    </div>
  );
};
