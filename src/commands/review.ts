import path from "node:path";

import type { Command } from "commander";

import { logger } from "../logger/logger.js";
import { reviewService } from "../review/ReviewService.js";
import { safeWriteFile } from "../utils/files.js";
import { resolveRoot } from "../utils/path.js";

interface ReviewOptions {
  root?: string;
  output?: string;
}

export function registerReviewCommand(program: Command): void {
  program
    .command("review")
    .description("Analyze code for quality, performance, React, accessibility, and security issues.")
    .option("-r, --root <path>", "Project root")
    .option("-o, --output <file>", "Report output", "docs/stardev-review.md")
    .action(async (options: ReviewOptions) => {
      const root = resolveRoot(options.root);
      const findings = await reviewService.analyze(root);
      const report = reviewService.toMarkdown(findings);
      await safeWriteFile(path.resolve(root, options.output ?? "docs/stardev-review.md"), report);
      logger.success(`Review completed with ${findings.length} finding(s)`);
    });
}
