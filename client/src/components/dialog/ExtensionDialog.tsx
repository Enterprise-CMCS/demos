import React from "react";

import { AddExtensionInput } from "demos-server";
import { createFormDataWithDates } from "hooks/useDialogForm";
import { useExtension } from "hooks/useExtension";

import {
  BaseModificationDialog,
  BaseModificationDialogProps,
} from "./BaseModificationDialog";

// Pick the props we need from BaseModificationDialogProps and rename entityId to extensionId for clarity
type Props = Pick<BaseModificationDialogProps, "isOpen" | "onClose" | "mode" | "demonstrationId" | "data"> & {
  extensionId?: string;
};

export const ExtensionDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  mode,
  extensionId,
  demonstrationId,
  data,
}) => {
  const { addExtension } = useExtension();

  const handleExtensionSubmit = async (extensionData: Record<string, unknown>) => {
    if (mode === "add") {
      // Cast to the proper type since we know the structure from BaseModificationDialog
      await addExtension.trigger(extensionData as unknown as AddExtensionInput);
    } else {
      // TODO: Implement extension update logic when available
      console.log("Extension update not yet implemented for ID:", extensionId);
    }
  };

  const getExtensionFormData = (
    baseData: Record<string, unknown>,
    effectiveDate?: string,
    expirationDate?: string
  ) => {
    return createFormDataWithDates(
      {
        ...baseData,
        extensionStatusId: "EXTENSION_NEW",
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
      entityId={extensionId}
      demonstrationId={demonstrationId}
      data={data}
      entityType="extension"
      onSubmit={handleExtensionSubmit}
      getFormData={getExtensionFormData}
    />
  );
};
