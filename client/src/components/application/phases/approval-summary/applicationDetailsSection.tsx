import React, { useMemo } from "react";
import { CompletableSection } from "layout/completableSection";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { Textarea, TextInput } from "components/input";
import { tw } from "tags/tw";
import Switch from "react-switch";
import { SdgDivision, SignatureLevel } from "demos-server";
import { SelectUsers } from "components/input/select/SelectUsers";
import { INPUT_BASE_CLASSES } from "components/input/Input";
import { SDG_DIVISIONS, SIGNATURE_LEVEL } from "demos-server-constants";
import { DatePicker } from "components/input/date/DatePicker";

export type ApplicationDetailsFormData = {
  stateId: string;
  stateName: string;
  name: string;
  projectOfficerId: string;
  projectOfficerName: string;
  status: string;
  effectiveDate?: string;
  expirationDate?: string;
  description?: string;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
  readonlyFields: Partial<Record<
    | "stateId"
    | "name"
    | "projectOfficerId"
    | "status"
    | "effectiveDate"
    | "expirationDate"
    | "description"
    | "sdgDivision"
    | "signatureLevel",
    boolean
  >>;
};

const LABEL_CLASSES = tw`text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center`;
const VALUE_CLASSES = tw`text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1`;

const ReadonlyField = ({ label, value, isRequired = false }: { label: string; value?: string; isRequired?: boolean }) => (
  <>
    <div className={LABEL_CLASSES}>
      {isRequired && <span className="text-text-warn mr-xs">*</span>}
      {label}
    </div>
    <div className={VALUE_CLASSES}>{value || ""}</div>
  </>
);

