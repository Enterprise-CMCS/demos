import React, { useMemo } from "react";
import { CompletableSection } from "layout/completableSection";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { Textarea, TextInput } from "components/input";
import Switch from "react-switch";
import { SdgDivision, SignatureLevel } from "demos-server";
import { SelectUsers } from "components/input/select/SelectUsers";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                <span className="text-text-warn mr-xs">*</span>
                State/Territory
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.stateName || ""}
              </div>
            </div>
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                <span className="text-text-warn mr-xs">*</span>
                Demonstration Title
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.name || ""}
              </div>
            </div>
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                <span className="text-text-warn mr-xs">*</span>
                Project Officer
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.projectOfficerName || ""}
              </div>
            </div>
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                <span className="text-text-warn mr-xs">*</span>
                Status
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.status || ""}
              </div>
            </div>
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                Effective Date
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.effectiveDate || ""}
              </div>
            </div>
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                Expiration Date
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.expirationDate || ""}
              </div>
            </div>
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                Description
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.description || ""}
              </div>
            </div>
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
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                SDG Division
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.sdgDivision || ""}
              </div>
            </div>
          ) : (
            <SelectSdgDivision
              initialValue={sectionFormData.sdgDivision}
              onSelect={(sdgDivision) =>
                setSectionFormData({ ...sectionFormData, sdgDivision })
              }
              isDisabled={isReadonly}
              isRequired
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.signatureLevel ? (
            <div>
              <div className="text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center">
                Signature Level
              </div>
              <div className="text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1">
                {sectionFormData.signatureLevel || ""}
              </div>
            </div>
          ) : (
            <SelectSignatureLevel
              initialValue={sectionFormData.signatureLevel}
              onSelect={(signatureLevel) =>
                setSectionFormData({ ...sectionFormData, signatureLevel })
              }
              isDisabled={isReadonly}
              isRequired
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
