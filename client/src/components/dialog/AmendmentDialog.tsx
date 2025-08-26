import React from "react";

import { createFormDataWithDates } from "hooks/useDialogForm";

import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";

// Pick the props we need from BaseModificationDialogProps and rename entityId to amendmentId for clarity
type Props = Pick<
  BaseModificationDialogProps,
  "isOpen" | "onClose" | "mode" | "demonstrationId" | "data"
> & {
  amendmentId?: string;
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
