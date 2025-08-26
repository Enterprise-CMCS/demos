import React, { Fragment, useState } from "react";

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCollapse = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border-2 p-1 h-fit">
      <div
        onClick={toggleCollapse}
        className="cursor-pointer"
      >
        {title}
      </div>
      {isOpen && <Fragment>{ children }</Fragment>}
    </div>
  );
};
