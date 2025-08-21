import React, {
  useEffect,
  useState,
} from "react";

import {
  Button,
  SecondaryButton,
} from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { SelectCMCSDivision } from "components/input/select/SelectCMCSDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import {
  CmcsDivision,
  CreateDemonstrationInput,
  Demonstration,
  SignatureLevel,
} from "demos-server";
import { useDateValidation } from "hooks/useDateValidation";
import { useDemonstration } from "hooks/useDemonstration";
import { useDialogForm } from "hooks/useDialogForm";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

type DemonstrationDialogMode = "add" | "edit";

type Props = {
  isOpen?: boolean;
  onClose: () => void;
  demonstration?: Demonstration;
  mode: DemonstrationDialogMode;
};

export const DemonstrationDialog: React.FC<Props> = ({ isOpen = true, onClose, demonstration, mode }) => {
  const [state, setState] = useState("");
  const [title, setTitle] = useState("");
  const [projectOfficer, setProjectOfficer] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [description, setDescription] = useState("");
  const [cmcsDivision, setCmcsDivision] = useState("");
  const [signatureLevel, setSignatureLevel] = useState("");

  const { addDemonstration, updateDemonstration } = useDemonstration();

  const {
    expirationError,
    handleEffectiveDateChange,
    handleExpirationDateChange,
  } = useDateValidation();

  const {
    formStatus,
    showCancelConfirm,
    setShowCancelConfirm,
    handleSubmit,
  } = useDialogForm({
    mode,
    onClose,
    validateForm: () => Boolean(state && title && projectOfficer),
    getFormData: (): CreateDemonstrationInput => ({
      name: title,
      description,
      effectiveDate: new Date(effectiveDate),
      expirationDate: new Date(expirationDate),
      demonstrationStatusId: "1",
      stateId: state,
      userIds: [projectOfficer],
      projectOfficerUserId: projectOfficer,
      cmcsDivision: cmcsDivision as CmcsDivision,
      signatureLevel: signatureLevel as SignatureLevel,
    }),
    onSubmit: async (input: CreateDemonstrationInput) => {
      if (mode === "edit" && demonstration?.id) {
        await updateDemonstration.trigger(demonstration.id, input);
      } else {
        await addDemonstration.trigger(input);
      }
    },
    successMessage: {
      add: "Demonstration created successfully!",
      edit: "Demonstration updated successfully!",
    },
    errorMessage: "Failed to save demonstration. Please try again.",
  });

  useEffect(() => {
    if (demonstration) {
      setState(demonstration.state?.id || "");
      setTitle(demonstration.name || "");
      setProjectOfficer(demonstration.users?.[0]?.id || "");
      setEffectiveDate(formatDate(demonstration.effectiveDate));
      setExpirationDate(formatDate(demonstration.expirationDate));
      setDescription(demonstration.description || "");
      setCmcsDivision(demonstration.cmcsDivision || "");
      setSignatureLevel(demonstration.signatureLevel || "");
    }
  }, [demonstration]);

  return (
    <BaseDialog
      title={mode === "edit" ? "Edit Demonstration" : "New Demonstration"}
      isOpen={isOpen}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[720px]"
      actions={
        <>
          <SecondaryButton name="cancel" size="small" onClick={() => setShowCancelConfirm(true)}>
            Cancel
          </SecondaryButton>
          <Button
            name="submit"
            size="small"
            disabled={!(state && title && projectOfficer) || formStatus === "pending"}
            type="submit"
            form="demonstration-form"
            onClick={() => { }}
          >
            {formStatus === "pending" ? (
              <svg
                className="animate-spin h-2 w-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              "Submit"
            )}
          </Button>
        </>
      }
    >
      <form
        id="demonstration-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-3 gap-5">
          <div>
            <SelectUSAStates
              label="State/Territory"
              currentState={state}
              value={state}
              isRequired
              onStateChange={setState}
            />
          </div>
          <div className="col-span-2">
            <TextInput
              name="title"
              label="Demonstration Title"
              isRequired
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <SelectUsers
              label="Project Officer"
              isRequired
              onStateChange={setProjectOfficer}
              value={projectOfficer}
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label className={LABEL_CLASSES} htmlFor="effective-date">
              Effective Date
            </label>
            <input
              data-testid="effective-date-input"
              id="effective-date"
              type="date"
              className={DATE_INPUT_CLASSES}
              value={effectiveDate}
              onChange={(e) => handleEffectiveDateChange(e.target.value, expirationDate, setEffectiveDate, setExpirationDate)}
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label className={LABEL_CLASSES} htmlFor="expiration-date">
              Expiration Date
            </label>
            <input
              data-testid="input-expiration-date"
              id="expiration-date"
              type="date"
              className={`${DATE_INPUT_CLASSES} ${expirationError
                ? "border-border-warn focus:ring-border-warn"
                : "border-border-fields focus:ring-border-focus"
              }`}
              value={expirationDate}
              min={effectiveDate || undefined}
              onChange={(e) => handleExpirationDateChange(e.target.value, effectiveDate, setExpirationDate)}
            />
            {expirationError && <div className="text-text-warn text-sm mt-1">{expirationError}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label className={LABEL_CLASSES} htmlFor="description">
            Demonstration Description
          </label>
          <textarea
            data-testid="textarea-description"
            id="description"
            placeholder="Enter description"
            className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SelectCMCSDivision onSelect={setCmcsDivision} />
          <SelectSignatureLevel onSelect={setSignatureLevel} />
        </div>
      </form>
    </BaseDialog>
  );
};
