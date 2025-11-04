import React, { useState } from "react";
import { gql } from "graphql-tag";
import { useMutation } from "@apollo/client";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";
import { BaseDialog } from "./BaseDialog";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { TextInput } from "components/input";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      demonstration {
        id
      }
    }
  }
`;

type CreateAmendmentDialogProps = {
  isOpen?: boolean;
  onClose: () => void;
  demonstrationId?: string;
};

type CreateAmendmentFields = {
  state?: string;
  title?: string;
  projectOfficer?: string;
  effectiveDate?: string;
  expirationDate?: string;
  description?: string;
  demonstrationId?: string;
};

export const CreateAmendmentDialog: React.FC<CreateAmendmentDialogProps> = ({
  isOpen = true,
  onClose,
  demonstrationId,
}) => {
  const [amendmentFields, setAmendmentFields] = useState<CreateAmendmentFields>({
    demonstrationId: demonstrationId,
  });

  const [createAmendmentMutation] = useMutation(CREATE_AMENDMENT_MUTATION);

  async function onSubmit() {
    await createAmendmentMutation({
      variables: {
        input: amendmentFields,
      },
      refetchQueries: [
        {
          query: DEMONSTRATION_DETAIL_QUERY,
          variables: { id: demonstrationId },
        },
        {
          query: DEMONSTRATIONS_PAGE_QUERY,
        },
      ],
    });
    onClose();
  }

  return (
    <BaseDialog title="Add Amendment" isOpen={isOpen} onClose={onClose} onSubmit={onSubmit}>
      <form id="create-amendment-form" className="space-y-4">
        <div>
          <AutoCompleteSelect
            label="Demonstration"
            placeholder="Select demonstration"
            isRequired
            isDisabled={Boolean(demonstrationId)}
            options={[]}
            value={amendmentFields.demonstrationId}
            onSelect={(value) =>
              setAmendmentFields({
                ...amendmentFields,
                demonstrationId: value,
              })
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextInput
              name="title"
              label="Amendment Title"
              placeholder="Enter title"
              isRequired
              value={amendmentFields.title}
              onChange={(e) =>
                setAmendmentFields({
                  ...amendmentFields,
                  title: e.target.value,
                })
              }
            />
          </div>
          <div>
            <SelectUSAStates
              label="State/Territory"
              isRequired
              currentState={amendmentFields.state}
              onStateChange={(value) =>
                setAmendmentFields({
                  ...amendmentFields,
                  state: value,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <SelectUsers
              label="Project Officer"
              isRequired
              initialUserId={amendmentFields.projectOfficer}
              onSelect={(value) =>
                setAmendmentFields({
                  ...amendmentFields,
                  projectOfficer: value,
                })
              }
              personTypes={["demos-admin", "demos-cms-user"]}
            />
          </div>

          <div className="flex flex-col gap-sm">
            <label className={LABEL_CLASSES} htmlFor="effective-date">
              Effective Date
            </label>
            <input
              id="effective-date"
              type="date"
              className={DATE_INPUT_CLASSES}
              data-testid="input-effective-date"
              value={amendmentFields.effectiveDate}
              onChange={(e) =>
                setAmendmentFields({
                  ...amendmentFields,
                  effectiveDate: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label className={LABEL_CLASSES} htmlFor="expiration-date">
              Expiration Date
            </label>
            <input
              id="expiration-date"
              type="date"
              className={`${DATE_INPUT_CLASSES}`}
              data-testid="input-expiration-date"
              value={amendmentFields.expirationDate}
              min={amendmentFields.effectiveDate}
              onChange={(e) =>
                setAmendmentFields({
                  ...amendmentFields,
                  effectiveDate: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label className={LABEL_CLASSES} htmlFor="description">
            Amendment Description
          </label>
          <textarea
            id="description"
            placeholder="Enter description"
            className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            data-testid="textarea-description"
            value={amendmentFields.description}
            onChange={(e) =>
              setAmendmentFields({
                ...amendmentFields,
                description: e.target.value,
              })
            }
          />
        </div>
      </form>
    </BaseDialog>
  );
};
