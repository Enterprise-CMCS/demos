import { useIdleTimer } from "react-idle-timer";
import { useAuthActions } from "components/auth/AuthActions";
import { isLocalDevelopment } from "config/env";

export const IdleSessionHandler = () => {
  const { signOut } = useAuthActions();

  const onIdle = () => {
    signOut();
  };

  // if local, then allow for removal of time out.
  if (isLocalDevelopment() && import.meta.env.VITE_IDLE_TIMEOUT === "-1") {
    return null;
  }

  const idleTimeout = Number(import.meta.env.VITE_IDLE_TIMEOUT) || 15 * 60 * 1000;

  useIdleTimer({
    timeout: idleTimeout,
    onIdle,
    debounce: 500,
  });

  return null;
};
