import { spawn } from "node:child_process";

import { StardevError } from "../errors/StardevError.js";
import { logger } from "../logger/logger.js";

export interface ExecOptions {
  cwd: string;
  dryRun?: boolean | undefined;
  env?: NodeJS.ProcessEnv | undefined;
}

export async function runCommand(command: string, args: string[], options: ExecOptions): Promise<string> {
  const printable = [command, ...args].join(" ");
  logger.command(printable);

  if (options.dryRun) {
    return "";
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new StardevError("COMMAND_ERROR", `Command failed: ${printable}`, error));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(
        new StardevError(
          "COMMAND_ERROR",
          `Command failed with exit code ${code}: ${printable}`,
          stderr.trim(),
        ),
      );
    });
  });
}
