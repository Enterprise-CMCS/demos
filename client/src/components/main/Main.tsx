import React from "react";

interface MainProps {
  children: React.ReactNode;
}

export const Main: React.FC<MainProps> = (props: MainProps) => {
  return (
    <main className="flex h-screen p-4 bg-gray-100">
      {props.children}
    </main>
  );
};
