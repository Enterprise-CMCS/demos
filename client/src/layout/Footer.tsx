import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-center text-sm text-gray-600 px-6">
      © {new Date().getFullYear()} My App. All rights reserved.
    </footer>
  );
};

export default Footer;
