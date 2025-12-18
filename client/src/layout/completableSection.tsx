import React from "react";
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon } from "components/icons";
import { CompletenessBadge } from "components/badge/CompletenessBadge";

export const CompletableSection = ({
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
            <CompletenessBadge isComplete={isComplete} />
            {isExpanded ? (
              <ChevronRightIcon className="h-2 w-2 text-brand" />
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
