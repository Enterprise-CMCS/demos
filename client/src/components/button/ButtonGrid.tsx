import React from "react";

import { CircleButton } from "./CircleButton";
import { ErrorButton } from "./ErrorButton";
import { Button } from "./Button";
import { SecondaryButton } from "./SecondaryButton";
import { TertiaryButton } from "./TertiaryButton";
import { WarningButton } from "./WarningButton";
import { ButtonProps } from "./BaseButton";
import { SaveIcon, DeleteIcon } from "icons";

const variants = {
  primary: Button,
  secondary: SecondaryButton,
  tertiary: TertiaryButton,
  error: ErrorButton,
  "error-outlined": (props: ButtonProps) => <ErrorButton {...props} isOutlined={true} />,
  warning: WarningButton,
  "warning-outlined": (props: ButtonProps) => <WarningButton {...props} isOutlined={true} />,
};

export const ButtonGrid: React.FC = () => {
  const [allDisabled, setAllDisabled] = React.useState(false);

  const sizes = ["standard", "large"] as const;

  return (
    <div className="overflow-auto text-black">
      <div className="mb-2 flex gap-1">
        <Button name="set-disabled" onClick={() => setAllDisabled((d) => !d)}>
          {allDisabled ? "Enable All" : "Disable All"}
        </Button>
      </div>
      <div className="mb-2 text-lg font-bold text-gray-700">
        <strong>Focus Testing:</strong> Click on a button and use Tab/Shift+Tab to move through the
        elements.
      </div>
      <div className="mb-4">
        <div className="font-bold text-left px-1 py-0.5" tabIndex={-1}>
          Circle Buttons
        </div>
        <div className="flex gap-2 flex-wrap" tabIndex={-1}>
          <CircleButton
            key="circle-save"
            name="test-circle-button-save"
            onClick={() => {}}
            disabled={allDisabled}
            tooltip={allDisabled ? "Enable this button to make changes" : "Save your changes"}
          >
            <SaveIcon />
          </CircleButton>
          <CircleButton
            key="circle-trash"
            size="large"
            name="test-circle-button-trash"
            onClick={() => {}}
            disabled={allDisabled}
            tooltip={allDisabled ? "Enable this button to make changes" : "Delete item"}
          >
            <DeleteIcon />
          </CircleButton>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 items-center max-w-[720px]">
        {/* Header Row */}
        <div className="font-bold text-left px-1 py-0.5" tabIndex={-1}>
          Variant
        </div>
        {sizes.map((size) => (
          <div key={size} className="font-bold text-center px-1 py-0.5" tabIndex={-1}>
            {size.charAt(0).toUpperCase() + size.slice(1)} Button
          </div>
        ))}
        {/* Button Rows */}
        {Object.entries(variants).map(([variantName, VariantButton]) => [
          <div
            key={variantName}
            className="px-1 py-0.5 font-medium text-black text-left"
            tabIndex={-1}
          >
            {variantName}
          </div>,
          ...sizes.map((size) => (
            <div key={`${variantName}-${size}`} className="px-1 py-0.5 text-center" tabIndex={-1}>
              <VariantButton
                className=""
                name={`test-button-${variantName}-${size}`}
                onClick={() => {}}
                size={size}
                disabled={allDisabled}
                tooltip={allDisabled ? "Enable this button to make changes" : "Save your changes"}
              >
                Save
              </VariantButton>
            </div>
          )),
        ])}
      </div>
    </div>
  );
};
