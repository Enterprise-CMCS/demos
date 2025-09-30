import React from "react";

import { CreateExtensionInput } from "demos-server";
import { createFormDataWithDates } from "hooks/useDialogForm";
import { useExtension } from "hooks/useExtension";

import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";

// Pick the props we need from BaseModificationDialogProps and rename entityId to extensionId for clarity
type Props = Pick<
  BaseModificationDialogProps,
  "isOpen" | "onClose" | "mode" | "demonstrationId" | "data"
> & {
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
      const { demonstrationId, name, description } = extensionData as {
        demonstrationId?: string;
        name?: string;
        description?: unknown;
      };

      if (!demonstrationId || !name) {
        throw new Error("Demonstration ID and name are required to create an extension.");
      }

      const createExtensionInput: CreateExtensionInput = {
        demonstrationId,
        name,
        description:
          typeof description === "string" && description.length === 0
            ? null
            : (description as string | null) ?? null,
      };

      await addExtension.trigger(createExtensionInput);
      return;
    }

    if (!extensionId) {
      throw new Error("Extension ID is required to update an extension.");
    }

    // TODO: Implement extension update logic when available
    console.log("Extension update not yet implemented for ID:", extensionId);
  };

  const getExtensionFormData = (
    baseData: Record<string, unknown>,
    effectiveDate?: string,
    expirationDate?: string
  ) => {
    return createFormDataWithDates(baseData, effectiveDate, expirationDate);
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
