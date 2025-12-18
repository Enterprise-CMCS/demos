import { ClearanceLevel } from "demos-server";
import React from "react";

export const ClearanceLevelRadioButtons = ({
  selectedClearanceLevel,
  setSelectedClearanceLevel,
}: {
  selectedClearanceLevel: ClearanceLevel;
  setSelectedClearanceLevel: (clearanceLevel: ClearanceLevel) => void;
}) => (
  <div className="col-span-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="radio-clearance-level"
        value="COMMS Clearance Required"
        checked={selectedClearanceLevel === "COMMS Clearance Required"}
        onChange={(e) => setSelectedClearanceLevel(e.target.value as ClearanceLevel)}
        className="cursor-pointer"
      />
      <span className="text-sm">COMMS Clearance Required</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="radio-clearance-level"
        value="CMS (OSORA) Clearance Required"
        checked={selectedClearanceLevel === "CMS (OSORA) Clearance Required"}
        onChange={(e) => setSelectedClearanceLevel(e.target.value as ClearanceLevel)}
        className="cursor-pointer"
      />
      <span className="text-sm">CMS (OSORA) Clearance Required</span>
    </label>
  </div>
);
