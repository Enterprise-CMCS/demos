import React from "react";
import { tw } from "tags/tw";

const LOADING_SPINNER_STYLES = tw`
animate-spin
rounded-full
h-12 w-12 border-4
border-gray-200
border-t-blue-500`;

export const Loading: React.FC = () => (
  <div className="flex justify-center items-center">
    <div className={LOADING_SPINNER_STYLES} aria-label="Loading" />
  </div>
);
