import path from "node:path";

import fs from "fs-extra";
import { simpleGit } from "simple-git";

import type { PackageManager, ProjectFramework, ProjectInfo } from "../types/index.js";
import { readJsonFile } from "./files.js";

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export class ProjectDetector {
  public async detect(root: string): Promise<ProjectInfo> {
    const packageJsonPath = path.join(root, "package.json");
    const hasPackageJson = await fs.pathExists(packageJsonPath);
    const packageJson = await readJsonFile<PackageJson>(packageJsonPath, {});
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };

    return {
      name: packageJson.name ?? path.basename(root),
      root,
      framework: await this.detectFramework(root, dependencies),
      packageManager: await this.detectPackageManager(root),
      language: await this.detectLanguage(root, dependencies),
      hasGit: await this.hasGit(root),
      hasPackageJson,
      scripts: packageJson.scripts ?? {},
      dependencies: packageJson.dependencies ?? {},
      devDependencies: packageJson.devDependencies ?? {},
    };
  }

  private async detectFramework(
    root: string,
    dependencies: Record<string, string>,
  ): Promise<ProjectFramework> {
    if (dependencies.next || (await fs.pathExists(path.join(root, "next.config.js")))) {
      return "next";
    }
    if (dependencies["@angular/core"] || (await fs.pathExists(path.join(root, "angular.json")))) {
      return "angular";
    }
    if (dependencies.vue || (await fs.pathExists(path.join(root, "vite.config.ts")))) {
      return "vue";
    }
    if (dependencies.react || dependencies["@vitejs/plugin-react"]) {
      return "react";
    }
    if (dependencies.express) {
      return "express";
    }
    if (await fs.pathExists(path.join(root, "manage.py"))) {
      return "django";
    }
    if (await fs.pathExists(path.join(root, "app.py"))) {
      return "flask";
    }
    if (await fs.pathExists(path.join(root, "pom.xml"))) {
      const pom = await fs.readFile(path.join(root, "pom.xml"), "utf8");
      return pom.includes("spring-boot") ? "spring-boot" : "java";
    }
    if (await fs.pathExists(path.join(root, "composer.json"))) {
      const composer = await readJsonFile<{ require?: Record<string, string> }>(
        path.join(root, "composer.json"),
        {},
      );
      return composer.require?.["laravel/framework"] ? "laravel" : "php";
    }
    if (Object.keys(dependencies).length > 0) {
      return "node";
    }
    return "unknown";
  }

  private async detectPackageManager(root: string): Promise<PackageManager | undefined> {
    if (await fs.pathExists(path.join(root, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (await fs.pathExists(path.join(root, "yarn.lock"))) {
      return "yarn";
    }
    if (await fs.pathExists(path.join(root, "bun.lockb"))) {
      return "bun";
    }
    if (await fs.pathExists(path.join(root, "package-lock.json"))) {
      return "npm";
    }
    if (await fs.pathExists(path.join(root, "package.json"))) {
      return "npm";
    }
    return undefined;
  }

  private async detectLanguage(
    root: string,
    dependencies: Record<string, string>,
  ): Promise<ProjectInfo["language"]> {
    if (dependencies.typescript || (await fs.pathExists(path.join(root, "tsconfig.json")))) {
      return "typescript";
    }
    if (await fs.pathExists(path.join(root, "package.json"))) {
      return "javascript";
    }
    if (
      (await fs.pathExists(path.join(root, "requirements.txt"))) ||
      (await fs.pathExists(path.join(root, "pyproject.toml")))
    ) {
      return "python";
    }
    if ((await fs.pathExists(path.join(root, "pom.xml"))) || (await fs.pathExists(path.join(root, "build.gradle")))) {
      return "java";
    }
    if (await fs.pathExists(path.join(root, "composer.json"))) {
      return "php";
    }
    return "unknown";
  }

  private async hasGit(root: string): Promise<boolean> {
    try {
      return await simpleGit(root).checkIsRepo();
    } catch {
      return false;
    }
  }
}

export const projectDetector = new ProjectDetector();
