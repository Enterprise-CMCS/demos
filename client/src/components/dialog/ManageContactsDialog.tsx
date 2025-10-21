import React from "react";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ManageContactsTable } from "components/table/tables/ManageContactsTable";

export type ManageContactsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ManageContactsDialog: React.FC<ManageContactsDialogProps> = ({ isOpen, onClose }) => (
  <BaseDialog title="Manage Contacts" isOpen={isOpen} onClose={onClose}>
    <ManageContactsTable />
  </BaseDialog>
);
