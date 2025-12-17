import React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "components/icons";

export const StatusBadge = ({ isComplete }: { isComplete: boolean }) => (
  <div
    className={`px-3 py-1 rounded ${
      isComplete ? "bg-green-600 text-white" : "bg-yellow-400 text-black"
    }`}
  >
    <span className="text-sm font-medium">{isComplete ? "Complete" : "Incomplete"}</span>
  </div>
);

export const ExpandableSection = ({
  isComplete,
  isExpanded,
  setIsExpanded,
  title,
  children,
}: {
  isComplete: boolean;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <div className="col-span-4 mt-1">
        <div
          className="flex items-center justify-between cursor-pointer p-1 gap-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h4 className="text-xl font-bold mb-1 text-black">{title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge isComplete={isComplete} />
            {isExpanded ? (
              <ChevronUpIcon className="h-2 w-2 text-brand" />
            ) : (
              <ChevronDownIcon className="h-2 w-2 text-brand" />
            )}
          </div>
        </div>
      </div>
      {isExpanded && children}
    </>
  );
};
