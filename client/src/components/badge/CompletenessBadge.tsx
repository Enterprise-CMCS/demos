import React from "react";

export const CompletenessBadge = ({ isComplete }: { isComplete: boolean }) => (
  <div
    className={`px-3 py-1 rounded ${
      isComplete ? "bg-green-600 text-white" : "bg-yellow-400 text-black"
    }`}
  >
    <span className="text-sm font-medium">{isComplete ? "Complete" : "Incomplete"}</span>
  </div>
);
