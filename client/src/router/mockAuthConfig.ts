import type { AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore, User } from "oidc-client-ts";

const MOCK_AUTHORITY = "https://mock-authority.local";
const MOCK_CLIENT_ID = "mock-client-id";

// Create a mock user store that starts with a pre-populated mock user
const createMockUserStore = () => {
  const store = new WebStorageStateStore({ store: window.sessionStorage });

  const mockUser: User = {
    profile: {
      sub: "mock-user-id",
      email: "mock-dev-user@example.com",
      name: "Mock Dev User",
    },
    id_token: "mock-id-token",
    access_token: "mock-access-token",
    token_type: "Bearer",
    expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  } as User;

  store.set(`user:${MOCK_AUTHORITY}:${MOCK_CLIENT_ID}`, JSON.stringify(mockUser));

  return store;
};

// Mock authentication props - minimal config to bypass real OIDC flows
export const getMockAuthProps = (): AuthProviderProps => ({
  authority: MOCK_AUTHORITY,
  client_id: MOCK_CLIENT_ID,
  redirect_uri: window.location.origin,
  automaticSilentRenew: false,
  userStore: createMockUserStore(),
});
