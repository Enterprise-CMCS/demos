import React from "react";
import { Loading } from "./Loading";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <Loading />
    </div>
  );
};
