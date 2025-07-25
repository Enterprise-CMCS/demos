import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import chalk from "chalk";

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

export function runCommand(name: string, cmd: string, args: string[], opts?: SpawnOptionsWithoutStdio): Promise<number> {
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

export function runShell(name: string, sh: string, opts?: SpawnOptionsWithoutStdio) {
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
