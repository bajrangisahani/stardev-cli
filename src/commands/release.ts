import type { Command } from "commander";

import { configStore } from "../config/ConfigStore.js";
import { logger } from "../logger/logger.js";
import { releaseService } from "../releases/ReleaseService.js";
import { resolveRoot } from "../utils/path.js";

interface ReleaseOptions {
  root?: string;
  version: string;
  owner?: string;
  repo?: string;
  assets?: string;
  push?: boolean;
  token?: string;
}

export function registerReleaseCommand(program: Command): void {
  program
    .command("release")
    .description("Generate changelog, create Git tag, and optionally create a GitHub release.")
    .requiredOption("-v, --version <version>", "Release version, for example v1.0.0")
    .option("-r, --root <path>", "Project root")
    .option("--owner <owner>", "GitHub owner")
    .option("--repo <repo>", "GitHub repository")
    .option("--assets <files>", "Comma-separated release assets")
    .option("--token <token>", "GitHub token")
    .option("--no-push", "Skip pushing commits and tags")
    .action(async (options: ReleaseOptions) => {
      const config = await configStore.getAll();
      const result = await releaseService.release(resolveRoot(options.root), {
        version: options.version,
        token: options.token ?? config.githubToken,
        owner: options.owner,
        repo: options.repo,
        assets: splitCsv(options.assets ?? ""),
        push: options.push !== false,
      });
      logger.success(`Release completed: ${result}`);
    });
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
