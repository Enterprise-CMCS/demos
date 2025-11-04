import React, { useEffect, useRef, useState } from "react";

import { SecondaryButton } from "components/button/SecondaryButton";
import { AmendmentDialog } from "components/dialog/AmendmentDialog";
import { CreateDemonstrationDialog } from "components/dialog/";
import { ExtensionDialog } from "components/dialog/ExtensionDialog";
import { AddNewIcon } from "components/icons";
import { getCurrentUser } from "components/user/UserContext";
import { Loading } from "components/loading/Loading";

export const DefaultHeaderLower: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalType, setModalType] = useState<
    "demonstration" | "document" | "amendment" | "extension" | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { currentUser, loading, error } = getCurrentUser();

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error || !currentUser) {
    // render a minimal bar if unauthenticated or errored
    return <div>Error Getting Current User</div>;
  }

  const handleSelect = (item: string) => {
    setShowDropdown(false);
    if (item === "Demonstration") setModalType("demonstration");
    else if (item === "AddDocument") setModalType("document");
    else if (item === "Amendment") setModalType("amendment");
    else if (item === "Extension") setModalType("extension");
  };

  return (
    <>
      <div>
        <span className="font-bold block">Hello {currentUser.person.fullName}</span>
        <span className="block text-sm">Welcome to DEMOS!</span>
      </div>

      <div ref={dropdownRef}>
        <SecondaryButton
          name="create-new"
          data-testid="create-new"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          <span>Create New</span>
          <AddNewIcon />
        </SecondaryButton>

        {showDropdown && (
          <div className="absolute w-[160px] bg-white text-black rounded-[6px] shadow-lg border z-20">
            <button
              data-testid="button-create-new-demonstration"
              onClick={() => handleSelect("Demonstration")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Demonstration
            </button>
            <button
              data-testid="button-create-new-document"
              onClick={() => handleSelect("AddDocument")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Add New Document
            </button>
            <button
              data-testid="button-create-new-amendment"
              onClick={() => handleSelect("Amendment")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Amendment
            </button>
            <button
              data-testid="button-create-new-extension"
              onClick={() => handleSelect("Extension")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Extension
            </button>
          </div>
        )}
      </div>

      {modalType === "demonstration" && (
        <CreateDemonstrationDialog isOpen={true} onClose={() => setModalType(null)} />
      )}

      {modalType === "amendment" && (
        <AmendmentDialog mode="add" onClose={() => setModalType(null)} />
      )}
      {modalType === "extension" && (
        <ExtensionDialog mode="add" onClose={() => setModalType(null)} />
      )}
    </>
  );
};
