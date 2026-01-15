import React from "react";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";
import { DeleteIcon } from "components/icons";
import { formatDate } from "util/formatDate";

export const DemonstrationTypesList = ({
  demonstrationTypes,
  setDemonstrationTypes,
}: {
  demonstrationTypes: DemonstrationType[];
  setDemonstrationTypes: React.Dispatch<React.SetStateAction<DemonstrationType[]>>;
}) => {
  const removeType = (demonstrationTypeTag: string) => () => {
    setDemonstrationTypes((prevTypes) =>
      prevTypes.filter((type) => type.tag !== demonstrationTypeTag)
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">Types to be added ({demonstrationTypes.length})</p>
      {demonstrationTypes.length === 0 && <p>No demonstration types added.</p>}
      {demonstrationTypes.length > 0 && (
        <ul className="border border-gray-300 border-b-0">
          {demonstrationTypes.map((type, index) => (
            <li key={index} className="p-1 border-b border-gray-300 flex justify-between">
              <div>
                <p className="font-bold text-lg">{type.tag}</p>
                <span>
                  Effective: {formatDate(type.effectiveDate)} &bull; Expires:{" "}
                  {formatDate(type.expirationDate)}
                </span>
              </div>
              <div className="flex items-center">
                <button className="p-1" onClick={removeType(type.tag)} name="remove-type">
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
