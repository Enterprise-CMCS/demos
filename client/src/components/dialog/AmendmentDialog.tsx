import React from "react";

import { createFormDataWithDates } from "hooks/useDialogForm";

import {
  BaseModificationDialog,
  ModificationDialogData,
  ModificationDialogMode,
} from "./BaseModificationDialog";

type AmendmentDialogMode = ModificationDialogMode;

type Props = {
  isOpen?: boolean;
  onClose: () => void;
  mode: AmendmentDialogMode;
  amendmentId?: string;
  demonstrationId?: string;
  data?: ModificationDialogData;
};

export const AmendmentDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  mode,
  amendmentId,
  demonstrationId,
  data,
}) => {
  const handleAmendmentSubmit = async (amendmentData: Record<string, unknown>) => {
    // TODO: Implement amendment creation/update logic when amendment hooks are available
    console.log("Amendment data to be created:", amendmentData);
  };

  const getAmendmentFormData = (
    baseData: Record<string, unknown>,
    effectiveDate?: string,
    expirationDate?: string
  ) => {
    return createFormDataWithDates(
      {
        ...baseData,
        // Amendment-specific data can be added here
      },
      effectiveDate,
      expirationDate
    );
  };

  return (
    <BaseModificationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      entityId={amendmentId}
      demonstrationId={demonstrationId}
      data={data}
      entityType="amendment"
      onSubmit={handleAmendmentSubmit}
      getFormData={getAmendmentFormData}
    />
  );
};
