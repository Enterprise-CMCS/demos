import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const TableTitle: React.FC<Props> = ({ title, children }) => (
  <section className="mt-1 first:mt-0 border-2 rounded-md bg-white">
    <h2 className="text-xl font-bold mb-4 ml-2 mt-2">{title}</h2>
    {children}
  </section>
);

