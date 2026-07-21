import React from "react";
import { DeleteIcon } from "components/icons";
import { formatDateForDisplay } from "util/formatDate";
import { TagName } from "demos-server";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";
import { parseISO } from "date-fns";
import { CHIP_DEMONSTRATION_TYPE_TAG_NAME } from "demos-server-constants";
import { Notice } from "components/notice";

export const DemonstrationTypesList = ({
  demonstrationTypes,
  removeDemonstrationType,
}: {
  demonstrationTypes: DemonstrationType[];
  removeDemonstrationType: (demonstrationTypeName: TagName) => void;
}) => {
  const includesChipType = demonstrationTypes.some(
    (demonstrationType) =>
      demonstrationType.demonstrationTypeName === CHIP_DEMONSTRATION_TYPE_TAG_NAME
  );
  return (
    demonstrationTypes.length > 0 && (
      <div className="flex flex-col gap-1">
        <p className="font-bold">Types to be added ({demonstrationTypes.length})</p>
        <ul className="border border-gray-300 border-b-0 max-h-[40vh] overflow-y-auto">
          {demonstrationTypes.map((demonstrationType) => (
            <li
              key={demonstrationType.demonstrationTypeName}
              className="p-1 border-b border-gray-300 flex justify-between"
            >
              <div>
                <p className="font-bold text-lg">
                  {demonstrationType.demonstrationTypeName}
                  {demonstrationType.approvalStatus === "Unapproved" && " (Unapproved)"}
                </p>
                <span>
                  Effective: {formatDateForDisplay(parseISO(demonstrationType.effectiveDate))}{" "}
                  &bull; Expires: {formatDateForDisplay(parseISO(demonstrationType.expirationDate))}
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
        {includesChipType && (
          <Notice
            title="Chip ID Generation"
            variant="warning"
            description={
              <>
                By adding <span className="font-bold">CHIP Type</span>, DEMOS will generate a CHIP
                ID for the Demonstration.
              </>
            }
          />
        )}
      </div>
    )
  );
};
