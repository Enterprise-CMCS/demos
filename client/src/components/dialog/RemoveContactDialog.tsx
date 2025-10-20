import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { ErrorButton } from "components/button/ErrorButton";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon } from "components/icons";
import { useToast } from "components/toast";
import { gql } from "graphql-tag";
import { useMutation } from "@apollo/client";
import { Role } from "demos-server";

export const UNSET_DEMONSTRATION_ROLE_MUTATION = gql`
  mutation UnsetDemonstrationRoles($input: [UnsetDemonstrationRoleInput!]!) {
    unsetDemonstrationRoles(input: $input) {
      role
      person {
        id
      }
      demonstration {
        id
      }
    }
  }
`;

type DemonstrationRoleAssignment = {
  person: {
    id: string;
  };
  demonstration: {
    id: string;
  };
  role: Role;
};

export type RemoveContactDialogProps = {
  isOpen: boolean;
  contacts: DemonstrationRoleAssignment[];
  onClose: () => void;
};

export const RemoveContactDialog: React.FC<RemoveContactDialogProps> = ({
  isOpen,
  contacts,
  onClose,
}) => {
  const { showSuccess, showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [unsetDemonstrationRolesTrigger] = useMutation(UNSET_DEMONSTRATION_ROLE_MUTATION);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);

      const mutationInput = contacts.map((contact) => ({
        personId: contact.person.id,
        demonstrationId: contact.demonstration.id,
        roleId: contact.role,
      }));

      await unsetDemonstrationRolesTrigger({ variables: { input: mutationInput } });

      const isMultipleContacts = contacts.length > 1;
      showSuccess(`Your contact${isMultipleContacts ? "s have" : " has"} been removed.`);
      console.log(
        "Deleting contacts:",
        contacts.map((contact) => contact.person.id)
      );
      onClose();
    } catch (error) {
      console.error("Error in handleConfirm:", error);
      showError("Your changes could not be saved due to an unknown problem.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseDialog
      title="Remove Contact(s)"
      isOpen={isOpen}
      onClose={onClose}
      actions={
        <>
          <SecondaryButton
            name="button-cancel-delete-contact"
            size="small"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </SecondaryButton>
          <ErrorButton
            name="button-confirm-delete-contact"
            size="small"
            onClick={() => void handleConfirm()}
            aria-label="Confirm Remove Contact"
            disabled={isDeleting}
            aria-disabled={isDeleting}
          >
            {isDeleting ? "Removing..." : "Remove"}
          </ErrorButton>
        </>
      }
    >
      <div className="mb-2 text-sm text-text-filled">
        Are you sure you want to remove the contact(s)?
        <br />
        <span className="text-error flex items-center gap-1 mt-1">
          <ErrorIcon />
          This action cannot be undone.
        </span>
      </div>
    </BaseDialog>
  );
};
