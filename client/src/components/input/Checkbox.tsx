import React from "react";
export interface CheckboxProps {
  name: string;
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  checked: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ name, label, onChange, checked }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        id={name}
        name={name}
        data-testid={name}
        type="checkbox"
        className="form-checkbox w-[24px] h-[24px] cursor-pointer text-action"
        style={{ accentColor: "#0071bc" }}
        checked={checked}
        onChange={handleChange}
      />
      <span>{label}</span>
    </label>
  );
};
