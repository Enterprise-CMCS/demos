import React from "react";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { Select, SelectProps } from "./Select";
import { DocumentType } from "demos-server";

export const SelectDocumentTypes = ({
  placeholder = "Select Document Type",
  id = "document-type-select",
  label = "Document Type",
  options = DOCUMENT_TYPES,
  ...rest
}: Omit<SelectProps<DocumentType>, "options"> & { options?: readonly DocumentType[] }) => {
  return (
    <Select<DocumentType>
      placeholder={placeholder}
      id={id}
      label={label}
      options={options.map((documentType) => ({
        value: documentType,
        label: documentType,
      }))}
      {...rest}
    />
  );
};
