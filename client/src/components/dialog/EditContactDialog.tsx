import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { Select } from "components/input/select/Select";
import {
  DemonstrationRoleAssignment as ServerDemonstrationRoleAssignment,
  Person as ServerPerson,
} from "demos-server";
import { ROLES } from "demos-server-constants";
import { SelectPeople } from "components/input/select/SelectPeople";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "components/toast";

const SUCCESS_MESSAGE = "Contact updated successfully.";
const ERROR_MESSAGE = "An error occurred while updating the contact. Please try again.";

export const SET_DEMONSTRATION_ROLE_MUTATION = gql`
  mutation SetDemonstrationRole($input: SetDemonstrationRoleInput!) {
    setDemonstrationRole(input: $input) {
      role
    }
  }
`;

type Person = Pick<ServerPerson, "id">;
type DemonstrationRoleAssignment = Pick<ServerDemonstrationRoleAssignment, "isPrimary" | "role"> & {
  person: Person;
};

export type EditContactDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  contact?: DemonstrationRoleAssignment;
  demonstrationId: string;
};

type FormData = {
  isPrimary?: boolean;
  roleId?: string;
  personId?: string;
  demonstrationId?: string;
};

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  isOpen,
  onClose,
  contact,
  demonstrationId,
}) => {
  const { showSuccess, showError } = useToast();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    demonstrationId: demonstrationId,
    personId: contact?.person.id,
    isPrimary: contact?.isPrimary,
    roleId: contact?.role,
  });
  const [setDemonstrationRoleTrigger] = useMutation(SET_DEMONSTRATION_ROLE_MUTATION);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setIsSubmitting(true);
    try {
      await setDemonstrationRoleTrigger({
        variables: {
          input: formData,
        },
      });
      onClose();
      showSuccess(SUCCESS_MESSAGE);
      console.log("Contact updated:", formData);
    } catch {
      showError(ERROR_MESSAGE);
    }
    setIsSubmitting(false);
  };

  return (
    <BaseDialog
      title="Edit Contact"
      isOpen={isOpen}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[500px]"
      actions={
        <>
          <SecondaryButton
            name="button-cancel-contact-dialog"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <Button
            name="button-submit-contact-dialog"
            size="small"
            type="submit"
            form="contact-form"
            disabled={isSubmitting}
            onClick={() => {}}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </>
      }
    >
      <form id="contact-form" className="space-y-4" onSubmit={handleSubmit}>
        {/* Non-editable Name field */}
        <div>
          <SelectPeople
            value={formData.personId}
            label="Person"
            onChange={(value) =>
              setFormData({
                ...formData,
                personId: value,
              })
            }
            isRequired={true}
          />
        </div>
        <div>
          <Select
            id="contact-type"
            label="Contact Type"
            options={ROLES.map((role) => ({ label: role, value: role }))}
            value={formData.roleId}
            onChange={(value) =>
              setFormData({
                ...formData,
                roleId: value,
              })
            }
            isRequired={true}
            placeholder="Select contact type"
          />
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isPrimary: e.target.checked,
                })
              }
              className="w-2 h-2 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-900">Is Primary Contact</span>
          </label>
        </div>
      </form>
    </BaseDialog>
  );
};
