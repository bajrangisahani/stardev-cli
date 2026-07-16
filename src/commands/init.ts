import path from "node:path";

import type { Command } from "commander";
import fs from "fs-extra";
import { simpleGit } from "simple-git";

import { PROJECT_DIRECTORIES } from "../constants/index.js";
import { configStore } from "../config/ConfigStore.js";
import { logger } from "../logger/logger.js";
import { defaultReadme, gitignoreTemplate, licenseTemplate } from "../templates/projectFiles.js";
import { writeFileIfMissing } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface InitOptions {
  root?: string;
  commit?: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Detect and prepare a project with docs, assets, Git, and starter metadata.")
    .option("-r, --root <path>", "Project root")
    .option("--no-commit", "Skip initial commit")
    .action(async (options: InitOptions) => {
      const root = resolveRoot(options.root);
      const spinner = logger.spinner("Detecting project");
      const project = await projectDetector.detect(root);
      spinner.succeed(`Detected ${project.framework} project`);

      for (const directory of PROJECT_DIRECTORIES) {
        await fs.ensureDir(path.join(root, directory));
      }

      const config = await configStore.getAll();
      const author = config.defaultAuthor ?? config.gitUsername ?? "Project Author";
      await writeFileIfMissing(path.join(root, ".gitignore"), gitignoreTemplate());
      await writeFileIfMissing(path.join(root, "README.md"), defaultReadme(project));
      await writeFileIfMissing(path.join(root, "LICENSE"), licenseTemplate(author, config.license));
      await writeFileIfMissing(path.join(root, ".env.example"), "");
      await writeFileIfMissing(path.join(root, "screenshots", ".gitkeep"), "");
      await writeFileIfMissing(path.join(root, "docs", "README.md"), "# Documentation\n");

      const git = simpleGit(root);
      if (!(await git.checkIsRepo())) {
        await git.init();
        logger.success("Initialized Git repository");
      }

      if (options.commit !== false) {
        await git.add(".");
        const status = await git.status();
        if (status.files.length > 0) {
          await git.commit("chore: initialize project with stardev");
          logger.success("Created first commit");
        } else {
          logger.info("No changes to commit");
        }
      }

      logger.success("Project initialized");
    });
}
