import React from "react";
import { DatePicker } from "components/input/date/DatePicker";
import { SecondaryButton } from "components/button";
import { SelectDemonstrationType } from "components/input/select/SelectDemonstrationType";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { TagName, Tag, TagStatus } from "demos-server";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";
import { WarningIcon, LabelIcon } from "components/icons";
import { tw } from "tags/tw";

const CREATE_TYPE_BUTTON_CLASSES = tw`
  inline-flex items-center justify-center gap-xs
  font-semibold text-[14px] px-[16px] py-[12px]
  rounded-md border border-action text-action bg-white
  hover:bg-action hover:text-white
  focus:outline-none focus:ring-2 focus:ring-action-focus
  transition-all cursor-pointer whitespace-nowrap
  disabled:bg-gray-200 disabled:border-border-rules
  disabled:text-text-placeholder disabled:cursor-not-allowed
`;

export const ADD_DEMONSTRATION_TYPES_FORM_QUERY: TypedDocumentNode<
  {
    demonstration: {
      demonstrationTypes: {
        demonstrationTypeName: TagName;
      }[];
    };
  },
  { id: string }
> = gql`
  query AddDemonstrationTypesForm($id: ID!) {
    demonstration(id: $id) {
      demonstrationTypes {
        demonstrationTypeName
      }
    }
  }
`;

const UNAPPROVED_WARNING_MESSAGE =
  "Unapproved types are still searchable by others. Please verify it's correct before applying to prevent compounding errors.";

function isValid(demonstrationType: DemonstrationType): boolean {
  return !!(
    demonstrationType.demonstrationTypeName &&
    demonstrationType.effectiveDate &&
    demonstrationType.expirationDate &&
    new Date(demonstrationType.effectiveDate) <= new Date(demonstrationType.expirationDate)
  );
}

export const AddDemonstrationTypesForm = ({
  demonstrationId,
  demonstrationTypeNames,
  addDemonstrationType,
}: {
  demonstrationId: string;
  demonstrationTypeNames: TagName[];
  addDemonstrationType: (demonstrationType: DemonstrationType) => void;
}) => {
  const { data, loading, error } = useQuery(ADD_DEMONSTRATION_TYPES_FORM_QUERY, {
    variables: { id: demonstrationId },
  });

  const [demonstrationTypeFormData, setDemonstrationTypeFormData] =
    React.useState<DemonstrationType>({
      demonstrationTypeName: "",
      approvalStatus: "Approved",
      effectiveDate: "",
      expirationDate: "",
    });

  const [filterValue, setFilterValue] = React.useState("");
  const [hasMatches, setHasMatches] = React.useState(true);
  const [createdTypes, setCreatedTypes] = React.useState<Tag[]>([]);

  if (loading) return <div>Loading demonstration...</div>;
  if (error || !data) return <div>Error loading demonstration.</div>;

  const handleAddDemonstrationType = () => {
    if (!isValid(demonstrationTypeFormData)) return;
    addDemonstrationType(demonstrationTypeFormData);
    setDemonstrationTypeFormData({
      ...demonstrationTypeFormData,
      demonstrationTypeName: "",
      approvalStatus: "Approved",
    });
  };

  const filterDemonstrationTypes = (demonstrationTypeName: string) => {
    return !demonstrationTypeNames.includes(demonstrationTypeName);
  };

  const validateDatePicker = (effectiveDate: string, expirationDate: string) => {
    if (
      !effectiveDate ||
      !expirationDate ||
      new Date(demonstrationTypeFormData.effectiveDate) <=
        new Date(demonstrationTypeFormData.expirationDate)
    ) {
      return "";
    }

    return "Effective date must be on or before expiration date.";
  };

  const handleFilterChange = (value: string, matches: boolean) => {
    setFilterValue(value);
    setHasMatches(matches);
  };

  const canCreateType = !hasMatches && filterValue.trim().length > 0;

  const handleCreateType = () => {
    const newTypeName = filterValue.trim();
    const unapproved: TagStatus = "Unapproved";
    const newTag = { tagName: newTypeName, approvalStatus: unapproved };
    setCreatedTypes((prev) => [...prev, newTag]);
    setDemonstrationTypeFormData(
      (prev): DemonstrationType => ({
        ...prev,
        demonstrationTypeName: newTypeName,
        approvalStatus: unapproved,
      })
    );
    setFilterValue("");
    setHasMatches(true);
  };

  const showUnapprovedWarning = demonstrationTypeFormData.approvalStatus === "Unapproved";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <SelectDemonstrationType
            filter={filterDemonstrationTypes}
            isRequired
            allowCreateNew
            createdOptions={createdTypes}
            value={demonstrationTypeFormData.demonstrationTypeName}
            onSelect={(demonstrationTypeOption) =>
              setDemonstrationTypeFormData(
                (demonstrationType): DemonstrationType => ({
                  ...demonstrationType,
                  demonstrationTypeName: demonstrationTypeOption.tagName,
                  approvalStatus: demonstrationTypeOption.approvalStatus,
                })
              )
            }
            onFilterChange={handleFilterChange}
          />
        </div>
        <button
          data-testid="button-create-type"
          name="button-create-type"
          type="button"
          disabled={!canCreateType}
          onClick={handleCreateType}
          className={CREATE_TYPE_BUTTON_CLASSES}
        >
          Create Type
          <LabelIcon />
        </button>
        <div className="flex-1 flex gap-2">
          <div className="flex-1">
            <DatePicker
              isRequired
              value={demonstrationTypeFormData.effectiveDate}
              onChange={(date) =>
                setDemonstrationTypeFormData(
                  (demonstrationType): DemonstrationType => ({
                    ...demonstrationType,
                    effectiveDate: date,
                  })
                )
              }
              label="Effective Date"
              name="date-picker-effective-date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              isRequired
              value={demonstrationTypeFormData.expirationDate}
              onChange={(date) =>
                setDemonstrationTypeFormData(
                  (demonstrationType): DemonstrationType => ({
                    ...demonstrationType,
                    expirationDate: date,
                  })
                )
              }
              label="Expiration Date"
              name="date-picker-expiration-date"
              getValidationMessage={() =>
                validateDatePicker(
                  demonstrationTypeFormData.effectiveDate,
                  demonstrationTypeFormData.expirationDate
                )
              }
            />
          </div>
        </div>
      </div>

      {showUnapprovedWarning && (
        <div
          className="flex items-center gap-1 p-1 bg-yellow-50 border border-yellow-300 rounded text-sm"
          data-testid="unapproved-warning-banner"
          role="alert"
        >
          <WarningIcon className="shrink-0" width="16" height="16" />
          <span className="italic text-text-font">{UNAPPROVED_WARNING_MESSAGE}</span>
        </div>
      )}

      <div className="flex justify-end">
        <SecondaryButton
          disabled={!isValid(demonstrationTypeFormData)}
          name="button-add-demonstration-type"
          type="button"
          onClick={handleAddDemonstrationType}
        >
          + Add to List
        </SecondaryButton>
      </div>
    </div>
  );
};
