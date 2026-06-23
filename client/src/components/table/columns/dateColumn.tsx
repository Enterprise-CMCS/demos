import { CellContext, ColumnHelper, DeepKeys, DeepValue, Row } from "@tanstack/react-table";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { formatDateForDisplay } from "util/formatDate";

type DateFilterValue = {
  start?: Date;
  end?: Date;
};

type DateColumnMeta = {
  headerClassName?: string;
  headerContentClassName?: string;
  cellClassName?: string;
};

export function createDateColumnDef<RowData, FieldName extends DeepKeys<RowData>>(
  columnHelper: ColumnHelper<RowData>,
  fieldName: FieldName,
  header: string,
  defaultValue: string = "",
  meta?: DateColumnMeta
) {
  return columnHelper.accessor(fieldName, {
    id: String(fieldName),
    header,
    cell: ({ getValue }: CellContext<RowData, DeepValue<RowData, FieldName>>) => {
      const value = getValue() as string | undefined;
      return value ? formatDateForDisplay(value) : defaultValue;
    },
    filterFn: (row: Row<RowData>, columnId: string, filterValue: DateFilterValue) => {
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
      ...meta,
      filterConfig: {
        filterType: "date",
      },
    },
  });
}
