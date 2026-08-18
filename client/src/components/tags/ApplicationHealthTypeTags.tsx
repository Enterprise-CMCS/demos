import React from "react";

import { SecondaryButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { tw } from "tags/tw";
import { TagChip } from "./TagChip";
import { Tag, TagName } from "demos-server";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { SparklyUIPathTags } from "./SparklyUIPathTags";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

const STYLES = {
  stepThree: tw`font-bold uppercase tracking-wide text-[#242424] mb-2`,
  helper: tw`text-sm text-text-placeholder mb-1`,
  tagList: tw`flex flex-wrap items-center gap-1 mt-2`,
};

export const GET_APPLICATION_TAG_OPTIONS: TypedDocumentNode<
  {
    applicationTagOptions: Tag[];
  },
  Record<string, never>
> = gql`
  query GetApplicationTagOptions {
    applicationTagOptions {
      tagName
      approvalStatus
    }
  }
`;

export interface ApplicationHealthTypeTagsProps {
  applicationId: string;
  selectedTags: Tag[];
  suggestedTags?: TagName[];
  onRemoveTag: (tag: string) => void;
  onAcceptSuggestedTag?: (tag: TagName) => void;
  isApplyingSuggestedTag?: boolean;
}

export const ApplicationHealthTypeTags = ({
  applicationId,
  selectedTags,
  suggestedTags = [],
  onRemoveTag,
  onAcceptSuggestedTag,
  isApplyingSuggestedTag = false,
}: ApplicationHealthTypeTagsProps) => {
  const { showApplyTagsDialog } = useDialog();
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = isReadonly(currentUser);

  const { data, loading, error } = useQuery(GET_APPLICATION_TAG_OPTIONS, {
    // retreive demos types tags between demonstration/extension/amendment workflows.
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  if (loading) return <div>Loading tags...</div>;
  if (error || !data) return <div>Error loading tags.</div>;

  const handleApplyClick = () => {
    showApplyTagsDialog(
      applicationId,
      [...data.applicationTagOptions].sort((a, b) => a.tagName.localeCompare(b.tagName)),
      selectedTags
    );
  };

  const handleRemoveTag = (tag: string) => {
    if (isReadonlyUser) {
      return null;
    } else {
      onRemoveTag(tag);
    }
  };

  return (
    <>
      <div className={STYLES.tagList}>
        {selectedTags.map((tag) => (
          <TagChip key={tag.tagName} tag={tag} onRemoveTag={handleRemoveTag} />
        ))}
        <SecondaryButton
          isHidden={isReadonlyUser}
          size="small"
          name="button-apply-application-tags"
          onClick={handleApplyClick}
        >
          Apply Tags
        </SecondaryButton>
      </div>
      {onAcceptSuggestedTag && (
        <SparklyUIPathTags
          selectedTags={selectedTags}
          suggestedTags={suggestedTags}
          onAcceptSuggestion={onAcceptSuggestedTag}
          isApplyingSuggestion={isApplyingSuggestedTag}
        />
      )}
    </>
  );
};
