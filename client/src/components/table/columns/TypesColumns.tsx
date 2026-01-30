import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "../KeywordSearch";
import { formatDate } from "util/formatDate";
import { createSelectColumnDef } from "./selectColumn";
import { TypeTableRow } from "../tables/TypesTable";

export function TypesColumns() {
  const columnHelper = createColumnHelper<TypeTableRow>();

  return [
    createSelectColumnDef(columnHelper),
    columnHelper.accessor("demonstrationTypeName", {
      header: "Type",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: [
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ],
        },
      },
    }),
    columnHelper.accessor("effectiveDate", {
      header: "Effective Date",
      cell: ({ getValue }) => {
        const dateValue = getValue();
        return dateValue ? formatDate(dateValue) : "—";
      },
      meta: {
        filterConfig: {
          filterType: "date",
        },
      },
    }),
    columnHelper.accessor("expirationDate", {
      header: "Expiration Date",
      cell: ({ getValue }) => {
        const dateValue = getValue();
        return dateValue ? formatDate(dateValue) : "—";
      },
      meta: {
        filterConfig: {
          filterType: "date",
        },
      },
    }),
  ];
}
