import React from "react";

import { SecondaryButton } from "components/button/SecondaryButton";
import { tw } from "tags/tw";
import { ErrorButton } from "components/button";

interface BaseModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showCancelConfirm?: boolean;
  setShowCancelConfirm?: (val: boolean) => void;
  maxWidthClass?: string;
  hideHeader?: boolean;
}

const OVERLAY = tw`fixed inset-0 z-[11] flex items-center justify-center bg-black/40`;
const CONTAINER = tw`bg-surface-white text-text-font w-full rounded shadow-md p-md relative max-h-[85vh] overflow-y-auto space-y-sm`;
const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font`;
const TITLE = tw`text-[18px] font-bold mb-xs`;
const HR = tw`border-border-rules my-sm`;
const CONFIRMATION_OVERLAY = tw`fixed inset-0 z-[12] flex items-center justify-center bg-black/40`;
const CONFIRMATION_BOX = tw`bg-surface-white border border-border-rules rounded p-2 w-[400px] shadow-md text-center`;

export const BaseModal: React.FC<BaseModalProps> = ({
  title,
  onClose,
  children,
  actions,
  showCancelConfirm = false,
  setShowCancelConfirm,
  maxWidthClass = "max-w-[720px]",
  hideHeader = false,
}) => {
  return (
    <>
      <div className={OVERLAY}>
        <div className={`${CONTAINER} ${maxWidthClass}`}>
          {!hideHeader && (
            <>
              <button
                onClick={() => (setShowCancelConfirm ? setShowCancelConfirm(true) : onClose())}
                className={CLOSE_BUTTON}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2 className={TITLE}>{title}</h2>
              <hr className={HR} />
            </>
          )}

          {children}

          {actions && (
            <>
              <hr className={HR} />
              <div className="flex justify-end gap-sm">{actions}</div>
            </>
          )}
        </div>
      </div>

      {showCancelConfirm && setShowCancelConfirm && (
        <div className={CONFIRMATION_OVERLAY}>
          <div className={CONFIRMATION_BOX}>
            <p className="text-sm font-bold mb-sm text-text-font">
              Are you sure you want to cancel?
            </p>
            <div className="flex justify-center gap-sm">
              <SecondaryButton
                name="cancel-confirm-no"
                size="small"
                onClick={() => setShowCancelConfirm(false)}
              >
                No
              </SecondaryButton>
              <ErrorButton
                name="cancel-confirm-yes"
                isOutlined={true}
                size="small"
                onClick={onClose}
              >
                Yes
              </ErrorButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
