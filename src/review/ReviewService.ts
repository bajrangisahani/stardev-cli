import path from "node:path";

import fs from "fs-extra";

import type { ReviewFinding } from "../types/index.js";
import { listFiles } from "../utils/files.js";

export class ReviewService {
  public async analyze(root: string): Promise<ReviewFinding[]> {
    const files = await listFiles(root, [".ts", ".tsx", ".js", ".jsx", ".css", ".html"]);
    const findings: ReviewFinding[] = [];
    const seenBasenames = new Map<string, string>();

    for (const file of files) {
      const content = await fs.readFile(file, "utf8");
      const relative = path.relative(root, file);
      this.inspectFile(relative, content, findings);

      const basename = path.basename(file);
      const existing = seenBasenames.get(basename);
      if (existing && basename !== "index.ts" && basename !== "index.tsx") {
        findings.push({
          severity: "info",
          category: "duplicate-name",
          file: relative,
          message: `Another file is also named ${basename}.`,
          suggestion: `Check whether ${existing} and ${relative} represent duplicate responsibilities.`,
        });
      }
      seenBasenames.set(basename, relative);
    }

    return findings;
  }

  public toMarkdown(findings: ReviewFinding[]): string {
    const grouped = findings.reduce<Record<string, ReviewFinding[]>>((acc, finding) => {
      const bucket = acc[finding.category] ?? [];
      bucket.push(finding);
      acc[finding.category] = bucket;
      return acc;
    }, {});

    const sections = Object.entries(grouped)
      .map(([category, items]) => {
        const body = items
          .map((item) => {
            const location = item.file ? ` (${item.file}${item.line ? `:${item.line}` : ""})` : "";
            return `- **${item.severity.toUpperCase()}**${location}: ${item.message}\n  - Suggestion: ${item.suggestion}`;
          })
          .join("\n");
        return `## ${category}\n\n${body}`;
      })
      .join("\n\n");

    return `# STARDEV Code Review Report

Generated at ${new Date().toISOString()}

${findings.length === 0 ? "No issues detected by the static review pass." : sections}
`;
  }

  private inspectFile(file: string, content: string, findings: ReviewFinding[]): void {
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/console\.log/.test(line)) {
        findings.push({
          severity: "warning",
          category: "debug-code",
          file,
          line: index + 1,
          message: "console.log detected in source code.",
          suggestion: "Use a structured logger or remove debug output before release.",
        });
      }
      if (/eval\(/.test(line)) {
        findings.push({
          severity: "error",
          category: "security",
          file,
          line: index + 1,
          message: "eval usage can execute untrusted code.",
          suggestion: "Replace eval with explicit parsing or a safe interpreter.",
        });
      }
      if (/<img(?![^>]*alt=)/i.test(line)) {
        findings.push({
          severity: "warning",
          category: "accessibility",
          file,
          line: index + 1,
          message: "Image tag appears to be missing alt text.",
          suggestion: "Add meaningful alt text or an empty alt attribute for decorative images.",
        });
      }
      if (/TODO|FIXME/i.test(line)) {
        findings.push({
          severity: "info",
          category: "maintenance",
          file,
          line: index + 1,
          message: "Outstanding maintenance marker found.",
          suggestion: "Convert this into a tracked issue or resolve it before publishing.",
        });
      }
    });

    if (content.length > 30_000) {
      findings.push({
        severity: "warning",
        category: "complexity",
        file,
        message: "Large source file detected.",
        suggestion: "Consider splitting the module around domain responsibilities.",
      });
    }
  }
}

export const reviewService = new ReviewService();
