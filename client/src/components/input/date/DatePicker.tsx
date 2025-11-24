import React from "react";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  onValueChange?: (value: string) => void;
  inputClassName?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  id,
  name,
  className = "",
  inputClassName = "",
  required,
  onChange,
  onValueChange,
  ...inputProps
}) => {
  const inputId = id ?? name;
  const { min, ...restInputProps } = inputProps;
  const inputMin = min ?? "1900-01-01";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-bold mb-1"
        >
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type="date"
        onChange={handleChange}
        className={`w-full border border-border-fields px-1 py-1 text-sm rounded ${inputClassName}`}
        min={inputMin}
        required={required}
        {...restInputProps}
      />
    </div>
  );
};
