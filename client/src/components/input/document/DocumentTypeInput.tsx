import React from "react";

import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";
import { DocumentType } from "demos-server";
import { DOCUMENT_TYPES } from "demos-server-constants";

export const DocumentTypeInput: React.FC<{
  value: string;
  onSelect: (value: string) => void;
  documentTypes?: DocumentType[];
  validationMessage?: string;
}> = ({ value, onSelect, documentTypes = DOCUMENT_TYPES, validationMessage }) => {
  const documentTypeOptions = documentTypes.map((type) => ({
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
      onSelect={onSelect}
      isDisabled={documentTypeOptions.length <= 1}
      validationMessage={validationMessage}
    />
  );
};
