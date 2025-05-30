import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const TableSection: React.FC<Props> = ({ title, children }) => (
  <section className="mt-10 first:mt-0 border-2 rounded-md p-6 bg-white">
    <h2 className="text-xl font-bold mb-4">{title}</h2>
    {children}
  </section>
);

