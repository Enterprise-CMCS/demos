import React, { forwardRef, useState } from "react";
import Switch from "react-switch";
import { tw } from "tags/tw";

const TRACK_HEIGHT = 20;
const TRACK_WIDTH = 48;
const HANDLE_DIAMETER = 30;
const OFF_TRACK_COLOR = "#D1D5DB"; // gray-300
const ON_TRACK_COLOR = "#9CA3AF"; // gray-400
const HANDLE_COLOR = "#E5E7EB"; // gray-200

export type ToggleSwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

const CONTAINER = tw`inline-flex items-center`;

export const ToggleSwitch = forwardRef<HTMLLabelElement, ToggleSwitchProps>(
  ({ checked, defaultChecked, onChange, disabled, className, ariaLabel }, ref) => {
    const isControlled = typeof checked === "boolean";
    const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked ?? false);
    const value = isControlled ? checked! : internalChecked;

    const handleChange = (next: boolean) => {
      if (!isControlled) {
        setInternalChecked(next);
      }
      onChange?.(next);
    };

    return (
      <label ref={ref} className={`${CONTAINER} ${className ?? ""}`}>
        <Switch
          checked={value}
          onChange={handleChange}
          disabled={disabled}
          height={TRACK_HEIGHT}
          width={TRACK_WIDTH}
          handleDiameter={HANDLE_DIAMETER}
          onColor={ON_TRACK_COLOR}
          offColor={OFF_TRACK_COLOR}
          onHandleColor={HANDLE_COLOR}
          offHandleColor={HANDLE_COLOR}
          uncheckedIcon={false}
          checkedIcon={false}
          boxShadow="0px 1px 5px rgba(0, 0, 0, 0.1)"
          activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.08)"
          aria-label={ariaLabel ?? "Toggle"}
        />
      </label>
    );
  }
);

ToggleSwitch.displayName = "ToggleSwitch";
