import React from "react";

import { createFormDataWithDates } from "hooks/useDialogForm";

import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";
import { gql } from "graphql-tag";
import { useMutation } from "@apollo/client";
import { Amendment as ServerAmendment, Demonstration } from "demos-server";

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
  const [createAmendmentMutation] = useMutation<{ createAmendment: Amendment }>(
    CREATE_AMENDMENT_MUTATION,
    {
      update(cache, { data }) {
        const amendment = data?.createAmendment;
        if (!amendment) {
          throw new Error("No amendment returned from createAmendment mutation");
        }

        cache.modify({
          id: cache.identify({
            __typename: "Demonstration",
            id: amendment.demonstration.id,
          }),
          fields: {
            amendments(existingAmendments = []) {
              return [...existingAmendments, amendment];
            },
          },
        });
      },
    }
  );

  const handleAmendmentSubmit = async (amendmentData: Record<string, unknown>) => {
    if (mode === "add") {
      await createAmendmentMutation({
        variables: {
          input: amendmentData,
        },
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
