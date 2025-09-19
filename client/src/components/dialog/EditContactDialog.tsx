import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TextInput } from "components/input/TextInput";
import { Select } from "components/input/select/Select";
import { useDialogForm } from "hooks/useDialogForm";
import { DemonstrationRoleAssignment, Person } from "demos-server";
import { ROLES } from "demos-server-constants";

type Role = Pick<DemonstrationRoleAssignment, "isPrimary" | "role"> & {
  person: Pick<Person, "fullName" | "email" | "id">;
};

export type EditContactDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  contact: Role;
  onSubmit: (contact: Role, contactType: string) => Promise<void>;
};

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
}) => {
  const [contactType, setContactType] = useState<string>(contact.role || "");

  const { formStatus, showWarning, showCancelConfirm, setShowCancelConfirm, handleSubmit } =
    useDialogForm({
      mode: "edit",
      onClose,
      validateForm: () => Boolean(contactType),
      getFormData: () => ({ contactType }),
      onSubmit: async (formData) => {
        await onSubmit(contact, formData.contactType as string); // TODO, demonstrationRoleAssignment does not have an ID
      },
      successMessage: {
        add: "Contact created successfully!",
        edit: "Your contact has been updated.",
      },
      errorMessage: "Your changes could not be saved because of an unknown problem.",
    });

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
            disabled={formStatus === "pending"}
          >
            Cancel
          </SecondaryButton>
          <Button
            name="button-submit-contact-dialog"
            size="small"
            type="submit"
            form="contact-form"
            disabled={formStatus === "pending"}
            onClick={() => {}}
          >
            {formStatus === "pending" ? "Submitting..." : "Submit"}
          </Button>
        </>
      }
    >
      <form id="contact-form" className="space-y-4" onSubmit={handleSubmit}>
        {/* Non-editable Name field */}
        <div>
          <TextInput
            name="contact-name"
            label="Name"
            value={contact.person.fullName || ""}
            isDisabled={true}
            placeholder="Contact name"
            isRequired={true}
          />
          <div className="text-xs text-text-placeholder mt-1">
            Name cannot be edited here. Contact an administrator to update this information.
          </div>
        </div>

        {/* Non-editable Email field */}
        <div>
          <TextInput
            name="contact-email"
            label="Email"
            value={contact.person.email || ""}
            isDisabled={true}
            placeholder="Contact email"
            isRequired={true}
          />
          <div className="text-xs text-text-placeholder mt-1">
            Email cannot be edited here. Contact an administrator to update this information.
          </div>
        </div>

        {/* Editable Contact Type field */}
        <div>
          <Select
            id="contact-type"
            label="Contact Type"
            options={ROLES.map((role) => ({ label: role, value: role }))}
            value={contactType}
            onSelect={setContactType}
            isRequired={true}
            placeholder="Select contact type"
          />
          {showWarning && !contactType && (
            <div className="text-text-warn text-sm mt-1">A required field is missing.</div>
          )}
        </div>
      </form>
    </BaseDialog>
  );
};
