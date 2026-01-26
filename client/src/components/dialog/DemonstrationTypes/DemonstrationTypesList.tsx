import React from "react";
import { DeleteIcon } from "components/icons";
import { formatDate } from "util/formatDate";
import { DemonstrationType } from "./useApplyDemonstrationTypesDialogData";
import { Tag as DemonstrationTypeName } from "demos-server";

export const DemonstrationTypesList = ({
  demonstrationTypes,
  removeDemonstrationType,
}: {
  demonstrationTypes: DemonstrationType[];
  removeDemonstrationType: (demonstrationTypeName: DemonstrationTypeName) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">Types to be added ({demonstrationTypes.length})</p>
      {demonstrationTypes.length === 0 && <p>No demonstration types added.</p>}
      {demonstrationTypes.length > 0 && (
        <ul className="border border-gray-300 border-b-0">
          {demonstrationTypes.map((demonstrationType) => (
            <li
              key={demonstrationType.demonstrationTypeName}
              className="p-1 border-b border-gray-300 flex justify-between"
            >
              <div>
                <p className="font-bold text-lg">{demonstrationType.demonstrationTypeName}</p>
                <span>
                  Effective: {formatDate(demonstrationType.effectiveDate)} &bull; Expires:{" "}
                  {formatDate(demonstrationType.expirationDate)}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  className="p-1"
                  onClick={() => removeDemonstrationType(demonstrationType.demonstrationTypeName)}
                  name="remove-type"
                >
                  <DeleteIcon
                    height="20px"
                    width="20px"
                    fill="currentColor"
                    className="text-gray-700"
                  />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
