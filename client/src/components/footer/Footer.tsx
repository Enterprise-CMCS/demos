import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-black fixed bottom-0 w-full border-t z-12">
      <p className="text-center p-1">
        &copy; {new Date().getFullYear()} DEMOS. All rights reserved.
      </p>
    </footer>
  );
};
