import React from "react";

import { CircleButton } from "./CircleButton";
import { ErrorButton } from "./ErrorButton";
import { ErrorOutlinedButton } from "./ErrorOutlinedButton";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { TertiaryButton } from "./TertiaryButton";
import { WarningButton } from "./WarningButton";
import { WarningOutlinedButton } from "./WarningOutlinedButton";

const variants = {
  primary: PrimaryButton,
  secondary: SecondaryButton,
  tertiary: TertiaryButton,
  error: ErrorButton,
  "error-outlined": ErrorOutlinedButton,
  warning: WarningButton,
  "warning-outlined": WarningOutlinedButton,
};

const sizes = ["standard", "large"] as const;
const states = ["Default", "Hover", "Focus", "Disabled"] as const;

export const ButtonGrid: React.FC = () => {
  return (
    <div className="overflow-auto text-sm text-black">
      <table className="border-collapse w-full">
        <thead>
          <tr>
            <th className="p-2"></th>
            {sizes.map((size) => (
              <th key={size} colSpan={4} className="text-center text-black p-2">
                {size === "standard"
                  ? "Standard Button Size"
                  : "Large Button Size"}
              </th>
            ))}
            <th colSpan={4} className="text-center text-black p-2">
              Circular Buttons
            </th>
          </tr>
          <tr>
            <th className="p-2 text-left">Variant</th>
            {sizes.flatMap(() =>
              states.map((state) => (
                <th key={state} className="p-2 text-center text-black">
                  {state}
                </th>
              ))
            )}
            {states.map((state) => (
              <th
                key={`circle-${state}`}
                className="p-2 text-center text-black"
              >
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(variants).map(([variantName, VariantButton]) => (
            <tr key={variantName}>
              <td className="p-2 font-medium text-black">{variantName}</td>
              {sizes.flatMap((size) =>
                states.map((state) => (
                  <td
                    key={`${variantName}-${size}-${state}`}
                    className="p-2 text-center"
                  >
                    <VariantButton
                      size={size}
                      disabled={state === "Disabled"}
                      className={
                        state === "Hover"
                          ? "hover:scale-105"
                          : state === "Focus"
                            ? "ring-2 ring-offset-2 ring-blue-500"
                            : ""
                      }
                    >
                      Save
                    </VariantButton>
                  </td>
                ))
              )}
              {states.map((state) => (
                <td key={`circle-${state}`} className="p-2 text-center">
                  <CircleButton
                    size="standard"
                    disabled={state === "Disabled"}
                    className={
                      state === "Hover"
                        ? "hover:scale-105"
                        : state === "Focus"
                          ? "ring-2 ring-offset-2 ring-blue-500"
                          : ""
                    }
                  >
                    Save
                  </CircleButton>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
