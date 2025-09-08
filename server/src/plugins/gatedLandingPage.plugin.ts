import type { ApolloServerPlugin } from "@apollo/server";

/**
 * Simple landing page that embeds Apollo Sandbox only when an auth cookie exists.
 * Blocks the dashboard UI if `id_token` or `access_token` cookies are missing.
 */
export const gatedLandingPagePlugin = (): ApolloServerPlugin => ({
  async serverWillStart() {
    return {
      async renderLandingPage() {
        const html = `
          <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Apollo Sandbox</title>
                <style>
                  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; }
                  .blocked { display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 8px; }
                  .blocked h1 { font-size: 20px; margin: 0; }
                  .blocked p { color: #444; margin: 0; }
                  #embeddableSandbox { height: 100vh; }
                </style>
              </head>
              <body>
                <div id="embeddableSandbox" hidden></div>
                <div id="blocked" class="blocked" hidden>
                  <h1>Authentication required</h1>
                  <p>Sign in to demos to use the Apollo GraphQL Sandbox.</p>
                </div>
                <script>
                  function hasToken() {
                    const cookies = document.cookie ? document.cookie.split('; ') : [];
                    let map = {};
                    for (const c of cookies) {
                      const i = c.indexOf('=');
                      const k = i === -1 ? c : c.slice(0, i);
                      map[k] = i === -1 ? '' : decodeURIComponent(c.slice(i + 1));
                    }
                    return !!(map['id_token'] || map['access_token'] || map['authorization']);
                  }
                  if (!hasToken()) {
                    document.getElementById('blocked').hidden = false;
                  } else {
                    document.getElementById('embeddableSandbox').hidden = false;
                    var s = document.createElement('script');
                    s.src = 'https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js';
                    s.onload = function () {
                      new window.EmbeddedSandbox({
                        target: '#embeddableSandbox',
                        initialState: { includeCookies: true },
                        hideCookieToggle: true,
                        endpointIsEditable: false,
                      });
                    };
                    document.body.appendChild(s);
                  }
                </script>
              </body>
            </html>
          `;
        return { html };
      },
    };
  },
});

