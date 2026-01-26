import React from "react";
import { MinimizeIcon } from "components/icons/Navigation/MinimizeIcon";
export interface CheckboxProps {
  name: string;
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  checked: boolean;
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  name,
  label,
  onChange,
  checked,
  indeterminate = false,
}) => {

  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate && !checked;
    }
  }, [checked, indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
  };

  const showIndeterminate = indeterminate && !checked;
  const classes = `form-checkbox w-[24px] h-[24px] cursor-pointer ${showIndeterminate ? "appearance-none border border-[#0071bc] bg-[#0071bc] hover:bg-[#004F84]" : ""}`;

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span className="relative inline-flex items-center justify-center">
        <input
          ref={checkboxRef}
          id={name}
          name={name}
          data-testid={name}
          type="checkbox"
          className={classes}
          style={{ accentColor: "#0071bc" }}
          checked={checked}
          aria-checked={showIndeterminate ? "mixed" : checked}
          onChange={handleChange}
        />
        {showIndeterminate && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <MinimizeIcon className="text-white"  thickness={2} />
          </span>
        )}
      </span>
      <span>{label}</span>
    </label>
  );
};
