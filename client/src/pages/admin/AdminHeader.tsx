import React from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "components/button";
import { ExitIcon } from "components/icons";

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full">
      <div className="w-full flex items-center justify-between">
        <span className="font-bold">Admin</span>
        <IconButton
          icon={<ExitIcon />}
          name="close-admin"
          data-testid="close-admin"
          onClick={() => navigate("/")}
        >
          Close Admin
        </IconButton>
      </div>
    </header>
  );
};
