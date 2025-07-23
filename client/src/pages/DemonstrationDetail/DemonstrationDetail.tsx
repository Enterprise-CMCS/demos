import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CircleButton } from "components/button/CircleButton";
import {
  DeleteIcon,
  EditIcon,
  EllipsisIcon,
} from "components/icons";
import { CreateNewModal } from "components/modal/CreateNewModal";
import { DocumentsTable } from "components/table/tables/DocumentsTable";

export type Document = {
  id: number;
  title: string;
  description: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
};import { useDemonstration } from "hooks/useDemonstration";
import { usePageHeader } from "hooks/usePageHeader";
import { useParams } from "react-router-dom";

export const DemonstrationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [showButtons, setShowButtons] = useState(false);
  const [modalType, setModalType] = useState<"edit" | "delete" | null>(null);
  const { getDemonstrationById } = useDemonstration();
  const { trigger, data, loading, error } = getDemonstrationById;

  useEffect(() => {
    if (id) trigger(id);
  }, [id]);

  const headerContent = useMemo(() => {
    if (loading) {
      return (
        <div className="w-full bg-[var(--color-brand)] text-white px-4 py-1 flex items-center justify-between">
          Loading demonstration...
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="w-full bg-[var(--color-brand)] text-white px-4 py-1 flex items-center justify-between">
          Failed to load demonstration
        </div>
      );
    }

    return (
      <div className="w-full bg-[var(--color-brand)] text-white px-4 py-1 flex items-center justify-between">
        <div>
          {/* TODO: Replace with breadcrumb */}
          <span className="-ml-2 block text-sm">
            <a
              className="underline underline-offset-2 decoration-gray-400 decoration-1 decoration-opacity-40"
              href="/demonstrations"
            >
              Demonstration List
            </a>{" "}
            {">"} {data.id}
          </span>
          <span className="font-bold block">{data.name}</span>
          {/* TODO: Replace Project Officer with correct value */}
          <span className="block text-sm">
            State/Territory: {data.state.stateCode}
            <span className="mx-1">|</span>
            Project Officer: {data.description}
          </span>
        </div>
        <div className="relative">
          {showButtons && (
            <span className="mr-0.75">
              <CircleButton
                aria-label="Delete demonstration"
                className="cursor-pointer flex items-center gap-1 px-1 py-1 mr-0.75"
                data-testid="delete-button"
                onClick={() => setModalType("delete")}
              >
                <DeleteIcon width="24" height="24" />
              </CircleButton>
              <CircleButton
                aria-label="Edit demonstration"
                className="cursor-pointer flex items-center gap-1 px-1 py-1"
                data-testid="edit-button"
                onClick={() => setModalType("edit")}
              >
                <EditIcon width="24" height="24" />
              </CircleButton>
            </span>
          )}
          <CircleButton
            className="cursor-pointer flex items-center gap-1 px-1 py-1"
            aria-label="Toggle more options"
            data-testid="toggle-ellipsis-button"
            onClick={() => setShowButtons((prev) => !prev)}
          >
            <span
              className={`transform transition-transform duration-200 ease-in-out ${showButtons ? "rotate-90" : "rotate-0"
                // eslint-disable-next-line indent
                }`}
            >
              <EllipsisIcon width="24" height="24" />
            </span>
          </CircleButton>
        </div>
      </div>
    );
  }, [data, loading, error, showButtons]);

  usePageHeader(headerContent);

  // Handle errors
  if (error) {
    return (
      <div className="p-4">Error loading demonstration: {error.message}</div>
    );
  }

  return (
    <div className="pb-4">
      <div>
        <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">
          Documents
        </h1>
        <DocumentsTable />
      </div>

      {modalType === "edit" && data && (
        <CreateNewModal
          mode="demonstration"
          data={{
            title: data.name,
            state: data.state?.stateCode,
            projectOfficer: data.description,
            description: data.description,
          }}
          onClose={() => setModalType(null)}
        />
      )}

    </div>
  );
};
