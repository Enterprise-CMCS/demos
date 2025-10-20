import type { ApolloServerPlugin } from "@apollo/server";
import type { GraphQLContext } from "./auth.util";

type Ctx = GraphQLContext & {
  _setCookies?: string[];
};

export const cookiePlugin: ApolloServerPlugin<Ctx> = {
  requestDidStart() {
    return Promise.resolve({
      willSendResponse(rc) {
        const headers = rc.response.http?.headers;
        if (!headers) return Promise.resolve();
        const cookies = rc.contextValue._setCookies ?? [];
        for (const c of cookies) headers.set("set-cookie", c);
        return Promise.resolve();
      },
    });
  },
};
