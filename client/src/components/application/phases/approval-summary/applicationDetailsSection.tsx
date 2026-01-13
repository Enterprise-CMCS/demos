import React from "react";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { Textarea, TextInput } from "components/input";
import { tw } from "tags/tw";
import { Button } from "components/button";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SdgDivision, SignatureLevel } from "demos-server";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectUsers } from "components/input/select/SelectUsers";

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

export const ApplicationDetailsSection = ({
  sectionFormData,
  setSectionFormData,
  isComplete,
  isReadonly,
  onMarkComplete,
}: {
  sectionFormData: ApplicationDetailsFormData;
  setSectionFormData: (data: ApplicationDetailsFormData) => void;
  isComplete: boolean;
  isReadonly: boolean;
  onMarkComplete: () => void;
}) => {
  return (
    <CompletableSection title="Application Details" isComplete={isComplete}>
      <p className="text-sm text-text-placeholder mt-1 mb-2">
        Confirm all demonstration information including dates and status are accurate.
      </p>
      <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
        <div className="flex flex-col">
          {sectionFormData.readonlyFields.stateId ? (
            <>
              <div className={LABEL_CLASSES}>State/Territory</div>
              <div className={VALUE_CLASSES}>{sectionFormData.stateName}</div>
            </>
          ) : (
            <SelectUSAStates
              label="State/Territory"
              value={sectionFormData.stateId}
              isRequired
              onSelect={(stateId) => setSectionFormData({ ...sectionFormData, stateId })}
            />
          )}
        </div>

        <div className="flex flex-col col-span-3">
          {sectionFormData.readonlyFields.name ? (
            <>
              <div className={LABEL_CLASSES}>Demonstration Title</div>
              <div className={VALUE_CLASSES}>{sectionFormData.name}</div>
            </>
          ) : (
            <TextInput
              name="input-demonstration-title"
              label="Demonstration Title"
              isRequired
              placeholder="Enter title"
              value={sectionFormData.name}
              onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.projectOfficerId ? (
            <>
              <div className={LABEL_CLASSES}>Project Officer</div>
              <div className={VALUE_CLASSES}>{sectionFormData.projectOfficerName}</div>
            </>
          ) : (
            <SelectUsers
              label="Project Officer"
              isRequired={true}
              value={sectionFormData.projectOfficerId}
              onSelect={(projectOfficerId) =>
                setSectionFormData({ ...sectionFormData, projectOfficerId })
              }
              personTypes={["demos-admin", "demos-cms-user"]}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.status ? (
            <>
              <div className={LABEL_CLASSES}>Status</div>
              <div className={VALUE_CLASSES}>{sectionFormData.status}</div>
            </>
          ) : (
            <TextInput
              name="input-status"
              label="Status"
              isRequired
              placeholder="Enter status"
              value={sectionFormData.status}
              onChange={(e) => setSectionFormData({ ...sectionFormData, status: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.effectiveDate ? (
            <>
              <div className={LABEL_CLASSES}>Effective Date</div>
              <div className={VALUE_CLASSES}>{sectionFormData.effectiveDate}</div>
            </>
          ) : (
            <DatePicker
              label="Effective Date"
              name="datepicker-effective-date"
              value={sectionFormData.effectiveDate}
              isRequired
              onChange={(val) =>
                setSectionFormData({
                  ...sectionFormData,
                  effectiveDate: val,
                })
              }
              isDisabled={isReadonly}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.expirationDate ? (
            <>
              <div className={LABEL_CLASSES}>Expiration Date</div>
              <div className={VALUE_CLASSES}>{sectionFormData.expirationDate}</div>
            </>
          ) : (
            <DatePicker
              label="Expiration Date"
              name="datepicker-expiration-date"
              value={sectionFormData.expirationDate}
              isRequired
              onChange={(val) =>
                setSectionFormData({
                  ...sectionFormData,
                  expirationDate: val,
                })
              }
              isDisabled={isReadonly}
            />
          )}
        </div>

        <div className="flex flex-col col-span-4">
          {sectionFormData.readonlyFields.description ? (
            <>
              <div className={LABEL_CLASSES}>Description</div>
              <div className={VALUE_CLASSES}>{sectionFormData.description}</div>
            </>
          ) : (
            <Textarea
              name="description"
              label="Demonstration Description"
              placeholder="Enter description"
              initialValue={sectionFormData.description ?? ""}
              onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.sdgDivision ? (
            <>
              <div className={LABEL_CLASSES}>SDG Division</div>
              <div className={VALUE_CLASSES}>{sectionFormData.sdgDivision}</div>
            </>
          ) : (
            <SelectSdgDivision
              initialValue={sectionFormData.sdgDivision}
              onSelect={(sdgDivision) => setSectionFormData({ ...sectionFormData, sdgDivision })}
            />
          )}
        </div>

        <div className="flex flex-col">
          {sectionFormData.readonlyFields.signatureLevel ? (
            <>
              <div className={LABEL_CLASSES}>Signature Level</div>
              <div className={VALUE_CLASSES}>{sectionFormData.signatureLevel}</div>
            </>
          ) : (
            <SelectSignatureLevel
              initialValue={sectionFormData.signatureLevel}
              onSelect={(signatureLevel) => setSectionFormData({ ...sectionFormData, signatureLevel })}
            />
          )}
        </div>
      </div>
      <div className="border-t-1 border-gray-dark">
        <div className="flex justify-end mt-2 gap-2">
          <Button
            onClick={onMarkComplete}
            size="small"
            name="application-details-mark-complete"
            disabled={
              isComplete ||
              !sectionFormData.stateId ||
              !sectionFormData.name ||
              !sectionFormData.projectOfficerId ||
              !sectionFormData.status ||
              !sectionFormData.effectiveDate ||
              !sectionFormData.expirationDate ||
              !sectionFormData.sdgDivision ||
              !sectionFormData.signatureLevel
            }
          >
            {isComplete ? "Completed" : "Mark Complete"}
          </Button>
        </div>
      </div>
    </CompletableSection>
  );
};
