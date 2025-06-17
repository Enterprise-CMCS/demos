# Overview

This page documents some of the considerations when authenticating a user on the client-side. This information comes largely from the documentation for [react-oidc-context](https://www.npmjs.com/package/react-oidc-context) with some added considerations for [AWS Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)

## Route Protection

### Current Situation

In lower environments users log in using Cognito without IDM. If the user is logged in, they can see all available routes.

In production, users will log in through IDM and IDM will talk to Cognito for us and determine a user's authentication status.

### Future Situation

In the fututre we might need to secure a route, particularly for the `/admin` page. There are limitations to this as the frontend can only secure routes absolutely, depending on whether the user is logged in at all or not and we cannot secure routes based on role.

This means we'll need to incorporate some type of role-based authentication check in the server to determine if a user can access this page. Alternatively we could look into using multiple cognito user pools if we did want to simplify this sort of role-based access we handle on the BE.

#### Securing all Routes

If we did want to secure a route to make sure the user is logged in at all we would do something like this:

```
import React from 'react';
import { withAuthenticationRequired } from "react-oidc-context";

const MyComponent = () => (<div>Hello World</div>);

export const authenticatedComponent = withAuthenticationRequired(MyComponent, {
  OnRedirecting: () => (<div>Redirecting to the login page...</div>)
});
```

## Passsing Tokens

What follows is an example of how the client and frontend can exchange tokens in a way that is secure and trusted.

### Client Side

Using Apollo Client we can make sure that the authorization headers are always present in a user's request using the `setContext` function:

```
const httpLink = createHttpLink({
  uri: '/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = auth.user?.access_token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
```

### Server

On the server we're presented with this problem of getting a trusted email for a user from just a token. This is what we would most likely use to look the user up in our DB and determine what permissions they would have and what operations they would be able to perform.

More information at Cognito's [Verifying JSON Web Tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)

```
const jwt = require('jsonwebtoken');

// Assume: We have cognito_public_key from JWKS
const token = req.headers.authorization?.replace('Bearer ', '');
const decodedToken = jwt.verify(token, cognito_public_key);
const userEmail = decodedToken.email; // Now this is trusted
```
