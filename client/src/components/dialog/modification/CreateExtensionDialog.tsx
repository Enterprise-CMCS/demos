import React from "react";
import {
  BaseCreateModificationDialog,
  CreateModificationDialogProps,
} from "./BaseCreateModificationDialog";
import { gql } from "@apollo/client";

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
      demonstration {
        id
        extensions {
          id
        }
      }
    }
  }
`;

export const CreateExtensionDialog: React.FC<CreateModificationDialogProps> = (
  createExtensionDialogProps
) => (
  <BaseCreateModificationDialog
    {...createExtensionDialogProps}
    modificationType={"Extension"}
    createModificationDialogMutation={CREATE_EXTENSION_MUTATION}
  />
);
