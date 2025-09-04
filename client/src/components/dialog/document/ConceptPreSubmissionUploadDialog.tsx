import React from "react";

import { AddDocumentDialog, DocumentDialogFields } from "components/dialog/document/DocumentDialog";
import { Option } from "components/input/select/Select";

const OPTIONS: Option[] = [
  { label: "Pre-Submission", value: "Pre-Submission" },
  { label: "General File", value: "General File" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bundleId: string;
  refetchQueries?: string[];
};

export const ConceptPreSubmissionUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  bundleId,
}) => {
  const initial: DocumentDialogFields = {
    id: bundleId,
    title: "",
    description: "",
    documentType: "Pre-Submission",
  };

  return (
    <AddDocumentDialog
      isOpen={isOpen}
      onClose={onClose}
      documentTypeOptions={OPTIONS}
      initialDocument={initial}
      titleOverride="Pre-Submission Document"
    />
  );
};
