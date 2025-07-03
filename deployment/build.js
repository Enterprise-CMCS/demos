import { spawn } from "child_process";
import * as fs from "fs";
import path from "path";
import chalk from "chalk";

const colorOpts = {
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

function reserveRandomColor() {
  const colors = Object.keys(colorOpts).filter((key) => !colorOpts[key]);
  if (colors.length === 0) {
    return null;
  }
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  colorOpts[randomColor] = true;
  return randomColor;
}

function runCommand(name, cmd, args, opts) {
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
      resolve(code);
    });
  });
}

function runShell(name, sh, opts) {
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

async function buildClient(environment) {
  const clientPath = path.join("..", "client");

  const coreOutputData = readCoreOutputs();

  await runShell("client-build", "npm ci && npm run build", {
    cwd: clientPath,
    env: {
      ...process.env,
      VITE_COGNITO_AUTHORITY: coreOutputData[`demos-${environment}-core`][`${environment}CognitoAuthority`],
      VITE_COGNITO_DOMAIN: coreOutputData[`demos-${environment}-core`][`${environment}CognitoDomain`],
      VITE_COGNITO_CLIENT_ID: coreOutputData[`demos-${environment}-core`][`${environment}CognitoClientId`],
      VITE_BASE_URL: coreOutputData[`demos-${environment}-core`][`${environment}BaseUrl`],
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

async function getCoreOutputs() {
  const coreOutputCmd = await runCommand("core-deploy", "npm", ["run", "deploy:core:output"]);

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

async function fullDeploy() {
  const completeDeployCmd = await runCommand("deploy-all", "npm", ["run", "deploy"]);

  if (completeDeployCmd != 0) {
    process.stderr.write(`complete deploy command failed with code ${completeDeployCmd}`);
    process.exit(completeDeployCmd);
  }

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
      await buildServer(environment);
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
