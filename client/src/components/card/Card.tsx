import React from "react";

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="shadow-md bg-white p-[16px] h-full">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b pb-[8px]">
        {title}
      </h1>
      {children}
    </div>
  );
};
