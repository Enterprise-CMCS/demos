import React from "react";

import type { DeliverableFileRow } from "./DeliverableFileTypes";
import { DeliverableFileTable } from "./DeliverableFileTable";
import { makeStateFileColumns } from "./fileColumns";

export const STATE_FILES_TAB_NAME = "state-files-tab";
export const STATE_FILES_ADD_BUTTON_NAME = "button-add-state-files";
export const STATE_FILES_EDIT_BUTTON_NAME = "button-edit-state-files";
export const STATE_FILES_DELETE_BUTTON_NAME = "button-delete-state-files";
export const STATE_FILES_SUBMIT_BUTTON_NAME = "button-submit-deliverable";

const STATE_FILES_EMPTY_MESSAGE =
  "No files have been added yet. Appropriate files must be attached AND submitted before CMS can review.";

export type StateFilesTabProps = {
  files: DeliverableFileRow[];
  onAdd: () => void;
  onEdit: (file: DeliverableFileRow) => void;
  onDelete: (fileIds: string[]) => void;
  isFinalized: boolean;
};

export const StateFilesTab: React.FC<StateFilesTabProps> = ({
  files,
  onAdd,
  onEdit,
  onDelete,
  isFinalized,
}) => {
  const columns = makeStateFileColumns();

  return (
    <DeliverableFileTable
      testId={STATE_FILES_TAB_NAME}
      title="State Files"
      addButtonName={STATE_FILES_ADD_BUTTON_NAME}
      editButtonName={STATE_FILES_EDIT_BUTTON_NAME}
      deleteButtonName={STATE_FILES_DELETE_BUTTON_NAME}
      editAriaLabel="Edit File"
      deleteAriaLabel="Delete File"
      emptyMessage={STATE_FILES_EMPTY_MESSAGE}
      files={files}
      columns={columns}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      showActions={true}
      isFinalized={isFinalized}
    />
  );
};
