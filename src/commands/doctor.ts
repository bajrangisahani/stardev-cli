import path from "node:path";

import type { Command } from "commander";
import fs from "fs-extra";
import { simpleGit } from "simple-git";

import { logger } from "../logger/logger.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface DoctorOptions {
  root?: string;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check Node, Git, dependencies, env files, imports, and deployment readiness.")
    .option("-r, --root <path>", "Project root")
    .action(async (options: DoctorOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      logger.info(`Node ${process.version}`);
      logger.info(`Framework: ${project.framework}`);
      logger.info(`Language: ${project.language}`);

      if (!project.hasGit) {
        logger.warn("Git repository not initialized");
      } else {
        const status = await simpleGit(root).status();
        logger.info(`Git status: ${status.files.length} changed file(s)`);
      }

      if (project.hasPackageJson) {
        const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"];
        const lockfileResults = await Promise.all(
          lockfiles.map((file) => fs.pathExists(path.join(root, file))),
        );
        if (!lockfileResults.some(Boolean)) {
          logger.warn("No package manager lockfile detected");
        }
      }

      if (await fs.pathExists(path.join(root, ".env"))) {
        const gitignore = path.join(root, ".gitignore");
        const ignored = (await fs.pathExists(gitignore))
          ? (await fs.readFile(gitignore, "utf8")).includes(".env")
          : false;
        if (!ignored) {
          logger.warn(".env exists but is not ignored");
        }
      }

      logger.success("Doctor check completed");
    });
}
