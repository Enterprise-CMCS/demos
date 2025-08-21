import React, { useEffect, useRef, useState } from "react";
import { SecondaryButton } from "components/button/SecondaryButton";
import { AddNewIcon } from "components/icons";
import { DemonstrationModal } from "components/modal/DemonstrationModal";
import { CreateNewModal } from "components/modal/CreateNewModal";
import { AddDocumentModal } from "components/modal/document/DocumentModal";
import { getCurrentUser } from "components/user/UserContext";

export const DefaultHeaderLower: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalType, setModalType] = useState<"create" | "document" | "amendment" | "extension" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { currentUser, loading, error } = getCurrentUser();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">Loading…</div>;
  }

  if (error || !currentUser) {
    // render a minimal bar if unauthenticated or errored
    return <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between" />;
  }

  const name = currentUser.displayName || currentUser.email;

  const handleSelect = (item: string) => {
    setShowDropdown(false);
    if (item === "Demonstration") setModalType("create");
    else if (item === "AddDocument") setModalType("document");
    else if (item === "Amendment") setModalType("amendment");
    else if (item === "Extension") setModalType("extension");
  };

  return (
    <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
      <div>
        <span className="font-bold block">Hello {name}</span>
        <span className="block text-sm">Welcome to DEMOS!</span>
      </div>

      <div className="relative" ref={dropdownRef}>
        <SecondaryButton size="small" onClick={() => setShowDropdown((prev) => !prev)}>
          <div className="flex items-center gap-1">
            <span>Create New</span>
            <AddNewIcon />
          </div>
        </SecondaryButton>

        {showDropdown && (
          <div className="absolute w-[160px] bg-white text-black rounded-[6px] shadow-lg border z-20">
            <button onClick={() => handleSelect("Demonstration")} className="w-full text-left px-1 py-[10px] hover:bg-gray-100">
              Demonstration
            </button>
            <button onClick={() => handleSelect("AddDocument")} className="w-full text-left px-1 py-[10px] hover:bg-gray-100">
              Add New Document
            </button>
            <button onClick={() => handleSelect("Amendment")} className="w-full text-left px-1 py-[10px] hover:bg-gray-100">
              Amendment
            </button>
            <button onClick={() => handleSelect("Extension")} className="w-full text-left px-1 py-[10px] hover:bg-gray-100">
              Extension
            </button>
          </div>
        )}
      </div>

      {modalType === "create" && <DemonstrationModal mode="add" onClose={() => setModalType(null)} />}
      {modalType === "document" && <AddDocumentModal onClose={() => setModalType(null)} />}
      {modalType === "amendment" && <CreateNewModal mode="amendment" onClose={() => setModalType(null)} />}
      {modalType === "extension" && <CreateNewModal mode="extension" onClose={() => setModalType(null)} />}
    </div>
  );
};
