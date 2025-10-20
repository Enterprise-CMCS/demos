import { useIdleTimer } from "react-idle-timer";
import { useAuthActions } from "components/auth/AuthActions";
import { getIdleTimeoutMs } from "config/env"; // from earlier refactor

export const IdleSessionHandler = () => {
  const { signOut } = useAuthActions();

  const idleTimeout = getIdleTimeoutMs(); // number or NaN

  // Disable when -1 (or any non-positive / invalid value)
  if (!Number.isFinite(idleTimeout) || idleTimeout <= 0) {
    return null;
  }

  useIdleTimer({
    timeout: idleTimeout,
    onIdle: () => void signOut(),
    debounce: 500,
  });

  return null;
};
