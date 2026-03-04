import { ColumnHelper } from "@tanstack/react-table";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { formatDate } from "util/formatDate";

type DateFilterValue = {
  start?: Date;
  end?: Date;
};

export function createDateColumnDef<
  T,
  K extends keyof T & string
>(
  columnHelper: ColumnHelper<T>,
  fieldName: K,
  header: string
) {
  return columnHelper.accessor(
    (row: T) => row[fieldName],
    {
      id: fieldName,
      header,
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined;
        return value ? formatDate(value) : "";
      },
      filterFn: (row, columnId, filterValue: DateFilterValue) => {
        const value = row.getValue(columnId) as string | undefined;
        if (!value) return false;

        const date = new Date(value);
        const { start, end } = filterValue || {};

        if (start && end) {
          return (
            isSameDay(date, start) ||
            isSameDay(date, end) ||
            (isAfter(date, start) && isBefore(date, end))
          );
        }

        if (start) {
          return isSameDay(date, start) || isAfter(date, start);
        }

        if (end) {
          return isSameDay(date, end) || isBefore(date, end);
        }

        return true;
      },
      meta: {
        filterConfig: {
          filterType: "date",
        },
      },
    }
  );
}
