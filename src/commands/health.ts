import path from "node:path";

import type { Command } from "commander";

import { healthService } from "../health/HealthService.js";
import { logger } from "../logger/logger.js";
import { safeWriteFile } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface HealthCommandOptions {
  root?: string;
  output?: string;
  json?: boolean;
}

export function registerHealthCommand(program: Command): void {
  program
    .command("health")
    .description("Score README, tests, security, Git, package health, CI, and deployment readiness.")
    .option("-r, --root <path>", "Project root")
    .option("-o, --output <file>", "Report output", "docs/stardev-health.md")
    .option("--json", "Write JSON report instead of Markdown")
    .action(async (options: HealthCommandOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const report = await healthService.analyze(project);
      const output = path.resolve(root, options.output ?? "docs/stardev-health.md");
      await safeWriteFile(
        output,
        options.json ? `${JSON.stringify(report, null, 2)}\n` : healthService.toMarkdown(report),
      );

      logger.success(`Health score: ${report.score}/${report.maxScore} (${report.grade})`);
      for (const check of report.checks) {
        const line = `${check.name}: ${check.score}/${check.maxScore} - ${check.message}`;
        if (check.status === "pass") {
          logger.success(line);
        } else if (check.status === "warn") {
          logger.warn(line);
        } else {
          logger.error(line);
        }
      }
      logger.info(`Report: ${output}`);
    });
}
