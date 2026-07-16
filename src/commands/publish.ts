import type { Command } from "commander";

import { configStore } from "../config/ConfigStore.js";
import { githubService } from "../github/GitHubService.js";
import { logger } from "../logger/logger.js";
import { readmeGenerator } from "../readme/ReadmeGenerator.js";
import { safeWriteFile } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot, slugify } from "../utils/path.js";

interface PublishOptions {
  root?: string;
  description?: string;
  private?: boolean;
  dryRun?: boolean;
}

export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Generate README and publish the project to GitHub.")
    .option("-r, --root <path>", "Project root")
    .option("-d, --description <text>", "Repository description")
    .option("--private", "Create a private repository")
    .option("--dry-run", "Generate local artifacts without creating the GitHub repository")
    .action(async (options: PublishOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const config = await configStore.getAll();
      const description = options.description ?? `${project.name} built and published with STARDEV CLI.`;

      await safeWriteFile(
        `${root}/README.md`,
        readmeGenerator.generate({
          project,
          description,
          author: config.defaultAuthor ?? config.gitUsername ?? "Project Author",
          license: config.license ?? "MIT",
          githubUrl: undefined,
          liveDemo: undefined,
          socialLinks: [],
          features: ["Automated setup", "Clean documentation", "Deployment-ready workflow"],
          roadmap: ["Add tests", "Publish release", "Maintain changelog"],
        }),
      );

      if (options.dryRun) {
        logger.success("Publish dry run completed");
        return;
      }

      if (!config.githubToken) {
        logger.warn("GitHub token missing. Run `stardev config set` or pass through `stardev github`.");
        return;
      }

      const url = await githubService.createAndPublish(project, {
        token: config.githubToken,
        name: slugify(project.name),
        description,
        privateRepo: options.private ?? false,
        topics: [project.framework, project.language, "stardev"],
        push: true,
        openBrowser: true,
      });
      logger.success(`Published: ${url}`);
    });
}
