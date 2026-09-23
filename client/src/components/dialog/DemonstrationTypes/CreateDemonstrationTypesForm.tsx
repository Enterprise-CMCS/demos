import React from "react";
import { Button, SecondaryButton } from "components/button";
import { SelectDemonstrationType } from "components/input/select/SelectDemonstrationType";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { TagName, Tag, TagStatus } from "demos-server";
import { WarningIcon, LabelIcon } from "components/icons";
import { NewDemonstrationType } from "./CreateDemonstrationTypesDialog";

export const CREATE_DEMONSTRATION_TYPES_FORM_QUERY: TypedDocumentNode<{
  demonstrationTypeOptions: { tagName: TagName }[];
}> = gql`
  query CreateDemonstrationTypesForm {
    demonstrationTypeOptions {
      tagName
    }
  }
`;

const UNAPPROVED_WARNING_MESSAGE =
  'Consult with SDG leadership and check spelling before creating a new tag/type. New tag/types are labelled "Unapproved" but can still be seen and used by others.';

export const CreateDemonstrationTypesForm = ({
  demonstrationTypeNames,
  addDemonstrationType,
}: {
  demonstrationTypeNames: TagName[];
  addDemonstrationType: (demonstrationType: NewDemonstrationType) => void;
}) => {
  const { data, loading, error } = useQuery(CREATE_DEMONSTRATION_TYPES_FORM_QUERY);

  const [filterValue, setFilterValue] = React.useState("");
  const [hasExactMatch, setHasExactMatch] = React.useState(false);
  const [createdTypes, setCreatedTypes] = React.useState<Tag[]>([]);
  const [demonstrationTypeFormData, setDemonstrationTypeFormData] =
    React.useState<NewDemonstrationType>({ demonstrationTypeName: "", approvalStatus: "Approved" });

  if (loading) return <div>Loading demonstration types...</div>;

  if (error || !data) {
    return <div>Error loading demonstration types.</div>;
  }

  const normalizedFilterValue = filterValue.trim().toLowerCase();
  const isAlreadyAdded = demonstrationTypeNames.some(
    (name) => name.trim().toLowerCase() === normalizedFilterValue
  );

  const handleFilterChange = (value: string, hasExactMatch: boolean) => {
    setFilterValue(value);
    setHasExactMatch(hasExactMatch);
  };
  const handleCreateType = () => {
    const newTypeName = filterValue.trim();
    if (!newTypeName || !canCreateType) {
      return;
    }
    const unapproved: TagStatus = "Unapproved";
    const newTag: Tag = { tagName: newTypeName, approvalStatus: unapproved };
    setCreatedTypes((prev) => [...prev, newTag]);
    setDemonstrationTypeFormData({
      demonstrationTypeName: newTypeName as TagName,
      approvalStatus: unapproved,
    });
    setFilterValue("");
    setHasExactMatch(false);
  };
  const handleAddDemonstrationType = () => {
    if (!demonstrationTypeFormData.demonstrationTypeName) {
      return;
    }
    addDemonstrationType(demonstrationTypeFormData);
    setDemonstrationTypeFormData({ demonstrationTypeName: "", approvalStatus: "Approved" });
    setFilterValue("");
    setHasExactMatch(false);
  };

  const canCreateType = filterValue.trim().length > 0 && !hasExactMatch && !isAlreadyAdded;
  const showUnapprovedWarning = demonstrationTypeFormData.approvalStatus === "Unapproved";

  const isAvailableType = (name: string) =>
    !demonstrationTypeNames.some(
      (existingName) => existingName.trim().toLowerCase() === name.trim().toLowerCase()
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <SelectDemonstrationType
            filter={isAvailableType}
            isRequired
            allowCreateNew
            createdOptions={createdTypes}
            value={demonstrationTypeFormData.demonstrationTypeName}
            onSelect={(demonstrationTypeOption) =>
              setDemonstrationTypeFormData({
                demonstrationTypeName: demonstrationTypeOption.tagName,
                approvalStatus: demonstrationTypeOption.approvalStatus,
              })
            }
            onFilterChange={handleFilterChange}
            placeholderText="Type to search..."
            noMatchMessage="No results found"
          />
        </div>
        <Button
          name={"button-create-demonstration-type"}
          disabled={!canCreateType}
          onClick={handleCreateType}
        >
          Create Type <LabelIcon />
        </Button>
      </div>

      {showUnapprovedWarning && (
        <div
          className="flex items-center gap-1 p-1 bg-yellow-50 border border-yellow-300 rounded text-sm"
          data-testid="unapproved-warning-banner"
          role="alert"
        >
          <WarningIcon className="shrink-0" width="16" height="16" />
          <span className="italic text-text-font"> {UNAPPROVED_WARNING_MESSAGE} </span>
        </div>
      )}

      <div className="flex justify-end">
        <SecondaryButton
          disabled={
            !demonstrationTypeFormData.demonstrationTypeName ||
            !createdTypes.some(
              (type) =>
                type.tagName.toLowerCase() ===
                demonstrationTypeFormData.demonstrationTypeName.toLowerCase()
            )
          }
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
