import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import * as fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
  UpdateUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";
 


type chalkColors = "bgBlue" | "bgGreen" | "bgYellow" | "bgRed" | "bgMagenta" | "bgCyan" | "bgWhite" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white"

const colorOpts: {[k in chalkColors]: boolean} = {
  bgBlue: false,
  bgGreen: false,
  bgYellow: false,
  bgRed: false,
  bgMagenta: false,
  bgCyan: false,
  bgWhite: false,
  black: false,
  red: false,
  green: false,
  yellow: false,
  blue: false,
  magenta: false,
  cyan: false,
  white: false,
};

function reserveRandomColor(): chalkColors {
  const colors = Object.keys(colorOpts).filter((key) => !colorOpts[key as chalkColors]) as chalkColors[];
  if (colors.length === 0) {
    return "blue";
  }
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  colorOpts[randomColor] = true;
  return randomColor;
}

function runCommand(name: string, cmd: string, args: string[], opts?: SpawnOptionsWithoutStdio): Promise<number> {
  const child = spawn(cmd, args, opts);
  const color = reserveRandomColor();
  const nameC = chalk[color](`[${name}]`);

  child.stdout.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });
  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      process.stderr.write(`child process error: ${error}`);
      colorOpts[color] = false;
      reject(error);
    });

    child.on("close", (code) => {
      process.stdout.write(`${cmd} exited with code ${code}`);
      colorOpts[color] = false;
      resolve(code || 0);
    });
  });
}

function runShell(name: string, sh: string, opts?: SpawnOptionsWithoutStdio) {
  const child = spawn(sh, { ...opts, shell: true });
  const color = reserveRandomColor();
  const nameC = chalk[color](`[${name}]`);
  child.stdout.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });
  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      process.stderr.write(`child process error: ${error}`);
      colorOpts[color] = false;
      reject(error);
    });

    child.on("close", (code) => {
      process.stdout.write(`${sh} exited with code ${code}`);
      colorOpts[color] = false;
      resolve(code);
    });
  });
}

async function buildClient(environment: string) {
  const clientPath = path.join("..", "client");

  const coreOutputData = readCoreOutputs();

  await runShell("client-build", "npm ci && npm run build", {
    cwd: clientPath,
    env: {
      ...process.env,
      VITE_COGNITO_AUTHORITY: getOutputValue(coreOutputData, `demos-${environment}-core`, `cognitoAuthority`),
      VITE_COGNITO_DOMAIN: getOutputValue(coreOutputData, `demos-${environment}-core`, `cognitoDomain`),
      VITE_COGNITO_CLIENT_ID: getOutputValue(coreOutputData, `demos-${environment}-core`, `cognitoClientId`),
      // VITE_BASE_URL: getOutputValue(coreOutputData,`demos-${environment}-core`,`baseUrl`),
      VITE_API_URL_PREFIX: "/api/graphql",
    },
  });
}

async function buildServer() {
  const serverPath = path.join("..", "server");
  await runShell("server-build", "npm run build:ci", {
    cwd: serverPath,
  });
}

async function getCoreOutputs(environment: string) {
  const coreOutputCmd = await runCommand("core-deploy", "npx", [
    "cdk",
    "deploy",
    "--context",
    `stage=${environment}`,
    `demos-${environment}-core`,
    "--outputs-file",
    "core-outputs.json",
  ]);

  if (coreOutputCmd != 0) {
    process.stderr.write(`core output command failed with code ${coreOutputCmd}`);
    process.exit(coreOutputCmd);
  }
  return readCoreOutputs();
}

function readCoreOutputs(fileName = "core-outputs.json") {
  const coreOutputs = fs.readFileSync(fileName, "utf8");
  const coreOutputData = JSON.parse(coreOutputs);
  return coreOutputData;
}

async function addCognitoRedirect(userPoolId: string, clientId: string, additionalRedirect: string) {
  const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

  const current = await client.send(
    new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
    })
  );

  if (!current.UserPoolClient) {
    throw new Error("Could not find user pool client")
  }
  
  

  const existingUrls = current.UserPoolClient.CallbackURLs || [];
  console.log("additionalRedirect", additionalRedirect);
  const updatedUrls = Array.from(new Set([...existingUrls, additionalRedirect]));

  await client.send(
    new UpdateUserPoolClientCommand({
      ...current.UserPoolClient,
      UserPoolId: current.UserPoolClient.UserPoolId!,
      ClientId: current.UserPoolClient.ClientId!,
      CallbackURLs: updatedUrls,
    })
  );
}

function getOutputValue(outputData:{[key: string]: {[key: string]: string}}, stack:string, key:string): string {
  if (outputData[stack][key]) return outputData[stack][key];
  throw new Error(`Missing output ${key} in stack ${stack}`);
}

async function fullDeploy(environment: string) {
  const completeDeployCmd = await runCommand("deploy-all", "npx", [
    "cdk",
    "deploy",
    "--context",
    `stage=${environment}`,
    "--all",
    "--no-change-set",
    "--require-approval=never",
    "--outputs-file=all-outputs.json",
  ]);

  if (completeDeployCmd != 0) {
    process.stderr.write(`complete deploy command failed with code ${completeDeployCmd}`);
    process.exit(completeDeployCmd);
  }

  // Add cloudfront url to list of redirect urls
  const outputData = readCoreOutputs("all-outputs.json");
  if (!outputData[`demos-${environment}-core`][`cognitoAuthority`]) {
    throw new Error("variable is empty");
  }
  addCognitoRedirect(
    getOutputValue(outputData, `demos-${environment}-core`, "cognitoAuthority").split("/").pop()!,
    getOutputValue(outputData, `demos-${environment}-core`, "cognitoClientId"),
    getOutputValue(outputData, `demos-${environment}-ui`, "CloudfrontURL")
  );

  process.stdout.write(`\n======\ncomplete deploy command succeeded\n======\n`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("environment and command must be specified");
    process.exit(1);
  }

  const environment = args[0];
  const command = args[1];
  switch (command) {
    case "build:client":
      await buildClient(environment);
      break;
    case "build:server":
      await buildServer();
      break;
    case "deploy:core":
      await getCoreOutputs(environment);
      break;
    case "deploy:all":
      await fullDeploy(environment);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main();
