import React from "react";

const Avatar: React.FC<{ character?: string }> = ({ character }) => {
  return (
    <div
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

export default Avatar;
