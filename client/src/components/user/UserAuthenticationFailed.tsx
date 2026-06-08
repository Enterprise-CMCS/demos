import React from "react";
import { CONTACT_US_MAILTO } from "components/footer/Footer";
import { Notice } from "components/notice";

export const UserAuthenticationFailed = ({
  name,
  email,
  errorMessage,
}: {
  name?: string;
  email?: string;
  errorMessage?: string;
}) => {
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
        <div className="flex gap-4 text-sm">
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Retry
          </button>
          <a
            href={CONTACT_US_MAILTO}
            className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
};
