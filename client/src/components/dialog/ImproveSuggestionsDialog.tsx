import React, { useState } from "react";
import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { useToast } from "components/toast";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { TagSelector } from "components/tags/TagSelector";
import { useApplicationTagOptions } from "components/tags/useApplicationTagOptions";
import { Application, Tag, TagName } from "demos-server";

export const REPLACE_APPLICATION_TAG_SUGGESTION_MUTATION: TypedDocumentNode<
  { replaceApplicationTagSuggestion: Application },
  { applicationId: string; value: TagName; newValue: TagName }
> = gql`
  mutation ReplaceApplicationTagSuggestion(
    $applicationId: ID!
    $value: String!
    $newValue: String!
  ) {
    replaceApplicationTagSuggestion(
      applicationId: $applicationId
      value: $value
      newValue: $newValue
    ) {
      ... on Demonstration {
        id
        tags {
          tagName
          approvalStatus
        }
        suggestedApplicationTags
      }
      ... on Amendment {
        id
        tags {
          tagName
          approvalStatus
        }
        suggestedApplicationTags
      }
      ... on Extension {
        id
        tags {
          tagName
          approvalStatus
        }
        suggestedApplicationTags
      }
    }
  }
`;

export const ImproveSuggestionsDialog = ({
  applicationId,
  tagName,
  onBack,
  onClose,
}: {
  applicationId: string;
  tagName: TagName;
  onBack: () => void;
  onClose: () => void;
}) => {
  const { showSuccess } = useToast();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const { data, loading, error } = useApplicationTagOptions();

  const [replaceSuggestion, { loading: saving }] = useMutation(
    REPLACE_APPLICATION_TAG_SUGGESTION_MUTATION,
    { refetchQueries: "active", awaitRefetchQueries: true }
  );

  const handleConfirm = async () => {
    const newValue = selectedTags[0].tagName;
    await replaceSuggestion({ variables: { applicationId, value: tagName, newValue } });
    onClose();
    showSuccess(`Replaced suggested tag with '${newValue}'`);
  };

  return (
    <BaseDialog
      name="improve-suggestions-dialog"
      title="Improve Suggestions"
      onClose={onClose}
      dialogHasChanges={false}
      cancelButtonIsDisabled={saving}
      maxWidthClass="max-w-[850px]"
    >
      <fieldset disabled={saving} className="contents">
        <p className="text-lg text-text-placeholder">
          Search for an alternate tag suggestion for &apos;<strong>{tagName}</strong>&apos;:
        </p>

        {loading ? (
          <p role="status">Loading demonstration types...</p>
        ) : error || !data ? (
          <p role="alert">
            Failed to load demonstration types. Please close the dialog and try again.
          </p>
        ) : (
          <TagSelector
            allTags={[...data.applicationTagOptions].sort((a, b) =>
              a.tagName.localeCompare(b.tagName)
            )}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            selectionMode="single"
          />
        )}

        <div className="flex flex-col gap-1">
          <p className="text-md font-semibold">Selected Tag</p>
          <div className="flex flex-wrap gap-1 min-h-8">
            {selectedTags.map((tag) => (
              <TagChip key={tag.tagName} tag={tag} onRemoveTag={() => setSelectedTags([])} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <SecondaryButton name="button-back-to-confirm-tags" onClick={onBack}>
            Back
          </SecondaryButton>
          <Button
            name="button-confirm-suggestion"
            disabled={saving || selectedTags.length === 0}
            onClick={handleConfirm}
          >
            Confirm Suggestion
          </Button>
        </div>
      </fieldset>
    </BaseDialog>
  );
};
