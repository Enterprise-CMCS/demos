import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TextInput } from "components/input/TextInput";
import { Select } from "components/input/select/Select";
import { useDialogForm } from "hooks/useDialogForm";

// Contact types based on the existing system types (these may need to be updated to match acceptance criteria)
const CONTACT_TYPE_OPTIONS = [
  { label: "Primary Project Officer", value: "Primary Project Officer" },
  { label: "Secondary Project Officer", value: "Secondary Project Officer" },
  { label: "State Representative", value: "State Representative" },
  { label: "Subject Matter Expert", value: "Subject Matter Expert" },
];

export type EditContactDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    fullName: string | null;
    email: string | null;
    contactType: string | null;
  };
  onSubmit: (contactId: string, contactType: string) => Promise<void>;
};

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
}) => {
  const [contactType, setContactType] = useState(contact.contactType || "");

  const { formStatus, showWarning, showCancelConfirm, setShowCancelConfirm, handleSubmit } =
    useDialogForm({
      mode: "edit",
      onClose,
      validateForm: () => Boolean(contactType),
      getFormData: () => ({ contactType }),
      onSubmit: async (formData) => {
        await onSubmit(contact.id, formData.contactType as string);
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
            value={contact.fullName || ""}
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
            value={contact.email || ""}
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
            options={CONTACT_TYPE_OPTIONS}
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
