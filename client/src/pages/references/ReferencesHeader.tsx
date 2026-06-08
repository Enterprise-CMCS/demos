import React from "react";
import { useNavigate } from "react-router-dom";
import { ExitIcon, BookIcon } from "components/icons";

export const ReferencesHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-between items-center p-0-5">
      <div className="text-xl font-bold flex gap-1 leading-[1]">
        <span className="flex items-end">
          <BookIcon />
        </span>
        References
      </div>
      <button
        className="flex gap-0-5 text-sm cursor-pointer"
        name="close-references"
        data-testid="close-references"
        onClick={() => navigate(-1)}
      >
        <span className="mt-[-2px]"> Close References</span>
        <span className="flex items-center">
          <ExitIcon className="h-[12px]" />
        </span>
      </button>
    </div>
  );
};
