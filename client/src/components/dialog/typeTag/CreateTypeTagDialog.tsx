import React, { useState } from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { CreateDemonstrationTypesList } from "./createTypeTag/CreateTypeTagList";
import { CreateDemonstrationTypesForm } from "./createTypeTag/CreateTypeTagForm";
import { Button } from "components/button";
import { TagName, TagStatus } from "demos-server";
import { gql, TypedDocumentNode } from "@apollo/client/core";
import { useMutation } from "@apollo/client";
import { useToast } from "components";
import { GET_DEMONSTRATION_TYPE_USAGE_QUERY } from "components/table/tables/DemonstrationTypeUsageTable";

export type NewDemonstrationType = {
  demonstrationTypeName: TagName;
  approvalStatus: TagStatus;
};

export const CREATE_TYPE_TAG_MUTATION: TypedDocumentNode<
  { createTags: { tagName: TagName; approvalStatus: TagStatus }[] },
  { tagNames: TagName[] }
> = gql`
  mutation createTags($tagNames: [TagName!]!) {
    createTags(tagNames: $tagNames) {
      tagName
      approvalStatus
    }
  }
`;

export const CreateTypeTagDialog = () => {
  const { closeDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const [createTags] = useMutation(CREATE_TYPE_TAG_MUTATION);

  const [demonstrationTypes, setDemonstrationTypes] = useState<
    NewDemonstrationType[]
  >([]);

  const handleSave = async () => {
    closeDialog();
    try {
      await createTags({
        variables: {
          tagNames: demonstrationTypes.map((type) => type.demonstrationTypeName),
        },
        refetchQueries: [GET_DEMONSTRATION_TYPE_USAGE_QUERY],
      });
      showSuccess("Successfully created type/tag(s)");
    } catch {
      showError("Failed to create type/tag(s)");
    }
  };

  return (
    <BaseDialog
      title="Create New Tag/Type(s)"
      onClose={closeDialog}
      dialogHasChanges={demonstrationTypes.length > 0}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name="button-save-demonstration-types"
          disabled={!demonstrationTypes.length}
          onClick={handleSave}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <CreateDemonstrationTypesForm
          demonstrationTypeNames={demonstrationTypes.map(
            (type) => type.demonstrationTypeName
          )}
          addDemonstrationType={(demonstrationType) =>
            setDemonstrationTypes((prev) => [...prev, demonstrationType])
          }
        />

        <CreateDemonstrationTypesList
          demonstrationTypes={demonstrationTypes}
          removeDemonstrationType={(demonstrationTypeName) =>
            setDemonstrationTypes((prev) =>
              prev.filter(
                (demonstrationType) =>
                  demonstrationType.demonstrationTypeName !==
                  demonstrationTypeName
              )
            )
          }
        />
      </div>
    </BaseDialog>
  );
};
