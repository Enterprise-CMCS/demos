import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { SecondaryButton } from "components/button/SecondaryButton";
import { AmendmentDialog } from "components/dialog/AmendmentDialog";
import { DemonstrationDialog } from "components/dialog/DemonstrationDialog";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { ExtensionDialog } from "components/dialog/ExtensionDialog";
import { AddNewIcon } from "components/icons";
import { gql } from "graphql-tag";
import { normalizeUserId } from "hooks/user/uuidHelpers";

import { useQuery } from "@apollo/client";

export const HEADER_LOWER_QUERY = gql`
  query HeaderLowerQuery($id: ID!) {
    user(id: $id) {
      fullName
    }
  }
`;

export const DefaultHeaderLower: React.FC<{ userId?: string }> = ({ userId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalType, setModalType] = useState<
    "create" | "document" | "amendment" | "extension" | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!userId) {
    return (
      <div className="w-full bg-blue-900 text-white px-4 py-1 flex items-center justify-between" />
    );
  }

  const { data, error, loading } = useQuery(HEADER_LOWER_QUERY, {
    variables: { id: normalizeUserId(userId) },
  });

  if (error) return <div>Error: {error.message}</div>;
  if (loading) return <div>Loading...</div>;
  if (!data?.user) return null;

  const user = data.user;

  const handleSelect = (item: string) => {
    setShowDropdown(false);
    if (item === "Demonstration") setModalType("create");
    else if (item === "AddDocument") setModalType("document");
    else if (item === "Amendment") setModalType("amendment");
    else if (item === "Extension") setModalType("extension");
    // TODO: handle "Extension" later
  };

  return (
    <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
      <div>
        <span className="font-bold block">Hello {user.fullName}</span>
        <span className="block text-sm">Welcome to DEMOS!</span>
      </div>
      <div className="relative" ref={dropdownRef}>
        <SecondaryButton
          name="create-new"
          size="small"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          <div className="flex items-center gap-1">
            <span>Create New</span>
            <AddNewIcon />
          </div>
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

      {modalType === "create" && (
        <DemonstrationDialog mode="add" onClose={() => setModalType(null)} />
      )}
      {modalType === "document" && <AddDocumentDialog onClose={() => setModalType(null)} />}
      {modalType === "amendment" && (
        <AmendmentDialog mode="add" onClose={() => setModalType(null)} />
      )}
      {modalType === "extension" && (
        <ExtensionDialog mode="add" onClose={() => setModalType(null)} />
      )}
    </div>
  );
};
