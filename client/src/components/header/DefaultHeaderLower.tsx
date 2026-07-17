import React from "react";

import { getCurrentUser } from "components/user/UserContext";

const UserGreeting = () => {
  const { currentUser } = getCurrentUser();

  return (
    <div>
      <span className="font-bold block">Hello {currentUser.person.fullName}</span>
      <span className="block text-sm">Welcome to DEMOS!</span>
    </div>
  );
};

export const DefaultHeaderLower: React.FC = () => {
  return <UserGreeting />;
};
