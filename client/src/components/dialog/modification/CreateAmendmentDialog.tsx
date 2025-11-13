import React from "react";
import {
  BaseCreateModificationDialog,
  CreateModificationDialogProps,
} from "./BaseCreateModificationDialog";
import { gql } from "@apollo/client";

export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      demonstration {
        id
        amendments {
          id
        }
      }
    }
  }
`;

export const CreateAmendmentDialog: React.FC<CreateModificationDialogProps> = (
  createAmendmentDialogProps
) => (
  <BaseCreateModificationDialog
    {...createAmendmentDialogProps}
    modificationType={"Amendment"}
    createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
  />
);
