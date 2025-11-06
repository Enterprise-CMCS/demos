import React, { useEffect, useMemo, useState } from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Option as SelectOption } from "components/input/select/Select";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["General File"];

const GET_APPLICATION_OPTIONS = gql`
  query GetApplicationOptions {
    demonstrations {
      id
      name
    }
    amendments {
      id
      name
    }
    extensions {
      id
      name
    }
  }
`;

type ApplicationOption = {
  value: string;
  label: string;
};

type ApplicationOptionsQueryResult = {
  demonstrations: { id: string; name: string }[];
  amendments: { id: string; name: string }[];
  extensions: { id: string; name: string }[];
};

type Props = {
  onClose: () => void;
  onDocumentUploadSucceeded?: () => void;
};

export const GeneralDocumentUploadDialog: React.FC<Props> = ({
  onClose,
  onDocumentUploadSucceeded,
}) => {
  const { data, loading, error } = useQuery<ApplicationOptionsQueryResult>(
    GET_APPLICATION_OPTIONS
  );
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");

  const options = useMemo(() => {
    if (!data) return [] as ApplicationOption[];

    const demonstrationOptions: ApplicationOption[] =
      data.demonstrations?.map((demo) => ({
        value: demo.id,
        label: `${demo.name} (Demonstration)`,
      })) ?? [];

    const amendmentOptions: ApplicationOption[] =
      data.amendments?.map((amendment) => ({
        value: amendment.id,
        label: `${amendment.name} (Amendment)`,
      })) ?? [];

    const extensionOptions: ApplicationOption[] =
      data.extensions?.map((extension) => ({
        value: extension.id,
        label: `${extension.name} (Extension)`,
      })) ?? [];

    return [...demonstrationOptions, ...amendmentOptions, ...extensionOptions];
  }, [data]);

  useEffect(() => {
    if (!selectedApplicationId && options.length > 0) {
      setSelectedApplicationId(options[0].value);
    }
  }, [selectedApplicationId, options]);

  useEffect(() => {
    if (!selectedApplicationId || options.length === 0) {
      return;
    }
    const exists = options.some((option) => option.value === selectedApplicationId);
    if (!exists) {
      setSelectedApplicationId(options[0].value);
    }
  }, [selectedApplicationId, options]);

  const isReady = !!selectedApplicationId;

  const selectOptions: SelectOption[] = options.map((option) => ({
    label: option.label,
    value: option.value,
  }));

  const validationMessage =
    !loading && selectedApplicationId === "" ? "Select an application." : "";
  const applicationSelectorProps = {
    label: "Application",
    options: selectOptions,
    value: selectedApplicationId,
    onSelect: setSelectedApplicationId,
    isDisabled: loading || selectOptions.length === 0,
    placeholder:
      loading
        ? "Loading applications..."
        : selectOptions.length === 0
          ? "No applications found"
          : "Select application",
    validationMessage: error ? "Failed to load applications." : validationMessage,
  };

  return (
    <>
      {isReady ? (
        <AddDocumentDialog
          key={selectedApplicationId}
          applicationId={selectedApplicationId}
          isOpen
          onClose={onClose}
          documentTypeSubset={DOCUMENT_TYPE_SUBSET}
          titleOverride="Add General Document"
          onDocumentUploadSucceeded={onDocumentUploadSucceeded}
          applicationSelectorProps={applicationSelectorProps}
        />
      ) : null}
    </>
  );
};

// 18007242440
