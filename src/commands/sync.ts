import type { Command } from "commander";

import { logger } from "../logger/logger.js";
import { syncService } from "../sync/SyncService.js";
import { resolveRoot } from "../utils/path.js";

interface SyncCommandOptions {
  root?: string;
  repo?: string;
  branch?: string;
  message?: string;
  push?: boolean;
  dryRun?: boolean;
  allowSecrets?: boolean;
}

export function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .description("Safely commit and push the project to a GitHub repository.")
    .option("-r, --root <path>", "Project root")
    .option("--repo <url>", "Git remote URL, for example https://github.com/user/repo.git")
    .option("-b, --branch <branch>", "Branch to sync", "main")
    .option("-m, --message <message>", "Commit message")
    .option("--no-push", "Commit locally without pushing")
    .option("--dry-run", "Print Git actions without writing commits or pushing")
    .option("--allow-secrets", "Allow syncing files that look like secret files")
    .action(async (options: SyncCommandOptions) => {
      const result = await syncService.sync({
        root: resolveRoot(options.root),
        repo: options.repo,
        branch: options.branch ?? "main",
        message: options.message,
        push: options.push !== false,
        dryRun: options.dryRun ?? false,
        allowSecrets: options.allowSecrets ?? false,
      });

      logger.success(
        `Sync complete: ${result.committed ? "committed" : "no commit"}, ${
          result.pushed ? "pushed" : "not pushed"
        }`,
      );
      logger.info(`Message: ${result.message}`);
      if (result.remote) {
        logger.info(`Remote: ${result.remote}`);
      }
    });
}
