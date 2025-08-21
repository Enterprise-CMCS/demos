// src/components/auth/AuthLinks.tsx
import React, { forwardRef } from "react";
import { useAuth } from "react-oidc-context";
import { useAuthActions } from "./AuthActions";
import { getCognitoConfig, getCognitoLogoutUrl } from "router/cognitoConfig";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: React.ReactNode;
};

/** Link that triggers the Cognito sign-in flow. */
export const SigninLink = forwardRef<HTMLAnchorElement, AnchorProps>(
  ({ children = "Sign In", onClick, href, ...rest }, ref) => {
    const { signIn } = useAuthActions();
    return (
      <a
        ref={ref}
        href={href ?? "#"}
        onClick={(e) => {
          // Prevent default nav "#" so OIDC flow handles redirect
          if (!href) e.preventDefault();
          signIn();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
);
SigninLink.displayName = "SigninLink";

/** Link that clears local auth and navigates to Cognito /logout. */
export const SignoutLink = forwardRef<HTMLAnchorElement, AnchorProps>(
  ({ children = "Sign Out", onClick, href, ...rest }, ref) => {
    const auth = useAuth();
    // Default to the proper Hosted UI logout URL; can be overridden via `href`
    const logoutHref = href ?? getCognitoLogoutUrl(getCognitoConfig());

    return (
      <a
        ref={ref}
        href={logoutHref}
        onClick={(e) => {
          auth.removeUser?.();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
);
SignoutLink.displayName = "SignoutLink";
