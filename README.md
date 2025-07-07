# Demonstration Evaluation & Management Oversight System (DEMOS)

This is the repository for DEMOS, the Demonstration Evaluation & Management Oversight System.

# Development

## Environment

We make use of [devcontainers](https://containers.dev/) to manage the various aspects of the project. For local development, VSCode will be able to detect and run the devcontainer correctly if you open the root of the project.

Alternatively, you can also install the [devcontainers/cli](https://github.com/devcontainers/cli) tool. Mac users may use `homebrew` to install `devcontainer` if desired.

## Getting Started

If using the command line, navigate to the root of the repository and execute the following.

```zsh
devcontainer up --workspace-folder .
```

Alternatively, you can simply open the repository in VSCode and follow the on-screen prompting.

If this is the first time the devcontainer has been run, it will build, which may take some time; if you have issues with downloads, consider disconnecting from any VPN software that might be interfering.

## Getting A Console Session

Use the following commands to get a console session inside the devcontainer. Note that you will be running on the `app` container.

```zsh
devcontainer exec --workspace-folder . /bin/zsh
```

Within VSCode, terminals will automatically be opened within the `app` container.

## Running the Application

You will need to run the server and the client.

### Server Side

For your first run, you'll want to seed the database with fake data, and then run the server. The seed command is not necessary on subsequent runs unless you want freshly seeded data.

```zsh
cd server
npm ci
npm run seed
npm run dev
```

### Client Side

```zsh
cd client
npm ci
npm run dev
```

### Localstack for Lambdas

To facilitate local development of the AWS Lambda function that serves as the GraphQL endpoint, you can use the included LocalStack configuration. From inside the devcontainer, run the following (note this assumes you have already seeded the database and have a functioning installation of the server):

```zsh
cd server/localstack
./localstack.sh
```

This will drop any existing LocalStack resources and replace them with appropriate new ones. There is no persistence of this across runs, so you will need to run the script every time you start the devcontainer. Obviously, after any changes to the server code, you should also run the command to deploy your new version via LocalStack.

When the script finishes running, it will output the API Gateway URL you should use - something like this:

```
API Gateway URL: http://localhost:4566/_aws/execute-api/yvbkw90rxr/local
```

You should be able to use this URL from something like Bruno to make API calls against the database. Note that if you are making calls from _inside_ the devcontainer, you should replace `localhost` with `localstack`; this is because within the broader devcontainer environment, the DNS for the container running LocalStack is just `localstack`.
