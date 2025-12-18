import React from "react";

export const Radio = ({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="col-span-4">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`radio-${name}`}
            value={option}
            checked={value === option}
            onChange={(e) => onChange(e.target.value)}
            className="cursor-pointer"
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
    </div>
  );
};
