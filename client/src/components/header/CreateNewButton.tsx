import React, { useEffect, useRef, useState } from "react";

import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { PersonType } from "demos-server";
import { getCurrentUser } from "components/user/UserContext";
import { useDialog } from "components/dialog/DialogContext";

const CREATE_PERSON_TYPES: ReadonlySet<PersonType> = new Set(["demos-admin", "demos-cms-user"]);

export const CreateNewButton: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser } = getCurrentUser();
  const { showCreateDemonstrationDialog, showCreateAmendmentDialog, showCreateExtensionDialog } =
    useDialog();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!CREATE_PERSON_TYPES.has(currentUser.person.personType)) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <IconButton
        icon={<AddNewIcon />}
        name="create-new"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        Create New
      </IconButton>

      {showDropdown && (
        <div className="absolute right-0 mt-1 w-[160px] bg-white text-black rounded-[6px] shadow-lg border z-20">
          <button
            data-testid="button-create-new-demonstration"
            onClick={() => {
              setShowDropdown(false);
              showCreateDemonstrationDialog();
            }}
            className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
          >
            Demonstration
          </button>
          <button
            data-testid="button-create-new-amendment"
            onClick={() => {
              setShowDropdown(false);
              showCreateAmendmentDialog();
            }}
            className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
          >
            Amendment
          </button>
          <button
            data-testid="button-create-new-extension"
            onClick={() => {
              setShowDropdown(false);
              showCreateExtensionDialog();
            }}
            className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
          >
            Extension
          </button>
        </div>
      )}
    </div>
  );
};
