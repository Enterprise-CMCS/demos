import React from "react";
import { TypeTagTable } from "components/table/tables/TypeTagTable";
import { TypeTagAssociatedRecords } from "./TypeTagAssociatedRecords";
import { useSelectedTypeTag } from "./useSelectedTypeTag";

export const TypeTagManagement: React.FC = () => {
  const { selectedTypeTag } = useSelectedTypeTag();

  return selectedTypeTag ? <TypeTagAssociatedRecords /> : <TypeTagTable />;
};
