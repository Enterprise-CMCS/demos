import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { SecondaryButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { Reference, ReferenceAgreement, Tag } from "demos-server";
import { formatDateForDisplay } from "util/formatDate";
import { Spinner } from "components/loading/Spinner";
import { useDownloadReference } from "hooks/useDownloadReference";

const ReferenceDownloadButton = ({
  referenceId,
  onDownload,
}: {
  referenceId: string;
  onDownload: (referenceId: string) => Promise<string>;
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(referenceId);
    } catch {
      // useDownloadReference reports download errors to the user.
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SecondaryButton
      name={`download-${referenceId}`}
      aria-label={`Download ${referenceId}`}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      <span className="relative inline-flex items-center justify-center">
        <span className={isDownloading ? "invisible" : ""}>Download</span>
        {isDownloading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        )}
      </span>
    </SecondaryButton>
  );
};

export function ReferencesColumns() {
  const { showReferenceAgreementDialog } = useDialog();
  const { downloadReference } = useDownloadReference();
  const columnHelper = createColumnHelper<
    Pick<Reference, "id" | "name" | "description" | "updatedAt"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt"> | null;
      demonstrationTypes: Pick<Tag, "tagName">[];
    }
  >();

  return [
    columnHelper.accessor("name", {
      header: "File Name",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor(
      (reference) => reference.demonstrationTypes.map((tag) => tag.tagName).join(", "),
      {
        id: "demonstrationTypes",
        header: "Demo Type",
        cell: (cell) => {
          const value = cell.getValue();
          return value ? highlightCell(cell) : "-";
        },
        enableColumnFilter: false,
      }
    ),
    columnHelper.accessor("description", {
      header: "Description",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("updatedAt", {
      header: "Last Updated",
      cell: (cell) => formatDateForDisplay(cell.getValue()),
      enableColumnFilter: false,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const reference = row.original;
        const agreement = reference.agreement;

        return (
          <div className="flex gap-2 justify-center">
            {agreement ? (
              <SecondaryButton
                name={`download-${reference.id}`}
                aria-label={`Open ${reference.id} agreement`}
                onClick={() => {
                  showReferenceAgreementDialog({
                    ...reference,
                    agreement,
                  });
                }}
              >
                Download
              </SecondaryButton>
            ) : (
              <ReferenceDownloadButton
                referenceId={reference.id}
                onDownload={(referenceId) =>
                  downloadReference({ id: referenceId, acceptedAgreementId: null })
                }
              />
            )}
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }),
  ];
}
