// components/inputs/ToggleSwitch.tsx
import React, { forwardRef, useMemo, useState } from "react";
import Switch from "react-switch";
import { tw } from "tags/tw";

type Size = "sm" | "md" | "lg";

export type ToggleSwitchProps = {
  checked?: boolean;            // controlled
  defaultChecked?: boolean;     // uncontrolled
  onChange?: (v: boolean) => void | Promise<void>;
  disabled?: boolean;
  size?: Size;

  // a11y
  ariaLabel?: string;           // use when no visible label
  label?: React.ReactNode;      // optional visible label
  ariaLabelOnly?: boolean;

  // style hooks (defaults mimic the screenshot)
  onColor?: string;             // track color ON
  offColor?: string;            // track color OFF
  onHandleColor?: string;       // knob ON
  offHandleColor?: string;      // knob OFF
  className?: string;
};

const WRAP = tw`inline-flex items-center gap-2`;

export const ToggleSwitch = forwardRef<HTMLLabelElement, ToggleSwitchProps>(
  (
    {
      checked,
      defaultChecked,
      onChange,
      disabled,
      size = "sm",
      ariaLabel,
      label,
      ariaLabelOnly = true,
      onColor = "var(--switch-on, #2563eb)", // brand blue on
      offColor = "var(--switch-off, #b4b8bf)", // neutral gray off
      onHandleColor = "var(--switch-handle, #eef2f7)", // light knob
      offHandleColor = "var(--switch-handle, #eef2f7)",
      className,
    },
    _ref
  ) => {
    const isControlled = typeof checked === "boolean";
    const [internal, setInternal] = useState<boolean>(defaultChecked ?? false);
    const value = isControlled ? checked! : internal;

    const dims = useMemo(() => {
      switch (size) {
        case "lg": return { height: 28, width: 56, handle: 24 };
        case "md": return { height: 22, width: 44, handle: 18 };
        case "sm":
        default:   return { height: 20, width: 40, handle: 18 }; // compact like screenshot
      }
    }, [size]);

    const handleChange = (next: boolean) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    };

    const ariaProps =
      ariaLabelOnly || !label
        ? { "aria-label": ariaLabel ?? "Toggle" }
        : {};

    return (
      <label className={`${WRAP} ${className ?? ""}`} ref={_ref}>
        {!ariaLabelOnly && label ? (
          <span className={tw`text-sm select-none`}>{label}</span>
        ) : null}

        <Switch
          checked={value}
          onChange={handleChange}
          disabled={disabled}
          height={dims.height}
          width={dims.width}
          handleDiameter={dims.handle}
          onColor={onColor}
          offColor={offColor}
          onHandleColor={onHandleColor}
          offHandleColor={offHandleColor}
          uncheckedIcon={false}
          checkedIcon={false}
          boxShadow="0 1px 0 rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.06) inset"
          activeBoxShadow="0 0 0 3px var(--switch-ring, rgba(59,130,246,.25))"
          {...ariaProps}
        />
      </label>
    );
  }
);

ToggleSwitch.displayName = "ToggleSwitch";
