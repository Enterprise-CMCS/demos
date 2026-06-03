import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "components/icons";
import { Avatar } from "./Avatar";
import { getCurrentUser } from "components/user/UserContext";
import { useAuthActions } from "components/auth/AuthActions";

export const PROFILE_BLOCK_TEST_ID = "profile-block";

export function SignoutLink() {
  const { signOut } = useAuthActions();
  return (
    <button
      type="button"
      role="menuitem"
      className="w-full text-left cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        signOut();
      }}
    >
      Sign Out
    </button>
  );
}

export const ProfileBlock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const resolvedName = currentUser
    ? currentUser.person.fullName || currentUser.username?.trim()
    : "";
  const avaChar = (resolvedName.trim()[0] ?? "?").toUpperCase();

  return (
    <div
      id="profile-container"
      ref={containerRef}
      className="relative flex items-center gap-x-1 mr-2 select-none"
      onKeyDown={handleKeyDown}
      data-testid={PROFILE_BLOCK_TEST_ID}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`User profile menu for ${resolvedName}`}
        className="flex items-center gap-x-1 cursor-pointer"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar character={avaChar} />
        <span id="profile-name" className="text-lg font-semibold">
          {resolvedName}
        </span>
        <span aria-hidden="true">
          <ChevronDownIcon className={open ? "rotate-180" : ""} />
        </span>
      </button>

      {open && (
        <ul
          role="menu"
          aria-label="User profile options"
          className="absolute top-12 right-0 min-w-full bg-white border border-gray-300 rounded shadow-lg z-50"
        >
          <li role="none" className="hover:bg-gray-100 cursor-pointer p-1">
            <SignoutLink />
          </li>
        </ul>
      )}
    </div>
  );
};
