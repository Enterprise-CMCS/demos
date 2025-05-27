import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-black fixed bottom-0 w-full border-t">
      <p className="text-center p-1">
        &copy; {new Date().getFullYear()} DEMOS. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
