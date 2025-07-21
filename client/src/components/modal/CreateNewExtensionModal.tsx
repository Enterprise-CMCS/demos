import React, { useState } from "react";

import {
  PrimaryButton,
  SecondaryButton,
} from "components/button";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";
import { tw } from "tags/tw";

const LABEL = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT = tw`w-full border rounded px-1 py-1 text-sm`;

type Props = {
  onClose: () => void;
};

export const CreateNewExtensionModal: React.FC<Props> = ({ onClose }) => {
  const { showSuccess } = useToast();

  const [title, setTitle] = useState("");
  const [state, setState] = useState("");
  const [projectOfficer, setProjectOfficer] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [description, setDescription] = useState("");
  const [expirationError, setExpirationError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [demonstration, setDemonstration] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const isSubmitDisabled = !demonstration || !title || !state || !projectOfficer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    if (!demonstration || !title || !state || !projectOfficer) return;

    showSuccess("Extension created successfully!");
    onClose();
  };

  return (
    <BaseModal
      title="New Extension"
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[720px]"
      actions={
        <>
          <SecondaryButton size="small" onClick={() => setShowCancelConfirm(true)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            size="small"
            type="submit"
            form="create-extension-form"
            disabled={isSubmitDisabled}
          >
            Submit
          </PrimaryButton>
        </>
      }
    >
      <form
        id="create-extension-form"
        onSubmit={handleSubmit}
        className="space-y-1"
      >
        <div>
          <AutoCompleteSelect
            label="Demonstration"
            placeholder="Select demonstration"
            isRequired
            options={[
              { label: "Medicaid Reform - Florida", value: "medicaid-fl" },
              { label: "Innovative Care - California", value: "innovative-ca" },
            ]}
            onSelect={(val) => setDemonstration(val)}
          />
          {showValidation && !demonstration && (
            <p className="text-sm text-text-warn mt-0.5">
              Each extension record must first be linked to an existing demonstration in the system
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextInput
              name="title"
              label="Extension Title"
              placeholder="Enter title"
              isRequired
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <SelectUSAStates
              label="State/Territory"
              isRequired
              currentState={state}
              onStateChange={setState}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <SelectUsers
              label="Project Officer"
              isRequired
              currentUserId={projectOfficer}
              onStateChange={setProjectOfficer}
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label className={LABEL} htmlFor="effective-date">
              Effective Date
            </label>
            <input
              id="effective-date"
              type="date"
              className={DATE_INPUT}
              value={effectiveDate}
              onChange={(e) => {
                setEffectiveDate(e.target.value);
                if (expirationDate && expirationDate < e.target.value) {
                  setExpirationDate("");
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label className={LABEL} htmlFor="expiration-date">
              Expiration Date
            </label>
            <input
              id="expiration-date"
              type="date"
              className={`${DATE_INPUT} ${expirationError
                ? "border-border-warn focus:ring-border-warn"
                : "border-border-fields focus:ring-border-focus"
                // eslint-disable-next-line indent
                }`}
              value={expirationDate}
              min={effectiveDate || undefined}
              onChange={(e) => {
                const val = e.target.value;
                if (effectiveDate && val < effectiveDate) {
                  setExpirationError("Expiration Date cannot be before Effective Date.");
                } else {
                  setExpirationError("");
                  setExpirationDate(val);
                }
              }}
            />
            {expirationError && (
              <div className="text-text-warn text-sm mt-1">{expirationError}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label className={LABEL} htmlFor="description">
            Extension Description
          </label>
          <textarea
            id="description"
            placeholder="Enter"
            className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </BaseModal>
  );
};
