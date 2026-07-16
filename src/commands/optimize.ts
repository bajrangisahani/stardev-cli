import type { Command } from "commander";
import prettier from "prettier";

import { logger } from "../logger/logger.js";
import { runCommand } from "../utils/exec.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface OptimizeOptions {
  root?: string;
  audit?: boolean;
  format?: boolean;
  lint?: boolean;
  dryRun?: boolean;
}

export function registerOptimizeCommand(program: Command): void {
  program
    .command("optimize")
    .description("Run audit, formatting, linting, and dependency hygiene checks.")
    .option("-r, --root <path>", "Project root")
    .option("--no-audit", "Skip npm audit")
    .option("--no-format", "Skip Prettier")
    .option("--no-lint", "Skip ESLint")
    .option("--dry-run", "Print commands without executing")
    .action(async (options: OptimizeOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const pm = project.packageManager ?? "npm";

      if (project.hasPackageJson && options.audit !== false) {
        await runCommand(pm, pm === "npm" ? ["audit"] : ["audit"], { cwd: root, dryRun: options.dryRun });
      }

      if (options.format !== false) {
        const info = await prettier.getFileInfo(root);
        logger.info(`Prettier available for project root: ${String(!info.ignored)}`);
        await runCommand(pm === "npm" ? "npx" : pm, pm === "npm" ? ["prettier", "--write", "."] : ["prettier", "--write", "."], {
          cwd: root,
          dryRun: options.dryRun,
        });
      }

      if (project.scripts.lint && options.lint !== false) {
        await runCommand(pm, ["run", "lint"], { cwd: root, dryRun: options.dryRun });
      }

      logger.success("Optimization workflow completed");
    });
}
