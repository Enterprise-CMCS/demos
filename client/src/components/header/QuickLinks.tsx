import React from "react";

const QuickLinks: React.FC = () => {
  return (
    <ul className="quick-links flex">
      <li>
        <a>
          <span role="img" aria-label="gear" className="">
            ⚙️
          </span>
          <span>Admin</span>
        </a>
      </li>
      <li>
        <a>
          <span role="img" aria-label="bell" className="">
            🔔
          </span>
          <span>Notifications</span>
        </a>
      </li>
      <li>
        <a>
          <span role="img" aria-label="liferaft" className="">
            🛟
          </span>
          <span>Help</span>
        </a>
      </li>
    </ul>
  );
};

export default QuickLinks;
