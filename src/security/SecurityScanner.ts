import path from "node:path";

import fs from "fs-extra";

import type { ReviewFinding } from "../types/index.js";
import { listFiles } from "../utils/files.js";
import { toPosixPath } from "../utils/path.js";

const SCAN_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yaml",
  ".yml",
  ".py",
  ".java",
  ".php",
  ".go",
  ".rs",
  ".md",
];

export class SecurityScanner {
  public async scan(root: string): Promise<ReviewFinding[]> {
    const files = await listFiles(root, SCAN_EXTENSIONS);
    const findings: ReviewFinding[] = [];
    await this.checkEnvIgnore(root, findings);

    for (const file of files) {
      const relative = toPosixPath(path.relative(root, file));
      const content = await fs.readFile(file, "utf8");
      this.scanContent(relative, content, findings);
    }

    return findings;
  }

  public toMarkdown(findings: ReviewFinding[]): string {
    return `# STARDEV Security Report

Generated at ${new Date().toISOString()}

${findings.length === 0 ? "No security findings detected." : findings.map((finding) => this.renderFinding(finding)).join("\n")}
`;
  }

  private async checkEnvIgnore(root: string, findings: ReviewFinding[]): Promise<void> {
    const envPath = path.join(root, ".env");
    if (!(await fs.pathExists(envPath))) {
      return;
    }

    const gitignorePath = path.join(root, ".gitignore");
    const ignored = (await fs.pathExists(gitignorePath))
      ? (await fs.readFile(gitignorePath, "utf8")).split(/\r?\n/).some((line) => line.trim() === ".env")
      : false;

    if (!ignored) {
      findings.push({
        severity: "error",
        category: "secret-files",
        file: ".env",
        message: ".env exists but is not ignored by Git.",
        suggestion: "Add .env and .env.* to .gitignore before committing.",
      });
    }
  }

  private scanContent(file: string, content: string, findings: ReviewFinding[]): void {
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      if (/gh[pousr]_[A-Za-z0-9_]{20,}/.test(trimmed)) {
        this.addSecretFinding(findings, file, lineNumber, "GitHub token pattern detected.");
      }
      if (/sk-[A-Za-z0-9_-]{20,}/.test(trimmed)) {
        this.addSecretFinding(findings, file, lineNumber, "OpenAI-style API key pattern detected.");
      }
      if (/AKIA[0-9A-Z]{16}/.test(trimmed)) {
        this.addSecretFinding(findings, file, lineNumber, "AWS access key pattern detected.");
      }
      if (/\b(private_key|api[_-]?key|secret|password|token)\b\s*[:=]\s*['"`][^'"`]{12,}['"`]/i.test(trimmed)) {
        this.addSecretFinding(findings, file, lineNumber, "Hard-coded credential-like assignment detected.");
      }
      if (/\beval\s*\(/.test(trimmed)) {
        findings.push({
          severity: "error",
          category: "unsafe-execution",
          file,
          line: lineNumber,
          message: "eval usage can execute untrusted code.",
          suggestion: "Replace eval with explicit parsing or a safe interpreter.",
        });
      }
      if (/\bexec\s*\([^,\n]+(?:\)|,)/.test(trimmed) && !/execFile|spawn/.test(trimmed)) {
        findings.push({
          severity: "warning",
          category: "shell-execution",
          file,
          line: lineNumber,
          message: "Shell execution detected.",
          suggestion: "Prefer argument-array APIs and validate all user-controlled input.",
        });
      }
      if (
        !trimmed.startsWith("if (/") &&
        !trimmed.includes("dangerouslySetInnerHTML|innerHTML") &&
        /dangerouslySetInnerHTML|innerHTML\s*=|document\.write/.test(trimmed)
      ) {
        findings.push({
          severity: "warning",
          category: "xss-risk",
          file,
          line: lineNumber,
          message: "HTML injection sink detected.",
          suggestion: "Sanitize content and avoid direct HTML injection when possible.",
        });
      }
    });
  }

  private addSecretFinding(
    findings: ReviewFinding[],
    file: string,
    line: number,
    message: string,
  ): void {
    findings.push({
      severity: "error",
      category: "secrets",
      file,
      line,
      message,
      suggestion: "Rotate the credential if real, move it to environment variables, and remove it from Git history.",
    });
  }

  private renderFinding(finding: ReviewFinding): string {
    const location = finding.file ? ` (${finding.file}${finding.line ? `:${finding.line}` : ""})` : "";
    return `- **${finding.severity.toUpperCase()}** ${finding.category}${location}: ${finding.message}
  - ${finding.suggestion}`;
  }
}

export const securityScanner = new SecurityScanner();
