import React from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { SparklyIcon } from "components/icons";
import { TagChip } from "components/tags/TagChip";
import type { SuggestedApplicationTagSource, TagName } from "demos-server";
import { tw } from "tags/tw";

const STYLES = {
  intro: tw`text-lg text-text-placeholder`,
  content: tw`space-y-2`,
  sourceTitle: tw`text-lg font-semibold text-text-font`,
  sourcePreview: tw`border-l-4 border-action bg-surface-secondary px-1 py-1 text-text-placeholder italic`,
  sourceMeta: tw`mt-1 text-right text-sm italic text-text-placeholder`,
  footer: tw`flex items-center justify-between`,
  rightActions: tw`flex gap-3`,
  removeButton: tw`font-semibold text-error hover:text-error-dark focus:outline-none focus:ring-2 focus:ring-error-lightest`,
};

type ConfirmSuggestedSparklyTagDialogProps = {
  tagName: TagName;
  sources?: SuggestedApplicationTagSource[];
  onClose: () => void;
  onConfirm: (tagName: TagName) => void;
  onRemove: (tagName: TagName) => void;
  isSubmitting?: boolean;
};

const formatSourceMeta = (source: SuggestedApplicationTagSource) => {
  const page =
    source.startPageNo === source.endPageNo
      ? `Page ${source.startPageNo}`
      : `Pages ${source.startPageNo}-${source.endPageNo}`;

  return `(Found in ${source.documentName}, ${page}, Position ${source.textStartIndex}/${source.textEndIndex})`;
};

// Apparently NOT part of DEMOS-1638
const SourcePassagePdfPreviewPlaceholder = ({
  tagName,
  sources,
}: {
  tagName: TagName;
  sources: SuggestedApplicationTagSource[];
}) => (
  <div>
    <h3 className={STYLES.sourceTitle}>Source Passage</h3>
    <div className={STYLES.sourcePreview}>
      &quot;...This specifically references {tagName} in the application text...&quot;
    </div>
    {sources.length > 0 ? (
      sources.map((source) => (
        <div
          key={`${source.documentId}-${source.startPageNo}-${source.textStartIndex}`}
          className={STYLES.sourceMeta}
        >
          {formatSourceMeta(source)}
        </div>
      ))
    ) : (
      <div className={STYLES.sourceMeta}>(Source location unavailable)</div>
    )}
  </div>
);

export const ConfirmSuggestedSparklyTagDialog = ({
  tagName,
  sources = [],
  onClose,
  onConfirm,
  onRemove,
  isSubmitting = false,
}: ConfirmSuggestedSparklyTagDialogProps) => {
  return (
    <BaseDialog
      name="confirm-suggested-sparkly-tag-dialog"
      title="Confirm Tags from DEMOS AI"
      onClose={onClose}
      dialogHasChanges={false}
      maxWidthClass="max-w-[850px]"
    >
      <div className={STYLES.content}>
        <p className={STYLES.intro}>
          DEMOS AI identified the following tag based on the application text:
        </p>

        <div>
          <TagChip
            tag={{ tagName, approvalStatus: "Approved" }}
            variant="suggestion"
            icon={<SparklyIcon label="Suggested by DEMOS AI" className="shrink-0" />}
          />
        </div>

        <SourcePassagePdfPreviewPlaceholder tagName={tagName} sources={sources} />

        <div className={STYLES.footer}>
          <button
            type="button"
            className={STYLES.removeButton}
            onClick={() => onRemove(tagName)}
            disabled={isSubmitting}
          >
            Remove
          </button>
          <div className={STYLES.rightActions}>
            <SecondaryButton
              name="button-improve-suggested-tag"
              onClick={() => {
                console.log("Thanks for pressing me. But i don't work yet. :-)");
              }}
            >
              Improve this Suggestion
            </SecondaryButton>
            <Button
              name="button-confirm-suggested-tag"
              onClick={() => onConfirm(tagName)}
              disabled={isSubmitting}
            >
              Confirm Tag
            </Button>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};
