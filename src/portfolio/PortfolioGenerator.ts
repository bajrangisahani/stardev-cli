import path from "node:path";

import fs from "fs-extra";

import type { ProjectInfo } from "../types/index.js";

export interface PortfolioProject {
  name: string;
  description: string;
  technologies: string[];
  liveDemo: string | undefined;
  github: string | undefined;
  screenshots: string[];
  updatedAt: string;
}

export class PortfolioGenerator {
  public async createProjectJson(
    project: ProjectInfo,
    description: string,
    liveDemo?: string,
    github?: string,
  ): Promise<PortfolioProject> {
    const screenshotsDir = path.join(project.root, "screenshots");
    const screenshots = (await fs.pathExists(screenshotsDir))
      ? (await fs.readdir(screenshotsDir))
          .filter((file) => /\.(png|jpe?g|webp|gif)$/i.test(file))
          .map((file) => `screenshots/${file}`)
      : [];

    return {
      name: project.name,
      description,
      technologies: [
        project.framework,
        project.language,
        ...Object.keys(project.dependencies).slice(0, 8),
      ].filter((value) => value !== "unknown"),
      liveDemo,
      github,
      screenshots,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const portfolioGenerator = new PortfolioGenerator();
