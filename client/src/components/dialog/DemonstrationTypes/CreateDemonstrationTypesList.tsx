import React from "react";
import { DeleteIcon } from "components/icons";
import { TagName } from "demos-server";
import { NewDemonstrationType } from "./CreateDemonstrationTypesDialog";

export const CreateDemonstrationTypesList = ({
  demonstrationTypes,
  removeDemonstrationType,
}: {
  demonstrationTypes: NewDemonstrationType[];
  removeDemonstrationType: (demonstrationTypeName: TagName) => void;
}) => {
  return (
    demonstrationTypes.length > 0 && (
      <div className="flex flex-col gap-1">
        <p className="font-bold">
          Types to be added ({demonstrationTypes.length})
        </p>

        <ul className="border border-gray-300 border-b-0 max-h-[40vh] overflow-y-auto">
          {demonstrationTypes.map((demonstrationType) => (
            <li
              key={demonstrationType.demonstrationTypeName}
              className="p-1 border-b border-gray-300 flex justify-between"
            >
              <div>
                <p className="font-bold text-lg">
                  {demonstrationType.demonstrationTypeName}
                  {demonstrationType.approvalStatus === "Unapproved" &&
                    " (Unapproved)"}
                </p>
              </div>

              <div className="flex items-center">
                <button
                  className="p-1 cursor-pointer"
                  onClick={() =>
                    removeDemonstrationType(
                      demonstrationType.demonstrationTypeName
                    )
                  }
                  name="remove-type"
                  type="button"
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
