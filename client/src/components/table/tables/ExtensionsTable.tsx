import * as React from "react";

import { ChevronRightIcon, SuccessIcon } from "components/icons";
import { ReviewIcon } from "components/icons/Action/ReviewIcon";
import {
  ColumnDef,
  ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Extension as ServerExtension, DemonstrationStatus } from "demos-server";
import { formatDate } from "util/formatDate";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

export const EXTENSIONS_TABLE_QUERY = gql`
  query ExtensionsTable($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      extensions {
        id
        name
        effectiveDate
        extensionStatus {
          name
        }
      }
    }
  }
`;

export type Extension = Pick<ServerExtension, "id" | "name" | "effectiveDate"> & {
  extensionStatus: Pick<DemonstrationStatus, "name">;
};

const ExtensionColumns: ColumnDef<Extension>[] = [
  {
    header: "Title",
    accessorKey: "name",
  },
  {
    header: "Status",
    accessorKey: "extensionStatus.name",
  },
  {
    header: "Effective Date",
    accessorKey: "effectiveDate",
  },
];

export function ExtensionsTable({ initiallyExpandedId }: { initiallyExpandedId?: string }) {
  const [expanded, setExpanded] = React.useState<ExpandedState>(() =>
    initiallyExpandedId ? { [initiallyExpandedId]: true } : {}
  );
  const { id } = useParams<{ id: string }>();
  const handleExpandedChange = React.useCallback(
    (updater: ExpandedState | ((prev: ExpandedState) => ExpandedState)) => {
      setExpanded((prev) => {
        return typeof updater === "function" ? updater(prev) : updater;
      });
    },
    []
  );
  const { data, loading, error } = useQuery<{ demonstration: { extensions: Extension[] } }>(
    EXTENSIONS_TABLE_QUERY,
    {
      variables: { demonstrationId: id },
    }
  );

  const amendments: Extension[] = data?.demonstration?.extensions || [];

  const table = useReactTable<Extension>({
    data: amendments,
    columns: ExtensionColumns,
    state: { expanded },
    onExpandedChange: handleExpandedChange,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.id,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {table.getRowModel().rows.map((row) => {
          const { name, effectiveDate, extensionStatus } = row.original;
          const isExpanded = row.getIsExpanded();

          return (
            <div key={row.id} className="border rounded px-4 py-2 bg-white">
              <div
                onClick={() => row.toggleExpanded()}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 cursor-pointer"
              >
                <div className="text-sm font-bold text-blue-900">{name}</div>

                <div className="h-1" />

                <div>{renderStatus(extensionStatus.name)}</div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-800">
                    {effectiveDate ? formatDate(effectiveDate) : "--/--/----"}
                  </span>
                  <ChevronRightIcon
                    className={`w-[1.25rem] h-[1.25rem] text-[var(--color-action)] transform transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                  />
                </div>
              </div>
              {isExpanded && (
                <div className="mt-2 px-2 py-2 bg-gray-100 text-sm italic text-gray-600 rounded-sm">
                  Expanded details coming soon.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const renderStatus = (status: string) => {
  const baseStyle = "flex items-center gap-1 text-sm";
  switch (status) {
    case "Under Review":
      return (
        <div className={`${baseStyle} text-left`}>
          <ReviewIcon className="w-[1.4rem] h-[1.4rem] text-yellow-500" />
          {status}
        </div>
      );
    case "Approved":
      return (
        <div className={`${baseStyle} text-left`}>
          <SuccessIcon className="w-[1.4rem] h-[1.4rem]" />
          {status}
        </div>
      );
    case "Draft":
      return (
        <div className={`${baseStyle} text-left`}>
          <SuccessIcon className="w-[1.4rem] h-[1.4rem]" />
          {status}
        </div>
      );
    default:
      return <span className="text-sm text-gray-700">{status}</span>;
  }
};
