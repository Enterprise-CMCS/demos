import * as React from "react";
import { ExpandableTable } from "components/table/ExpandableTable";
import {
  AmendmentColumns,
  RawAmendment,
} from "../columns/AmendmentColumns";

interface AmendmentTableProps {
  data: RawAmendment[];
  demonstrationId: string;
  initiallyExpandedId?: string;
}

export function AmendmentTable({ data, initiallyExpandedId }: AmendmentTableProps) {
  return (
    <ExpandableTable
      data={data}
      columns={AmendmentColumns}
      initiallyExpandedId={initiallyExpandedId}
    />
  );
}
