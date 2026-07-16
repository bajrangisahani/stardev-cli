#!/usr/bin/env node
import process from "node:process";

import { Command } from "commander";
import "dotenv/config";

import { registerAiCommand } from "./commands/ai.js";
import { registerClientCommand } from "./commands/client.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerDeployCommand } from "./commands/deploy.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerGitHubCommand } from "./commands/github.js";
import { registerInitCommand } from "./commands/init.js";
import { registerOptimizeCommand } from "./commands/optimize.js";
import { registerPortfolioCommand } from "./commands/portfolio.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerReadmeCommand } from "./commands/readme.js";
import { registerReleaseCommand } from "./commands/release.js";
import { registerReviewCommand } from "./commands/review.js";
import { registerScreenshotCommand } from "./commands/screenshot.js";
import { StardevError, toStardevError } from "./errors/StardevError.js";
import { logger } from "./logger/logger.js";

const program = new Command();

program
  .name("stardev")
  .description("Enterprise-grade developer workflow automation CLI.")
  .version("1.0.0")
  .hook("preAction", () => {
    logger.banner();
  });

registerInitCommand(program);
registerPublishCommand(program);
registerGitHubCommand(program);
registerReadmeCommand(program);
registerDeployCommand(program);
registerScreenshotCommand(program);
registerReviewCommand(program);
registerOptimizeCommand(program);
registerDoctorCommand(program);
registerReleaseCommand(program);
registerPortfolioCommand(program);
registerClientCommand(program);
registerAiCommand(program);
registerConfigCommand(program);

program.showHelpAfterError();

process.on("unhandledRejection", (error) => {
  handleError(error);
});

process.on("uncaughtException", (error) => {
  handleError(error);
});

try {
  await program.parseAsync(process.argv);
} catch (error) {
  handleError(error);
}

function handleError(error: unknown): never {
  const normalized = error instanceof StardevError ? error : toStardevError(error, "COMMAND_ERROR");
  logger.error(`${normalized.code}: ${normalized.message}`);
  if (process.env.STARDEV_DEBUG && normalized.details) {
    console.error(normalized.details);
  }
  process.exit(1);
}
