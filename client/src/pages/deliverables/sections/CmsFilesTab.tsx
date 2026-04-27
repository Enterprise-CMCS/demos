import React from "react";

import type { DeliverableFileRow } from "./DeliverableFileTypes";
import { DeliverableFileTable } from "./DeliverableFileTable";
import { makeCmsFileColumns } from "./fileColumns";

export const CMS_FILES_TAB_NAME = "cms-files-tab";
export const CMS_FILES_ADD_BUTTON_NAME = "button-add-cms-file";
export const CMS_FILES_EDIT_BUTTON_NAME = "button-edit-cms-file";
export const CMS_FILES_DELETE_BUTTON_NAME = "button-delete-cms-file";

const CMS_FILES_EMPTY_MESSAGE = "No files have been added yet.";

export type CmsFilesTabProps = {
  files: DeliverableFileRow[];
  onAdd?: () => void;
  onEdit?: (file: DeliverableFileRow) => void;
  onDelete?: (fileIds: string[]) => void;
};

export const CmsFilesTab: React.FC<CmsFilesTabProps> = ({ files, onAdd, onEdit, onDelete }) => {
  const columns = makeCmsFileColumns();

  return (
    <DeliverableFileTable
      testId={CMS_FILES_TAB_NAME}
      title="CMS Files"
      addButtonName={CMS_FILES_ADD_BUTTON_NAME}
      editButtonName={CMS_FILES_EDIT_BUTTON_NAME}
      deleteButtonName={CMS_FILES_DELETE_BUTTON_NAME}
      editAriaLabel="Edit CMS File"
      deleteAriaLabel="Delete CMS File"
      emptyMessage={CMS_FILES_EMPTY_MESSAGE}
      files={files}
      columns={columns}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};
