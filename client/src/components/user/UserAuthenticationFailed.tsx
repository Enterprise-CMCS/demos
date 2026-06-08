import React from "react";
import { CONTACT_US_MAILTO } from "components/footer/Footer";
import { Notice } from "components/notice";
import { useAuthActions } from "components/auth/AuthActions";
import { Anchor, Button } from "components";

const SIGNOUT_BUTTON_NAME = "sign-out-button";
const CONTACT_US_ANCHOR_NAME = "contact-support";

export const UserAuthenticationFailed = ({
  name,
  email,
  errorMessage,
}: {
  name?: string;
  email?: string;
  errorMessage?: string;
}) => {
  const { signOut } = useAuthActions();

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="flex flex-col gap-2">
        <Notice
          variant="error"
          title="Authentication Failed"
          description="We were unable to load your account."
        />
        {(name || email) && (
          <p className="text-sm text-gray-600">
            Signed in as{name ? ` ${name}` : ""}
            {email ? ` (${email})` : ""}.
          </p>
        )}
        {errorMessage && <p className="text-sm text-gray-500">Error: {errorMessage}</p>}
        <div className="flex gap-4 text-sm items-center justify-center">
          <Button name={SIGNOUT_BUTTON_NAME} onClick={signOut}>
            Sign out
          </Button>
          <Anchor name={CONTACT_US_ANCHOR_NAME} href={CONTACT_US_MAILTO}>
            Contact support
          </Anchor>
        </div>
      </div>
    </div>
  );
};
