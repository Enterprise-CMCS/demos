import React from "react";

export type ErrorAction =
  | { label: string; href: string }
  | { label: string; onClick: () => void };

export interface ErrorPageProps {
  code: number | string;
  title: string;
  message?: string;
  actions?: ErrorAction[];
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ code, title, message, actions = [] }) => {
  const renderAction = (a: ErrorAction, idx: number) => {
    const common = "inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700";
    if ("href" in a) {
      return (
        <a key={idx} className={common} href={a.href}>
          {a.label}
        </a>
      );
    }
    return (
      <button key={idx} className={common} onClick={a.onClick}>
        {a.label}
      </button>
    );
  };

  return (
    <div className="p-8 text-center">
      <div className="text-5xl font-bold mb-2">{code}</div>
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      {message && <p className="text-gray-700 mb-6">{message}</p>}
      {actions.length > 0 && <div className="space-x-2">{actions.map(renderAction)}</div>}
    </div>
  );
};

