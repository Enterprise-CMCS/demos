import React from "react";

import { SecondaryButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { tw } from "tags/tw";
import { TagChip } from "./TagChip";
import { Tag } from "demos-server";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";

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

export interface DemonstrationHealthTypeTagsProps {
  demonstrationId: string;
  selectedTags: Tag[];
  title: string;
  description?: string;
  onRemoveTag: (tag: string) => void;
}
// We could make this name more generic for reuse.
export const DemonstrationHealthTypeTags = ({
  demonstrationId,
  selectedTags,
  title,
  description,
  onRemoveTag,
}: DemonstrationHealthTypeTagsProps) => {
  const { showApplyTagsDialog } = useDialog();

  const { data, loading, error } = useQuery(GET_APPLICATION_TAG_OPTIONS);

  if (loading) return <div>Loading tags...</div>;
  if (error || !data) return <div>Error loading tags.</div>;

  const handleApplyClick = () => {
    showApplyTagsDialog(
      demonstrationId,
      [...data.applicationTagOptions].sort((a, b) => a.tagName.localeCompare(b.tagName)),
      selectedTags
    );
  };

  return (
    <div aria-labelledby="state-application-tags-title">
      <h4 id="state-application-tags-title" className={STYLES.stepThree}>
        {title}
      </h4>
      {description && description.trim() !== "" && <p className={STYLES.helper}>{description}</p>}
      <div className={STYLES.tagList}>
        {selectedTags.map((tag) => (
          <TagChip key={tag.tagName} tag={tag} onRemoveTag={onRemoveTag} />
        ))}
        <SecondaryButton
          size="small"
          name="button-apply-application-tags"
          onClick={handleApplyClick}
        >
          Apply Tags
        </SecondaryButton>
      </div>
    </div>
  );
};
