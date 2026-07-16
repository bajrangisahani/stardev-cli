import type { Command } from "commander";
import inquirer from "inquirer";

import { configStore } from "../config/ConfigStore.js";
import { logger } from "../logger/logger.js";
import type { LocalConfig } from "../types/index.js";

export function registerConfigCommand(program: Command): void {
  const command = program.command("config").description("Manage encrypted local STARDEV configuration.");

  command
    .command("set")
    .description("Interactively set encrypted configuration values.")
    .action(async () => {
      const answers = await inquirer.prompt<LocalConfig>([
        { name: "githubToken", message: "GitHub token", type: "password", mask: "*" },
        { name: "vercelToken", message: "Vercel token", type: "password", mask: "*" },
        { name: "defaultAuthor", message: "Default author", type: "input" },
        { name: "portfolioPath", message: "Portfolio path", type: "input" },
        { name: "license", message: "Default license", type: "input", default: "MIT" },
        { name: "company", message: "Company", type: "input" },
        { name: "gitUsername", message: "Git username", type: "input" },
        { name: "gitEmail", message: "Git email", type: "input" },
      ]);

      const clean = Object.fromEntries(
        Object.entries(answers).filter(([, value]) => typeof value === "string" && value.length > 0),
      ) as LocalConfig;

      await configStore.set(clean);
      logger.success(`Config saved at ${configStore.path}`);
    });

  command
    .command("path")
    .description("Print the encrypted config path.")
    .action(() => {
      logger.info(configStore.path);
    });
}
