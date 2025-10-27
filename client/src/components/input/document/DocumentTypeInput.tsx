import React from "react";

import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";
import { DocumentType } from "demos-server";
import { DOCUMENT_TYPES } from "demos-server-constants";

export const DocumentTypeInput: React.FC<{
  value: string | undefined;
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
      isRequired
      options={documentTypeOptions}
      value={value}
      onSelect={(selectedValue) => onSelect(selectedValue)}
    />
  );
};
