import React from "react";

export const Avatar: React.FC<{ character?: string }> = ({ character }) => {
  return (
    <div
      id="profile-letter"
      className="
        w-3
        h-3
        rounded-full
        bg-[var(--color-warn)]
        flex
        items-center
        justify-center
      "
    >
      {character}
    </div>
  );
};
