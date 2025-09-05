import React from "react";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { DocumentType } from "demos-server";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";

export const DocumentTypeInput: React.FC<{
  value: string;
  onSelect: (value: string) => void;
  documentTypeSubset?: DocumentType[];
}> = ({ value, onSelect, documentTypeSubset }) => {
  const documentTypeOptions = (documentTypeSubset || DOCUMENT_TYPES).map((type) => ({
    label: type,
    value: type,
  })) as Option[];

  return (
    <AutoCompleteSelect
      id="document-type"
      label="Document Type"
      options={documentTypeOptions}
      value={value}
      onSelect={(selectedValue) => onSelect(selectedValue)}
    />
  );
};
