import React from "react";

import { createFormDataWithDates } from "hooks/useDialogForm";

import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";
import { gql } from "graphql-tag";
import { useMutation } from "@apollo/client";
import { Extension as ServerExtension, Demonstration as ServerDemonstration } from "demos-server";

// Pick the props we need from BaseModificationDialogProps and rename entityId to extensionId for clarity
type Props = Pick<
  BaseModificationDialogProps,
  "isOpen" | "onClose" | "mode" | "demonstrationId" | "data"
> & {
  extensionId?: string;
};

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
      demonstration {
        id
      }
    }
  }
`;

type Extension = Pick<ServerExtension, "id"> & {
  demonstration: Pick<ServerDemonstration, "id">;
};

export const ExtensionDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  mode,
  extensionId,
  demonstrationId,
  data,
}) => {
  const [createExtensionMutation] = useMutation<{ createExtension: Extension }>(
    CREATE_EXTENSION_MUTATION,
    {
      update(cache, { data }) {
        const extension = data?.createExtension;
        if (!extension) {
          throw new Error("No extension returned from createExtension mutation");
        }

        cache.modify({
          id: cache.identify({
            __typename: "Demonstration",
            id: extension.demonstration.id,
          }),
          fields: {
            extensions(existingExtensions = []) {
              return [...existingExtensions, extension];
            },
          },
        });
      },
    }
  );

  const handleExtensionSubmit = async (extensionData: Record<string, unknown>) => {
    if (mode === "add") {
      await createExtensionMutation({
        variables: {
          input: extensionData,
        },
      });
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
    const { projectOfficerUserId, status, ...extensionData } = baseData as Record<
      string,
      unknown
    > & {
      projectOfficerUserId?: unknown;
      status?: unknown;
    };
    void projectOfficerUserId;
    void status;

    return createFormDataWithDates(
      {
        ...extensionData,
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
