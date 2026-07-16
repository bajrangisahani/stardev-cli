import chalk from "chalk";
import gradient from "gradient-string";
import ora, { type Ora } from "ora";

import { CLI_NAME } from "../constants/index.js";

export class Logger {
  public banner(): void {
    console.log(gradient(["#7c3aed", "#06b6d4", "#22c55e"]).multiline("STARDEV CLI"));
    console.log(chalk.dim("Developer workflow automation for serious projects\n"));
  }

  public info(message: string): void {
    console.log(`${chalk.cyan("i")} ${message}`);
  }

  public success(message: string): void {
    console.log(`${chalk.green("✓")} ${message}`);
  }

  public warn(message: string): void {
    console.log(`${chalk.yellow("!")} ${message}`);
  }

  public error(message: string): void {
    console.error(`${chalk.red("x")} ${message}`);
  }

  public command(command: string): void {
    console.log(chalk.dim(`$ ${command}`));
  }

  public spinner(message: string): Ora {
    return ora({ text: message, spinner: "dots" }).start();
  }

  public hint(message: string): void {
    console.log(chalk.dim(`${CLI_NAME}: ${message}`));
  }
}

export const logger = new Logger();
