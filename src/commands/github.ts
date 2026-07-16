import type { Command } from "commander";
import inquirer from "inquirer";

import { configStore } from "../config/ConfigStore.js";
import { githubService } from "../github/GitHubService.js";
import { logger } from "../logger/logger.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot, slugify } from "../utils/path.js";

interface GitHubOptions {
  root?: string;
  name?: string;
  description?: string;
  private?: boolean;
  topics?: string;
  homepage?: string;
  token?: string;
  push?: boolean;
  open?: boolean;
}

export function registerGitHubCommand(program: Command): void {
  program
    .command("github")
    .description("Create a GitHub repository, add topics/homepage, push, and open it.")
    .option("-r, --root <path>", "Project root")
    .option("-n, --name <name>", "Repository name")
    .option("-d, --description <text>", "Repository description")
    .option("--private", "Create a private repository")
    .option("--topics <topics>", "Comma-separated topics")
    .option("--homepage <url>", "Homepage URL")
    .option("--token <token>", "GitHub token")
    .option("--no-push", "Do not push local project")
    .option("--no-open", "Do not open repository in browser")
    .action(async (options: GitHubOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const config = await configStore.getAll();
      const token = options.token ?? config.githubToken;

      if (!token) {
        const answer = await inquirer.prompt<{ token: string }>([
          { name: "token", message: "GitHub token", type: "password", mask: "*", validate: Boolean },
        ]);
        await configStore.set({ githubToken: answer.token });
        options.token = answer.token;
      }

      const url = await githubService.createAndPublish(project, {
        token: options.token ?? token ?? "",
        name: options.name ?? slugify(project.name),
        description: options.description ?? `${project.name} built and published with STARDEV CLI.`,
        privateRepo: options.private ?? false,
        topics: splitCsv(options.topics ?? `${project.framework},developer-tools`),
        homepage: options.homepage,
        push: options.push !== false,
        openBrowser: options.open !== false,
      });

      logger.success(`Repository ready: ${url}`);
    });
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
