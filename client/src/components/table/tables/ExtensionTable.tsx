import * as React from "react";
import { ExpandableTable } from "components/table/ExpandableTable";
import {
  ExtensionColumns,
  RawExtension,
} from "../columns/ExtensionColumns";

interface ExtensionTableProps {
  data: RawExtension[];
  demonstrationId: string;
  initiallyExpandedId?: string;
}

export function ExtensionTable({ data, initiallyExpandedId }: ExtensionTableProps) {
  return (
    <ExpandableTable
      data={data}
      columns={ExtensionColumns}
      initiallyExpandedId={initiallyExpandedId}
    />
  );
}
