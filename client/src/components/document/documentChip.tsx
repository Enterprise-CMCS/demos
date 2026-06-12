import React from "react";
import { ExitIcon, FileIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDateForDisplay } from "util/formatDate";
import { DocumentType } from "demos-server-constants";

const abbreviateLongFilename = (str: string): string => {
  const maxFilenameDisplayLength = 60;

  if (str.length <= maxFilenameDisplayLength) return str;
  const half = Math.floor((maxFilenameDisplayLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

const STYLES = {
  chipContainer: tw`w-full border border-border-fields border-l-4 rounded flex items-stretch mt-sm`,
  contentContainer: tw`flex flex-1 min-w-0 gap-1 items-center text-left px-sm py-1`,
  previewLink: tw`hover:bg-surface-hover rounded-l`,
  fileIcon: tw`w-[24px] h-[24px] text-brand`,
  titleContainer: tw`flex flex-col justify-center`,
  name: tw`font-medium`,
  subtext: tw`text-xs text-text-placeholder mt-0.5`,
  exitButton: tw`shrink-0 flex items-center cursor-pointer hover:bg-red-50 rounded-r`,
  exitIconContainer: tw`border-l border-border-fields px-1 h-[50%] flex items-center`,
  exitIcon: tw`w-[16px] h-[16px]`,
};

export const DocumentChip: React.FC<{
  document: {
    id?: string;
    name: string;
    documentType?: DocumentType;
    createdAt?: Date;
  };
  onRemove: () => void;
}> = ({ document, onRemove }) => {
  const content = (
    <>
      <FileIcon className={STYLES.fileIcon} />
      <div className={STYLES.titleContainer}>
        <span className={STYLES.name} title={document.name}>
          {abbreviateLongFilename(document.name)}
        </span>
        {document.createdAt && document.documentType && (
          <span className={STYLES.subtext}>
            {formatDateForDisplay(document.createdAt)}
            {` • ${document.documentType}`}
          </span>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className={STYLES.chipContainer}>
        {document.id ? (
          <a
            className={`${STYLES.contentContainer} ${STYLES.previewLink}`}
            href={`/document/${document.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          <div className={STYLES.contentContainer}>{content}</div>
        )}

        <button
          className={STYLES.exitButton}
          onClick={onRemove}
          aria-label={`Delete ${document.name}`}
          title={`Delete ${document.name}`}
          type="button"
        >
          <div className={STYLES.exitIconContainer}>
            <ExitIcon className={STYLES.exitIcon} />
          </div>
        </button>
      </div>
    </>
  );
};
