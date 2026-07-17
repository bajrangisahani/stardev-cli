import { simpleGit, type SimpleGit, type StatusResult } from "simple-git";

import { StardevError } from "../errors/StardevError.js";
import { logger } from "../logger/logger.js";

export interface SyncOptions {
  root: string;
  repo: string | undefined;
  branch: string;
  message: string | undefined;
  push: boolean;
  dryRun: boolean;
  allowSecrets: boolean;
}

export interface SyncResult {
  committed: boolean;
  pushed: boolean;
  message: string;
  remote: string | undefined;
  branch: string;
}

export class SyncService {
  public async sync(options: SyncOptions): Promise<SyncResult> {
    const git = simpleGit(options.root);
    await this.ensureRepository(git, options);

    const remote = await this.ensureRemote(git, options);
    await this.ensureBranch(git, options.branch, options.dryRun);

    if (!options.allowSecrets) {
      await this.assertNoObviousSecretFiles(git);
    }

    await this.stageAll(git, options.dryRun);
    const status = await git.status();

    if (status.files.length === 0) {
      logger.info("No local changes to sync");
      if (options.push && remote) {
        await this.push(git, options.branch, options.dryRun);
        return {
          committed: false,
          pushed: !options.dryRun,
          message: "No changes to commit",
          remote,
          branch: options.branch,
        };
      }

      return {
        committed: false,
        pushed: false,
        message: "No changes to commit",
        remote,
        branch: options.branch,
      };
    }

    const message = options.message ?? this.createSmartMessage(status);
    if (options.dryRun) {
      logger.command(`git commit -m "${message}"`);
    } else {
      await git.commit(message);
    }

    if (options.push) {
      if (!remote) {
        throw new StardevError("GIT_ERROR", "Remote missing. Pass --repo or set origin first.");
      }
      await this.push(git, options.branch, options.dryRun);
    }

    return {
      committed: !options.dryRun,
      pushed: options.push && !options.dryRun,
      message,
      remote,
      branch: options.branch,
    };
  }

  private async ensureRepository(git: SimpleGit, options: SyncOptions): Promise<void> {
    const isRepo = await git.checkIsRepo().catch(() => false);
    if (isRepo) {
      return;
    }

    if (options.dryRun) {
      logger.command("git init");
      return;
    }

    await git.init();
  }

  private async ensureRemote(git: SimpleGit, options: SyncOptions): Promise<string | undefined> {
    const remotes = await git.getRemotes(true).catch(() => []);
    const origin = remotes.find((remote) => remote.name === "origin");

    if (options.repo) {
      if (options.dryRun) {
        logger.command(origin ? `git remote set-url origin ${options.repo}` : `git remote add origin ${options.repo}`);
      } else if (origin) {
        await git.remote(["set-url", "origin", options.repo]);
      } else {
        await git.addRemote("origin", options.repo);
      }
      return options.repo;
    }

    return origin?.refs.push ?? origin?.refs.fetch;
  }

  private async ensureBranch(git: SimpleGit, branch: string, dryRun: boolean): Promise<void> {
    if (dryRun) {
      logger.command(`git branch -M ${branch}`);
      return;
    }
    await git.branch(["-M", branch]);
  }

  private async stageAll(git: SimpleGit, dryRun: boolean): Promise<void> {
    if (dryRun) {
      logger.command("git add .");
      return;
    }
    await git.add(".");
  }

  private async push(git: SimpleGit, branch: string, dryRun: boolean): Promise<void> {
    if (dryRun) {
      logger.command(`git push -u origin ${branch}`);
      return;
    }
    await git.push("origin", branch, ["--set-upstream"]);
  }

  private async assertNoObviousSecretFiles(git: SimpleGit): Promise<void> {
    const status = await git.status();
    const secretFiles = status.files
      .map((file) => file.path)
      .filter((file) => /^\.env($|\.(?!example$))|\.pem$|\.key$|id_rsa$/i.test(file));

    if (secretFiles.length > 0) {
      throw new StardevError(
        "GIT_ERROR",
        `Refusing to sync possible secret files: ${secretFiles.join(", ")}. Use --allow-secrets only if intentional.`,
      );
    }
  }

  private createSmartMessage(status: StatusResult): string {
    const files = status.files.map((file) => file.path);
    const onlyDocs = files.every((file) => /^(README|docs\/|.*\.md$)/i.test(file));
    const onlyConfig = files.every((file) => /(^package(-lock)?\.json$|config|\.json$|\.ya?ml$)/i.test(file));
    const hasSource = files.some((file) => /^src\/|\.tsx?$|\.jsx?$|\.py$|\.java$|\.php$/i.test(file));

    if (onlyDocs) {
      return "docs: update project documentation";
    }
    if (onlyConfig) {
      return "chore: update project configuration";
    }
    if (hasSource) {
      return "feat: sync project updates";
    }
    return "chore: sync project";
  }
}

export const syncService = new SyncService();
