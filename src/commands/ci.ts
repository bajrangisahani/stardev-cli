import type { Command } from "commander";

import { ciGenerator } from "../ci/CiGenerator.js";
import { logger } from "../logger/logger.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface CiCommandOptions {
  root?: string;
  node?: string;
  audit?: boolean;
}

export function registerCiCommand(program: Command): void {
  program
    .command("ci")
    .description("Generate a GitHub Actions workflow for install, lint, typecheck, test, and build.")
    .option("-r, --root <path>", "Project root")
    .option("--node <version>", "Node.js version", "20")
    .option("--audit", "Include dependency audit step")
    .action(async (options: CiCommandOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const output = await ciGenerator.write(project, {
        nodeVersion: options.node ?? "20",
        includeAudit: options.audit ?? false,
      });
      logger.success(`CI workflow generated: ${output}`);
    });
}
