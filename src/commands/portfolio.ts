import path from "node:path";

import type { Command } from "commander";

import { configStore } from "../config/ConfigStore.js";
import { logger } from "../logger/logger.js";
import { portfolioGenerator } from "../portfolio/PortfolioGenerator.js";
import { safeWriteFile } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot, slugify } from "../utils/path.js";

interface PortfolioOptions {
  root?: string;
  output?: string;
  description?: string;
  demo?: string;
  github?: string;
}

export function registerPortfolioCommand(program: Command): void {
  program
    .command("portfolio")
    .description("Generate portfolio project JSON with screenshots, technologies, demo, and GitHub links.")
    .option("-r, --root <path>", "Project root")
    .option("-o, --output <file>", "Output file")
    .option("-d, --description <text>", "Project description")
    .option("--demo <url>", "Live demo URL")
    .option("--github <url>", "GitHub URL")
    .action(async (options: PortfolioOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const config = await configStore.getAll();
      const data = await portfolioGenerator.createProjectJson(
        project,
        options.description ?? `${project.name} built with ${project.framework}.`,
        options.demo,
        options.github,
      );
      const output =
        options.output ??
        path.join(config.portfolioPath ?? path.join(root, "docs"), `${slugify(project.name)}.json`);
      await safeWriteFile(path.resolve(root, output), `${JSON.stringify(data, null, 2)}\n`);
      logger.success(`Portfolio JSON written: ${output}`);
    });
}
