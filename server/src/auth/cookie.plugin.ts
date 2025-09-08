import type { ApolloServerPlugin } from "@apollo/server";
import type { GraphQLContext } from "./auth.util";

type Ctx = GraphQLContext & {
  _setCookies?: string[];
};

export const cookiePlugin: ApolloServerPlugin<Ctx> = {
  async requestDidStart() {
    return {
      async willSendResponse(rc) {
        const headers = rc.response.http?.headers;
        if (!headers) return;
        const cookies = rc.contextValue._setCookies ?? [];
        for (const c of cookies) headers.set("set-cookie", c);
      },
    };
  },
};
