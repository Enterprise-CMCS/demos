import React from "react";

import { SecondaryButton } from "components/button";

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
  onAdd?: () => void;
  onEdit?: (file: DeliverableFileRow) => void;
  onDelete?: (fileIds: string[]) => void;
  onToggleCurrent?: (fileId: string, nextValue: boolean) => void;
  onSubmit?: () => void;
};

export const StateFilesTab: React.FC<StateFilesTabProps> = ({
  files,
  onAdd,
  onEdit,
  onDelete,
  onToggleCurrent,
  onSubmit,
}) => {
  const columns = makeStateFileColumns(onToggleCurrent);
  const hasFiles = files.length > 0;

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
      footer={
        hasFiles && (
          <div className="flex justify-end">
            <SecondaryButton name={STATE_FILES_SUBMIT_BUTTON_NAME} onClick={onSubmit}>
              Submit Deliverable
            </SecondaryButton>
          </div>
        )
      }
    />
  );
};
