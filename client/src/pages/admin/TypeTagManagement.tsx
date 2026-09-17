import React from "react";
import { useSearchParams } from "react-router-dom";
import { TypeTagTable } from "components/table/tables/TypeTagTable";
import { TypeTagAssociatedRecords } from "./TypeTagAssociatedRecords";
import { isTypeTagSelected } from "./useTypeTagSelection";

export const TypeTagManagement: React.FC = () => {
  const [searchParams] = useSearchParams();

  return isTypeTagSelected(searchParams) ? <TypeTagAssociatedRecords /> : <TypeTagTable />;
};
