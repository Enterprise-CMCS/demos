import React from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "components/button";
import { ExitIcon, SettingsIcon } from "components/icons";

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full">
      <div className="w-full flex items-center justify-between">
        <div className="text-xl font-bold flex gap-0-5 items-baseline">
          <SettingsIcon />Admin
        </div>
        <IconButton
          icon={<ExitIcon />}
          name="close-admin"
          data-testid="close-admin"
          onClick={() => navigate(-1)}
        >
          Close Admin
        </IconButton>
      </div>
    </header>
  );
};
