import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "components/icons";
import { Avatar } from "./Avatar";
import { getCurrentUser } from "components/user/UserContext";
import { SignoutLink } from "../auth/AuthLinks";

export const ProfileBlock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = getCurrentUser();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup on unmount or toggle
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const resolvedName = currentUser
    ? currentUser.person.fullName || currentUser.username?.trim()
    : "";
  const avaChar = (resolvedName.trim()[0] ?? "?").toUpperCase();

  return (
    <div
      id="profile-container"
      ref={containerRef}
      className="relative flex items-center gap-x-1 mr-2 cursor-pointer select-none"
      onClick={() => setOpen((value) => !value)}
    >
      <Avatar character={avaChar} />
      <span id="profile-name" className="text-lg font-semibold">
        {resolvedName}
      </span>
      <span>
        <ChevronDownIcon className={open ? "rotate-180" : ""} />
      </span>

      {open && (
        <ul className="absolute top-12 right-0 min-w-full bg-white border border-gray-300 rounded shadow-lg z-50">
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <SignoutLink />
          </li>
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Optionally close menu when clicking inside:
                setOpen(false);
              }}
            >
              View Roles
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};
