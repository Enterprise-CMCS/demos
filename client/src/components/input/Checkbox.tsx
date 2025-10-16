import React, { useState } from "react";
export interface CheckboxProps {
  name: string;
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultChecked?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  name,
  label,
  onChange,
  defaultChecked = false,
}) => {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    onChange?.(e);
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        id={name}
        name={name}
        data-testid={name}
        type="checkbox"
        className="w-[24px] h-[24px] cursor-pointer"
        checked={checked}
        onChange={handleChange}
      />
      <span>{label}</span>
    </label>
  );
};
