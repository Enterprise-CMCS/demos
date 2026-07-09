import React from "react";

import { SelectUsers } from "components/input/select/SelectUsers";
import { PersonType } from "demos-server";

const ALLOWED_PERSON_TYPES: PersonType[] = ["demos-admin", "demos-cms-user"];

export const CMSOwnerField = ({
  value,
  onSelect,
  isDisabled = false,
}: {
  value: string;
  onSelect: (id: string) => void;
  isDisabled?: boolean;
}) => {
  return (
    <SelectUsers
      label="CMS Owner"
      value={value}
      onSelect={onSelect}
      isRequired
      isDisabled={isDisabled}
      personTypes={ALLOWED_PERSON_TYPES}
    />
  );
};
