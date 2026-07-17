import path from "node:path";

import type { PackageManager, ProjectInfo } from "../types/index.js";
import { safeWriteFile } from "../utils/files.js";

export interface CiOptions {
  nodeVersion: string;
  includeAudit: boolean;
}

export class CiGenerator {
  public async write(project: ProjectInfo, options: CiOptions): Promise<string> {
    const output = path.join(project.root, ".github", "workflows", "stardev-ci.yml");
    await safeWriteFile(output, this.generate(project, options));
    return output;
  }

  public generate(project: ProjectInfo, options: CiOptions): string {
    const pm = project.packageManager ?? "npm";
    const steps = [
      this.checkoutStep(),
      this.setupNodeStep(options.nodeVersion, pm),
      this.installStep(pm),
      ...(options.includeAudit ? [this.runStep("Audit dependencies", this.auditCommand(pm))] : []),
      ...this.scriptStep(project, "lint", "Lint"),
      ...this.scriptStep(project, "typecheck", "Typecheck"),
      ...this.scriptStep(project, "test", "Test"),
      ...this.scriptStep(project, "build", "Build"),
    ];

    return `name: STARDEV CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  quality:
    name: Quality Gate
    runs-on: ubuntu-latest
    steps:
${steps.join("\n")}
`;
  }

  private checkoutStep(): string {
    return `      - name: Checkout
        uses: actions/checkout@v4`;
  }

  private setupNodeStep(nodeVersion: string, packageManager: PackageManager): string {
    const cache = packageManager === "bun" ? "" : `
          cache: ${packageManager}`;
    return `      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${nodeVersion}${cache}`;
  }

  private installStep(packageManager: PackageManager): string {
    const commands: Record<PackageManager, string> = {
      npm: "npm ci",
      pnpm: "corepack enable && pnpm install --frozen-lockfile",
      yarn: "corepack enable && yarn install --frozen-lockfile",
      bun: "npm install -g bun && bun install --frozen-lockfile",
    };
    return this.runStep("Install dependencies", commands[packageManager]);
  }

  private scriptStep(project: ProjectInfo, script: string, label: string): string[] {
    if (!project.scripts[script]) {
      return [];
    }
    return [this.runStep(label, this.runScript(project.packageManager ?? "npm", script))];
  }

  private runScript(packageManager: PackageManager, script: string): string {
    if (packageManager === "npm") {
      return `npm run ${script}`;
    }
    return `${packageManager} run ${script}`;
  }

  private auditCommand(packageManager: PackageManager): string {
    if (packageManager === "npm") {
      return "npm audit --audit-level=moderate";
    }
    if (packageManager === "pnpm") {
      return "pnpm audit --audit-level moderate";
    }
    if (packageManager === "yarn") {
      return "yarn npm audit --severity moderate";
    }
    return "bun audit";
  }

  private runStep(name: string, command: string): string {
    return `      - name: ${name}
        run: ${command}`;
  }
}

export const ciGenerator = new CiGenerator();
