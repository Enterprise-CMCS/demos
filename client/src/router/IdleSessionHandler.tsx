import { useIdleTimer } from "react-idle-timer";
import { useAuthActions } from "components/auth/AuthActions";

export const IdleSessionHandler = () => {
  const { signOut } = useAuthActions();

  const onIdle = () => {
    signOut();
  };

  useIdleTimer({
    timeout: 15 * 60 * 1000, // TODO: Adjust to CMS Required Value
    onIdle,
    debounce: 500,
  });

  return null;
};
