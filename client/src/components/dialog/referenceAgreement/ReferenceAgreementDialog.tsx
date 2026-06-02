import React from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { tw } from "tags/tw";
import { Checkbox } from "components/input";
import { useDownloadReference } from "hooks/useDownloadReference";
import { ReferenceAgreementDocument } from "./ReferenceAgreementDocument";
import { Reference, ReferenceAgreement } from "demos-server";

const STYLES = {
  termsCheckbox: tw`flex items-center p-1 cursor-pointer`,
};

export const ReferenceAgreementDialog = ({
  reference,
}: {
  reference: Pick<Reference, "id"> & {
    agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
  };
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
          onClick={() => {
            downloadReference({
              id: reference.id,
              acceptedAgreementId: reference.agreement.id,
            });
            closeDialog();
          }}
        >
          Download
        </Button>
      }
    >
      <>
        <p data-testid="reference-agreement-instructions">
          View the demonstration type and then accept and download the technical specifications of
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
