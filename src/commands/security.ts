import path from "node:path";

import type { Command } from "commander";

import { logger } from "../logger/logger.js";
import { securityScanner } from "../security/SecurityScanner.js";
import { runCommand } from "../utils/exec.js";
import { safeWriteFile } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface SecurityCommandOptions {
  root?: string;
  output?: string;
  audit?: boolean;
}

export function registerSecurityCommand(program: Command): void {
  program
    .command("security")
    .description("Scan for secrets, risky code patterns, and optional dependency audit issues.")
    .option("-r, --root <path>", "Project root")
    .option("-o, --output <file>", "Report output", "docs/stardev-security.md")
    .option("--audit", "Run package manager dependency audit after static scanning")
    .action(async (options: SecurityCommandOptions) => {
      const root = resolveRoot(options.root);
      const findings = await securityScanner.scan(root);
      const output = path.resolve(root, options.output ?? "docs/stardev-security.md");
      await safeWriteFile(output, securityScanner.toMarkdown(findings));

      if (options.audit) {
        const project = await projectDetector.detect(root);
        if (project.packageManager) {
          await runCommand(project.packageManager, ["audit"], { cwd: root });
        } else {
          logger.warn("No package manager detected; skipping dependency audit");
        }
      }

      const errors = findings.filter((finding) => finding.severity === "error").length;
      const warnings = findings.filter((finding) => finding.severity === "warning").length;
      if (errors > 0) {
        logger.error(`Security scan found ${errors} error(s) and ${warnings} warning(s)`);
      } else if (warnings > 0) {
        logger.warn(`Security scan found ${warnings} warning(s)`);
      } else {
        logger.success("Security scan passed");
      }
      logger.info(`Report: ${output}`);
    });
}
