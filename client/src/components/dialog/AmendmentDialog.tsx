import React from "react";

import { CreateAmendmentInput, UpdateAmendmentInput } from "demos-server";
import { createFormDataWithDates } from "hooks/useDialogForm";
import { useAmendment } from "hooks/useAmendment";

import {
  BaseModificationDialog,
  BaseModificationDialogProps,
} from "./BaseModificationDialog";

// Pick the props we need from BaseModificationDialogProps and rename entityId to amendmentId for clarity
type Props = Pick<BaseModificationDialogProps, "isOpen" | "onClose" | "mode" | "demonstrationId" | "data"> & {
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
  const { createAmendment, updateAmendment } = useAmendment();

  const handleAmendmentSubmit = async (amendmentData: Record<string, unknown>) => {
    if (mode === "add") {
      await createAmendment.trigger(amendmentData as unknown as CreateAmendmentInput);
      return;
    }

    if (!amendmentId) {
      throw new Error("Amendment ID is required to update an amendment.");
    }

    await updateAmendment.trigger(
      amendmentId,
      amendmentData as unknown as UpdateAmendmentInput
    );
  };

  const getAmendmentFormData = (
    baseData: Record<string, unknown>,
    effectiveDate?: string,
    expirationDate?: string
  ) => {
    const { projectOfficerUserId: _omitProjectOfficer, ...amendmentData } =
      baseData as Record<string, unknown> & { projectOfficerUserId?: unknown };

    return createFormDataWithDates(
      {
        ...amendmentData,
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
