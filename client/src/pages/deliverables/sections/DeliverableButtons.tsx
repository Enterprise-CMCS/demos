import React from "react";
import { SecondaryButton, TertiaryButton } from "components/button";

export const REFERENCES_BUTTON_NAME = "button-references";
export const REQUEST_EXTENSION_BUTTON_NAME = "button-request-extension";

export const DeliverableButtons = () => {
  return (
    <div className="flex gap-2">
      <TertiaryButton name={REFERENCES_BUTTON_NAME}>References</TertiaryButton>
      <SecondaryButton name={REQUEST_EXTENSION_BUTTON_NAME}>Request Extension</SecondaryButton>
    </div>
  );
};
