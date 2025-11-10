import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-black w-full border-t">
      <p className="text-center p-1">
        &copy; {new Date().getFullYear()} DEMOS. All rights reserved.
      </p>
    </footer>
  );
};
