import path from "node:path";

import fs from "fs-extra";
import { simpleGit } from "simple-git";

import { securityScanner } from "../security/SecurityScanner.js";
import type { ProjectInfo } from "../types/index.js";

export interface HealthCheck {
  name: string;
  score: number;
  maxScore: number;
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface HealthReport {
  score: number;
  maxScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: HealthCheck[];
}

export class HealthService {
  public async analyze(project: ProjectInfo): Promise<HealthReport> {
    const checks: HealthCheck[] = [
      await this.readme(project.root),
      await this.license(project.root),
      await this.git(project.root),
      await this.packageHealth(project),
      await this.tests(project.root, project),
      await this.envExample(project.root),
      await this.ci(project.root),
      await this.security(project.root),
      await this.deployReadiness(project),
    ];

    const score = checks.reduce((total, check) => total + check.score, 0);
    const maxScore = checks.reduce((total, check) => total + check.maxScore, 0);
    return {
      score,
      maxScore,
      grade: this.grade(score / maxScore),
      checks,
    };
  }

  public toMarkdown(report: HealthReport): string {
    return `# STARDEV Health Report

Score: ${report.score}/${report.maxScore}
Grade: ${report.grade}

${report.checks
  .map(
    (check) =>
      `- **${check.name}**: ${check.score}/${check.maxScore} (${check.status}) - ${check.message}`,
  )
  .join("\n")}
`;
  }

  private async readme(root: string): Promise<HealthCheck> {
    const readme = path.join(root, "README.md");
    if (!(await fs.pathExists(readme))) {
      return this.check("README", 0, 10, "fail", "README.md missing.");
    }
    const content = await fs.readFile(readme, "utf8");
    const strong = ["Installation", "Usage", "License"].filter((section) => content.includes(section));
    return this.check(
      "README",
      Math.min(10, 4 + strong.length * 2),
      10,
      strong.length >= 2 ? "pass" : "warn",
      "README.md exists with core project sections.",
    );
  }

  private async license(root: string): Promise<HealthCheck> {
    const exists = await fs.pathExists(path.join(root, "LICENSE"));
    return this.check("License", exists ? 10 : 0, 10, exists ? "pass" : "fail", exists ? "LICENSE exists." : "LICENSE missing.");
  }

  private async git(root: string): Promise<HealthCheck> {
    const git = simpleGit(root);
    const isRepo = await git.checkIsRepo().catch(() => false);
    if (!isRepo) {
      return this.check("Git", 0, 10, "fail", "Git repository missing.");
    }
    const status = await git.status();
    return this.check(
      "Git",
      status.files.length === 0 ? 10 : 7,
      10,
      status.files.length === 0 ? "pass" : "warn",
      status.files.length === 0 ? "Working tree is clean." : `${status.files.length} uncommitted file(s).`,
    );
  }

  private async packageHealth(project: ProjectInfo): Promise<HealthCheck> {
    if (!project.hasPackageJson) {
      return this.check("Package", 5, 10, "warn", "package.json not detected; skipping Node package checks.");
    }
    const hasBuild = Boolean(project.scripts.build);
    const hasLock = await Promise.all(
      ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"].map((file) =>
        fs.pathExists(path.join(project.root, file)),
      ),
    );
    const score = (hasBuild ? 5 : 0) + (hasLock.some(Boolean) ? 5 : 0);
    return this.check(
      "Package",
      score,
      10,
      score >= 8 ? "pass" : "warn",
      `${hasBuild ? "Build script present" : "Build script missing"}; ${hasLock.some(Boolean) ? "lockfile present" : "lockfile missing"}.`,
    );
  }

  private async tests(root: string, project: ProjectInfo): Promise<HealthCheck> {
    const hasScript = Boolean(project.scripts.test);
    const hasFolder = (await fs.pathExists(path.join(root, "test"))) || (await fs.pathExists(path.join(root, "tests")));
    const score = (hasScript ? 5 : 0) + (hasFolder ? 5 : 0);
    return this.check(
      "Tests",
      score,
      10,
      score >= 8 ? "pass" : score > 0 ? "warn" : "fail",
      `${hasScript ? "test script present" : "test script missing"}; ${hasFolder ? "test folder present" : "test folder missing"}.`,
    );
  }

  private async envExample(root: string): Promise<HealthCheck> {
    const exists = await fs.pathExists(path.join(root, ".env.example"));
    return this.check("Env Example", exists ? 10 : 0, 10, exists ? "pass" : "warn", exists ? ".env.example exists." : ".env.example missing.");
  }

  private async ci(root: string): Promise<HealthCheck> {
    const exists = await fs.pathExists(path.join(root, ".github", "workflows", "stardev-ci.yml"));
    return this.check("CI", exists ? 10 : 0, 10, exists ? "pass" : "warn", exists ? "STARDEV CI workflow exists." : "CI workflow missing.");
  }

  private async security(root: string): Promise<HealthCheck> {
    const findings = await securityScanner.scan(root);
    const errors = findings.filter((finding) => finding.severity === "error").length;
    const warnings = findings.filter((finding) => finding.severity === "warning").length;
    const score = Math.max(0, 10 - errors * 5 - warnings * 2);
    return this.check(
      "Security",
      score,
      10,
      errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
      findings.length === 0 ? "No security findings detected." : `${errors} error(s), ${warnings} warning(s).`,
    );
  }

  private async deployReadiness(project: ProjectInfo): Promise<HealthCheck> {
    const deployableFrameworks = new Set(["next", "react", "vue", "express", "django", "flask"]);
    const hasBuildOrStart = Boolean(project.scripts.build || project.scripts.start || project.scripts.dev);
    const score = deployableFrameworks.has(project.framework) || hasBuildOrStart ? 10 : 5;
    return this.check(
      "Deploy Readiness",
      score,
      10,
      score === 10 ? "pass" : "warn",
      score === 10 ? "Framework or runtime scripts look deployable." : "Add build/start scripts for clearer deployment.",
    );
  }

  private check(
    name: string,
    score: number,
    maxScore: number,
    status: HealthCheck["status"],
    message: string,
  ): HealthCheck {
    return { name, score, maxScore, status, message };
  }

  private grade(ratio: number): HealthReport["grade"] {
    if (ratio >= 0.9) {
      return "A";
    }
    if (ratio >= 0.8) {
      return "B";
    }
    if (ratio >= 0.7) {
      return "C";
    }
    if (ratio >= 0.6) {
      return "D";
    }
    return "F";
  }
}

export const healthService = new HealthService();
