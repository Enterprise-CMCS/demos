import React from "react";

import { createFormDataWithDates } from "hooks/useDialogForm";

import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";
import { gql } from "graphql-tag";
import { useMutation } from "@apollo/client";
import { Amendment as ServerAmendment, Demonstration } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";

export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      demonstration {
        id
      }
    }
  }
`;

type Amendment = Pick<ServerAmendment, "id"> & {
  demonstration: Pick<Demonstration, "id">;
};

// Pick the props we need from BaseModificationDialogProps and rename entityId to amendmentId for clarity
type Props = Pick<BaseModificationDialogProps, "onClose" | "mode" | "demonstrationId" | "data"> & {
  amendmentId?: string;
};

export const AmendmentDialog: React.FC<Props> = ({
  onClose,
  mode,
  amendmentId,
  demonstrationId,
  data,
}) => {
  const [createAmendmentMutation] = useMutation<{ createAmendment: Amendment }>(
    CREATE_AMENDMENT_MUTATION
  );

  const handleAmendmentSubmit = async (amendmentData: Record<string, unknown>) => {
    if (mode === "add") {
      await createAmendmentMutation({
        variables: {
          input: amendmentData,
        },
        refetchQueries: [
          {
            query: DEMONSTRATION_DETAIL_QUERY,
            variables: { id: demonstrationId },
          },
          {
            query: DEMONSTRATIONS_PAGE_QUERY,
          },
        ],
      });
    } else {
      // TODO: Implement amendment update logic when available
      console.log("Amendment update not yet implemented for ID:", amendmentId);
    }
  };

  const getAmendmentFormData = (
    baseData: Record<string, unknown>,
    effectiveDate?: string,
    expirationDate?: string
  ) => {
    const { projectOfficerUserId, ...amendmentData } = baseData as Record<string, unknown> & {
      projectOfficerUserId?: unknown;
    };
    void projectOfficerUserId;

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
