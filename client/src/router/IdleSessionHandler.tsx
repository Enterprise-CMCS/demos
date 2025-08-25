import { useIdleTimer } from "react-idle-timer";
import { logout } from "router/cognitoConfig";
const IdleSessionHandler = () => {
  const onIdle = () => {
    logout();
  };

  useIdleTimer({
    timeout: 15 * 60 * 1000, // TODO: Adjust to CMS Required Value
    onIdle,
    debounce: 500,
  });

  return null;
};

export {
  IdleSessionHandler
};