const SelectField = ({
  id,
  label,
  value,
  options,
  placeholder,
  isReadonly,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  options: readonly string[];
  placeholder: string;
  isReadonly: boolean;
  onChange: (value: string | undefined) => void;
}) => (
  <>
    <label
      htmlFor={id}
      className="text-text-font font-semibold text-field-label flex gap-0-5"
    >
      <span className="text-text-warn">*</span>
      {label}
    </label>
    <select
      id={id}
      name={id.replace("-select", "")}
      className={INPUT_BASE_CLASSES}
      required
      disabled={isReadonly}
      value={value || ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </>
);

export const ApplicationDetailsSection = ({
  sectionFormData,
  setSectionFormData,
  isComplete,
  isReadonly,
  onMarkComplete,
  onMarkIncomplete,
  completionDate,
}: {
  sectionFormData: ApplicationDetailsFormData;
  setSectionFormData: (data: ApplicationDetailsFormData) => void;
  isComplete: boolean;
  isReadonly: boolean;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  completionDate?: string;
}) => {
  const requiredFieldsFilled = useMemo(
    () =>
      !!(
        sectionFormData.stateId &&
        sectionFormData.name &&
        sectionFormData.projectOfficerId &&
        sectionFormData.status &&
        sectionFormData.effectiveDate &&
        sectionFormData.expirationDate &&
        sectionFormData.sdgDivision &&
        sectionFormData.signatureLevel
      ),
    [sectionFormData]
  );

  return (
    <CompletableSection title="Application Details" isComplete={isComplete}>
      <p className="text-sm text-text-placeholder mt-1 mb-2">
        Confirm all demonstration information including dates and status are accurate.
      </p>
      {completionDate && (
        <p className="text-sm text-text-placeholder mb-2" data-testid="application-details-completion-date">
          Completion Date: {completionDate}
        </p>
      )}
      <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
        <div className="flex flex-col">
          {sectionFormData.readonlyFields.stateId ? (
            <ReadonlyField
              label="State/Territory"
              value={sectionFormData.stateName}
              isRequired
            />
          ) : (
            <SelectUSAStates
              label="State/Territory"
              value={sectionFormData.stateId}
              isRequired
              isDisabled={isReadonly}
              onSelect={(stateId) => setSectionFormData({ ...sectionFormData, stateId })}
            />
          )}
        </div>

        <div className="flex flex-col col-span-3">
          {sectionFormData.readonlyFields.name ? (
            <ReadonlyField
              label="Demonstration Title"
              value={sectionFormData.name}
              isRequired
            />
          ) : (
            <TextInput
              name="input-demonstration-title"
              label="Demonstration Title"
              isRequired
              placeholder="Enter title"
              value={sectionFormData.name}
              isDisabled={isReadonly}
              onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.projectOfficerId ? (
            <ReadonlyField
              label="Project Officer"
              value={sectionFormData.projectOfficerName}
              isRequired
            />
          ) : (
            <SelectUsers
              label="Project Officer"
              isRequired={true}
              value={sectionFormData.projectOfficerId}
              isDisabled={isReadonly}
              onSelect={(projectOfficerId) =>
                setSectionFormData({ ...sectionFormData, projectOfficerId })
              }
              personTypes={["demos-admin", "demos-cms-user"]}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.status ? (
            <ReadonlyField
              label="Status"
              value={sectionFormData.status}
              isRequired
            />
          ) : (
            <TextInput
              name="input-status"
              label="Status"
              isRequired
              placeholder="Enter status"
              value={sectionFormData.status}
              isDisabled={isReadonly}
              onChange={(e) => setSectionFormData({ ...sectionFormData, status: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.effectiveDate ? (
            <ReadonlyField
              label="Effective Date"
              value={sectionFormData.effectiveDate}
            />
          ) : (
            <DatePicker
              name="datepicker-effective-date"
              label="Effective Date"
              value={sectionFormData.effectiveDate}
              isRequired
              onChange={(effectiveDate) =>
                setSectionFormData({ ...sectionFormData, effectiveDate })
              }
              isDisabled={isReadonly}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.expirationDate ? (
            <ReadonlyField
              label="Expiration Date"
              value={sectionFormData.expirationDate}
            />
          ) : (
            <DatePicker
              name="datepicker-expiration-date"
              label="Expiration Date"
              value={sectionFormData.expirationDate}
              isRequired
              onChange={(expirationDate) =>
                setSectionFormData({ ...sectionFormData, expirationDate })
              }
              isDisabled={isReadonly}
            />
          )}
        </div>

        <div className="flex flex-col col-span-4">
          {sectionFormData.readonlyFields.description ? (
            <ReadonlyField
              label="Description"
              value={sectionFormData.description}
            />
          ) : (
            <Textarea
              name="description"
              label="Demonstration Description"
              placeholder="Enter description"
              initialValue={sectionFormData.description ?? ""}
              isDisabled={isReadonly}
              onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.sdgDivision ? (
            <ReadonlyField
              label="SDG Division"
              value={sectionFormData.sdgDivision}
            />
          ) : (
            <SelectField
              id="sdg-division-select"
              label="SDG Division"
              value={sectionFormData.sdgDivision}
              options={SDG_DIVISIONS}
              placeholder="Select SDG Division"
              isReadonly={isReadonly}
              onChange={(sdgDivision) =>
                setSectionFormData({ ...sectionFormData, sdgDivision: sdgDivision as SdgDivision | undefined })
              }
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.signatureLevel ? (
            <ReadonlyField
              label="Signature Level"
              value={sectionFormData.signatureLevel}
            />
          ) : (
            <SelectField
              id="signature-level-select"
              label="Signature Level"
              value={sectionFormData.signatureLevel}
              options={SIGNATURE_LEVEL}
              placeholder="Select Signature Level"
              isReadonly={isReadonly}
              onChange={(signatureLevel) =>
                setSectionFormData({ ...sectionFormData, signatureLevel: signatureLevel as SignatureLevel | undefined })
              }
            />
          )}
        </div>
      </div>
      <div className="border-t-1 border-gray-dark mt-4">
        <div className="flex justify-end items-center mt-2 gap-2">
          <span className="text-sm font-semibold text-text-font">
            <span className="text-text-warn mr-xs">*</span>
            {" "}
            Mark Complete
          </span>
          <Switch
            checked={isComplete}
            onChange={() => {
              if (isComplete) {
                onMarkIncomplete();
              } else if (requiredFieldsFilled) {
                onMarkComplete();
              }
            }}
            disabled={!isComplete && !requiredFieldsFilled}
            onColor="#6B7280"
            offColor="#E5E7EB"
            checkedIcon={false}
            uncheckedIcon={false}
            height={18}
            width={40}
            handleDiameter={24}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0 0 2px 3px #3bf"
            aria-label="Mark Complete"
          />
        </div>
      </div>
    </CompletableSection>
  );
};
