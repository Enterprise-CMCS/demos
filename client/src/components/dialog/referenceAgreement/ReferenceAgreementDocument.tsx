import { FileIcon, PDFIcon } from "components/icons";
import { ReferenceAgreement } from "demos-server";
import { useDownloadReference } from "hooks/useDownloadReference";
import React from "react";
import { tw } from "tags/tw";
import { formatDateForDisplay } from "util/formatDate";
import { POINT_AND_CLICK_AGREEMENT } from "./pointAndClickAgreement";

const STYLES = {
  fileRow: tw`cursor-pointer bg-surface-secondary border border-border-fields border-l-3 px-2 py-1 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
};

export const ReferenceAgreementDocument: React.FC<{
  agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
}> = ({ agreement }) => {
  const { downloadReferenceAgreement } = useDownloadReference();

  if (agreement.id === POINT_AND_CLICK_AGREEMENT.id) {
    return (
      <a
        className={STYLES.fileRow}
        href={POINT_AND_CLICK_AGREEMENT.url}
        download={POINT_AND_CLICK_AGREEMENT.fileName}
        aria-label={POINT_AND_CLICK_AGREEMENT.name}
      >
        <div className="flex items-center gap-1">
          <FileIcon className="h-2 w-2" />
          <div className="font-medium">{POINT_AND_CLICK_AGREEMENT.name}</div>
        </div>
      </a>
    );
  }

  return (
    <button
      key={agreement.id}
      className={STYLES.fileRow}
      onClick={() => downloadReferenceAgreement({ id: agreement.id })}
    >
      <div className="flex items-center gap-1">
        <PDFIcon className="h-2 w-2 text-red-600" />
        <div className="font-medium">{agreement.name}</div>
        <div className={STYLES.fileMeta}>{formatDateForDisplay(agreement.createdAt)}</div>
      </div>
    </button>
  );
};
