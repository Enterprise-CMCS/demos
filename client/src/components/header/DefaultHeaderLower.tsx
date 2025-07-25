import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { SecondaryButton } from "components/button/SecondaryButton";
import { AddNewIcon } from "components/icons";
import { AddDocumentModal } from "components/modal/document/DocumentModal";
import { CreateNewModal } from "components/modal/CreateNewModal";
import { gql } from "graphql-tag";

import { useQuery } from "@apollo/client";

export const HEADER_LOWER_QUERY = gql`
  query HeaderLowerQuery($id: ID!) {
    user(id: $id) {
      fullName
    }
  }
`;

export const DefaultHeaderLower: React.FC<{ userId?: number }> = ({ userId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalType, setModalType] = useState<"create" | "document" | "amendment" | "extension" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
    variables: { id: userId },
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
          size="small"
          className="cursor-pointer flex items-center gap-1 px-1 py-1"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          <span>Create New</span>
          <AddNewIcon />
        </SecondaryButton>

        {showDropdown && (
          <div className="absolute w-[160px] bg-white text-black rounded-[6px] shadow-lg border z-20">
            <button
              onClick={() => handleSelect("Demonstration")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Demonstration
            </button>
            <button
              onClick={() => handleSelect("AddDocument")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Add New Document
            </button>
            <button
              onClick={() => handleSelect("Amendment")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Amendment
            </button>
            <button
              onClick={() => handleSelect("Extension")}
              className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
            >
              Extension
            </button>
          </div>
        )}
      </div>

      {modalType === "create" && (
        <CreateNewModal mode="demonstration" onClose={() => setModalType(null)} />
      )}
      {modalType === "document" && (
        <AddDocumentModal onClose={() => setModalType(null)} />
      )}
      {modalType === "amendment" && (
        <CreateNewModal mode="amendment" onClose={() => setModalType(null)} />
      )}
      {modalType === "extension" && (
        <CreateNewModal mode="extension" onClose={() => setModalType(null)} />
      )}

    </div>
  );
};
