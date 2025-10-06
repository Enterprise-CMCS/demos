import React, { useState } from "react";
import { TextInput } from ".";
import { SelectStates } from "./select/SelectStates";
import { SelectPeople } from "./select/SelectPeople";
import { Select } from "./select/Select";
import { Button } from "components/button";
import { Multiselect } from "./select/Multiselect";
import { State } from "demos-server";

const getValidationMessage = (value: string) => {
  if (value.includes("z")) {
    return "Input must not contain the letter z";
  }
  return "";
};

export const InputSandbox: React.FC = () => {
  const [disabled, setDisabled] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [selectValue, setSelectValue] = useState<string>("");
  const [state, setState] = useState<State["id"]>("");
  const [multiselectValues, setMultiselectValues] = useState<string[]>([]);
  // We'll wire this up to use the current cache user
  const currentUserId = 123;

  return (
    <>
      <div className="flex gap-sm">
        <Button name="set-enabled" onClick={() => setDisabled((d) => !d)}>
          {disabled ? "Enable" : "Disable"}
        </Button>
        <Button name="set-required" onClick={() => setIsRequired((r) => !r)}>
          {isRequired ? "Set Not Required" : "Set Required"}
        </Button>
      </div>
      <TextInput
        name="test"
        label="Label (No Z's allowed)"
        isDisabled={disabled}
        getValidationMessage={getValidationMessage}
        isRequired={isRequired}
        placeholder="Placeholder"
      />
      <div className="mt-3">
        {multiselectValues && (
          <p className="mt-2">You have selected:{multiselectValues.join(", ")}</p>
        )}
        <Multiselect
          options={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3" },
          ]}
          value={multiselectValues}
          label="Autocomplete-Multiselect"
          placeholder="Select options"
          onChange={setMultiselectValues}
          isRequired={isRequired}
          isDisabled={disabled}
        />
      </div>
      <div className="mt-3">
        <SelectStates
          value={state}
          isRequired={isRequired}
          isDisabled={disabled}
          onChange={setState}
        />
      </div>
      <div className="mt-3">
        <SelectPeople
          isRequired={isRequired}
          label="Project Officers (default U ID is 123)"
          isDisabled={disabled}
          onChange={setStatus}
          value={String(currentUserId)}
        />
      </div>
      {status && (
        <p className="mt-2">
          You most recently selected: <strong>{status}</strong>
        </p>
      )}
      <div className="mt-3">
        <Select
          label="Simple Select"
          options={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3" },
          ]}
          value={selectValue}
          onChange={setSelectValue}
        />{" "}
      </div>
      {selectValue && (
        <p className="mt-2">
          You most recently selected: <strong>{selectValue}</strong>
        </p>
      )}
    </>
  );
};
