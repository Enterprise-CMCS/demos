import React from "react";

export const LandingPageLinks: React.FC = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold">Welcome to DEMOS</h1>
    <a href="/login">
      <button className="mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Go to Login page
      </button>
    </a>
  </div>
);
