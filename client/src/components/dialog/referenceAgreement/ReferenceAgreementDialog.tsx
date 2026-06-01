import React from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { Reference, ReferenceAgreement } from "components/table/tables/ReferencesTable";
import { tw } from "tags/tw";
import { PDFIcon } from "components/icons";
import { Checkbox } from "components/input";
import { useDownloadReference } from "./useDownloadReference";

const STYLES = {
  fileRow: tw`cursor-pointer bg-surface-secondary border border-border-fields border-l-3 px-2 py-1 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
  termsCheckbox: tw`flex items-center p-1 cursor-pointer`,
};

export const ReferenceAgreementDocument: React.FC<{ agreement: ReferenceAgreement }> = ({
  agreement,
}) => {
  const { downloadReferenceAgreement } = useDownloadReference();

  return (
    <button
      key={agreement.id}
      className={STYLES.fileRow}
      onClick={() => downloadReferenceAgreement({ id: agreement.id })}
    >
      <div className="flex items-center gap-1">
        <PDFIcon className="h-2 w-2 text-red-600" />
        <div className="font-medium">{agreement.name}</div>
        <div className={STYLES.fileMeta}>{agreement.createdAt}</div>
      </div>
    </button>
  );
};

export const ReferenceAgreementDialog = ({
  reference,
}: {
  reference: Pick<Reference, "id"> & { agreement: ReferenceAgreement };
}) => {
  const { closeDialog } = useDialog();
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const { downloadReference } = useDownloadReference();

  return (
    <BaseDialog
      title="Point and Click Agreement"
      onClose={closeDialog}
      maxWidthClass="max-w-[600px]"
      dialogHasChanges={false}
      actionButton={
        <Button
          disabled={!termsAccepted}
          name={"button-download-reference"}
          onClick={() =>
            downloadReference({
              id: reference.id,
              acceptedAgreementId: reference.agreement.id,
            })
          }
        >
          Download
        </Button>
      }
    >
      <>
        <p>
          Void the demonstration type and then accept and download the technical specifications of
          the National Stewards Terms and Conditions &quot;Point and Click&quot; Agreement below
        </p>
        <ReferenceAgreementDocument agreement={reference.agreement} />
        <label className={STYLES.termsCheckbox}>
          <Checkbox
            name="checkbox-accept-terms"
            checked={termsAccepted}
            onChange={() => setTermsAccepted((prev) => !prev)}
          />
          <span className="text-sm text-text-font">I accept the terms</span>
        </label>
      </>
    </BaseDialog>
  );
};
