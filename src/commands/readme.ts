import path from "node:path";

import type { Command } from "commander";
import inquirer from "inquirer";

import { configStore } from "../config/ConfigStore.js";
import { logger } from "../logger/logger.js";
import { readmeGenerator } from "../readme/ReadmeGenerator.js";
import { safeWriteFile } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface ReadmeOptions {
  root?: string;
  description?: string;
  author?: string;
  license?: string;
  github?: string;
  demo?: string;
}

export function registerReadmeCommand(program: Command): void {
  program
    .command("readme")
    .description("Generate a premium README for the current project.")
    .option("-r, --root <path>", "Project root")
    .option("-d, --description <text>", "Project description")
    .option("-a, --author <name>", "Author name")
    .option("--license <license>", "License")
    .option("--github <url>", "GitHub URL")
    .option("--demo <url>", "Live demo URL")
    .action(async (options: ReadmeOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const config = await configStore.getAll();
      const answers = await inquirer.prompt<{ features: string; roadmap: string; socials: string }>([
        {
          name: "features",
          message: "Features, comma separated",
          type: "input",
          default: "Clean architecture,Production workflow,Automated documentation",
        },
        {
          name: "roadmap",
          message: "Roadmap, comma separated",
          type: "input",
          default: "Add tests,Improve deployment,Publish release",
        },
        { name: "socials", message: "Social links, comma separated", type: "input" },
      ]);

      const readme = readmeGenerator.generate({
        project,
        description: options.description ?? `A production-ready ${project.framework} project.`,
        author: options.author ?? config.defaultAuthor ?? config.gitUsername ?? "Project Author",
        license: options.license ?? config.license ?? "MIT",
        githubUrl: options.github,
        liveDemo: options.demo,
        socialLinks: splitCsv(answers.socials),
        features: splitCsv(answers.features),
        roadmap: splitCsv(answers.roadmap),
      });

      await safeWriteFile(path.join(root, "README.md"), readme);
      logger.success("README.md generated");
    });
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
