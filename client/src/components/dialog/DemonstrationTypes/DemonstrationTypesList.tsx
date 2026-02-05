import React from "react";
import { DeleteIcon } from "components/icons";
import { formatDate } from "util/formatDate";
import { Tag as DemonstrationTypeName } from "demos-server";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";
import { parseISO } from "date-fns";

export const DemonstrationTypesList = ({
  demonstrationTypes,
  removeDemonstrationType,
}: {
  demonstrationTypes: DemonstrationType[];
  removeDemonstrationType: (demonstrationTypeName: DemonstrationTypeName) => void;
}) => {
  return (
    demonstrationTypes.length > 0 && (
      <div className="flex flex-col gap-1">
        <p className="font-bold">Types to be added ({demonstrationTypes.length})</p>
        <ul className="border border-gray-300 border-b-0">
          {demonstrationTypes.map((demonstrationType) => (
            <li
              key={demonstrationType.demonstrationTypeName}
              className="p-1 border-b border-gray-300 flex justify-between"
            >
              <div>
                <p className="font-bold text-lg">{demonstrationType.demonstrationTypeName}</p>
                <span>
                  Effective: {formatDate(parseISO(demonstrationType.effectiveDate))} &bull; Expires:{" "}
                  {formatDate(parseISO(demonstrationType.expirationDate))}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  className="p-1 cursor-pointer"
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
      </div>
    )
  );
};
