import React, { useState } from "react";

import { Button } from "components/button";
import { Checkbox } from "components/input";
import { InfoIcon } from "components/icons";
import { tw } from "tags/tw";
import { BaseDialog } from "./BaseDialog";

const STYLES = {
  statement: tw`flex items-start gap-2 text-sm text-text-font`,
  acknowledgement: tw`mt-sm`,
};

const ATTESTATION_STATEMENT =
  "By uploading this Budget Neutrality (BN) notebook, I attest the information included " +
  "with this submission is true and accurate to the best of my knowledge.";

const ACKNOWLEDGEMENT_LABEL = "I acknowledge and attest to the statement above.";

export const AttestationDialog: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return (
    <BaseDialog
      name="attestation-dialog"
      title="Attestation Required"
      dialogHasChanges={false}
      onClose={onCancel}
      maxWidthClass="max-w-[600px]"
      actionButton={
        <Button
          name="button-attestation-confirm"
          size="small"
          disabled={!hasAcknowledged}
          onClick={onConfirm}
        >
          Confirm &amp; Upload
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <p className={STYLES.statement}>
          <InfoIcon className="mt-0.5 shrink-0" />
          <span>{ATTESTATION_STATEMENT}</span>
        </p>

        <div className={STYLES.acknowledgement}>
          <Checkbox
            name="attestation-acknowledge"
            label={ACKNOWLEDGEMENT_LABEL}
            checked={hasAcknowledged}
            onChange={(event) => setHasAcknowledged(event.target.checked)}
          />
        </div>
      </div>
    </BaseDialog>
  );
};
