import React from "react";
import { Document as ServerDocument, UpdateDocumentInput } from "demos-server";
import { DescriptionInput, TitleInput } from "./DocumentDialog";
import { BaseDialog } from "../BaseDialog";
import { UploadButton } from "./UploadButton";
import { useToast } from "components/toast";
import { useDialog } from "../DialogContext";

export type Document = Pick<ServerDocument, "id" | "name" | "description">;
const UPDATE_SUCCESS_MESSAGE = "Your document has been updated.";
const UPDATE_FAILURE_MESSAGE = "Your changes could not be saved because of an unknown problem.";

export const hasChanges = (initialDocument: Document, activeDocument: Document): boolean => {
  return (
    activeDocument.name !== initialDocument.name ||
    activeDocument.description !== initialDocument.description
  );
};

export const isValid = (document: Document): boolean => !!document.name.trim();

export const EditDocumentDialogView: React.FC<{
  document: Document;
  saving: boolean;
  onSubmit: (input: UpdateDocumentInput) => Promise<unknown>;
}> = ({ document, saving, onSubmit }) => {
  const { closeDialog } = useDialog();
  const [activeDocument, setActiveDocument] = React.useState<Document>(document);
  const { showSuccess, showError } = useToast();

  const handleUpdate = async () => {
    try {
      await onSubmit({
        name: activeDocument.name,
        description: activeDocument.description,
      });
      showSuccess(UPDATE_SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Error updating document:", error);
      showError(UPDATE_FAILURE_MESSAGE);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title={"Edit Document"}
      onClose={closeDialog}
      dialogHasChanges={hasChanges(document, activeDocument)}
      actionButton={
        <UploadButton
          onClick={handleUpdate}
          disabled={!isValid(activeDocument) || saving || !hasChanges(document, activeDocument)}
          isUploading={saving}
          label={"Save Changes"}
          loadingLabel={"Saving"}
        />
      }
      cancelButtonIsDisabled={saving}
    >
      <TitleInput
        value={activeDocument.name}
        onChange={(val) => {
          setActiveDocument((prev) => ({ ...prev, name: val }));
        }}
      />

      <DescriptionInput
        value={activeDocument.description ?? ""}
        onChange={(val) => setActiveDocument((prev) => ({ ...prev, description: val }))}
      />
    </BaseDialog>
  );
};
