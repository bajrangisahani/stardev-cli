import path from "node:path";

import fs from "fs-extra";

import type { ProjectInfo, ReadmeInput } from "../types/index.js";
import { toPosixPath } from "../utils/path.js";

export class ReadmeGenerator {
  public generate(input: ReadmeInput): string {
    const { project } = input;
    const badges = [
      "![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?logo=typescript&logoColor=white)",
      `![License](https://img.shields.io/badge/License-${encodeURIComponent(input.license)}-22c55e)`,
      "![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)",
    ].join("\n");

    return `# ${project.name}

${badges}

${input.description}

## Features

${this.list(input.features)}

## Tech Stack

- Framework: ${project.framework}
- Language: ${project.language}
- Package manager: ${project.packageManager ?? "not detected"}

## Installation

\`\`\`bash
git clone ${input.githubUrl ?? "<repository-url>"}
cd ${project.name}
${project.packageManager ?? "npm"} install
\`\`\`

## Usage

\`\`\`bash
${this.startCommand(project)}
\`\`\`

## Folder Structure

\`\`\`text
${this.folderStructure(project.root)}
\`\`\`

## Screenshots

Add product screenshots to \`screenshots/\` and reference them here.

## Roadmap

${this.list(input.roadmap)}

## Live Demo

${input.liveDemo ?? "A live demo link will be added after deployment."}

## GitHub

${input.githubUrl ?? "Repository URL will be added after publishing."}

## Author

${input.author}

${input.socialLinks.length > 0 ? input.socialLinks.map((link) => `- ${link}`).join("\n") : ""}

## Contributing

Contributions are welcome. Please open an issue first for major changes so the direction can be discussed clearly.

## License

This project is licensed under the ${input.license} License.
`;
  }

  private list(items: string[]): string {
    if (items.length === 0) {
      return "- Production-ready foundation\n- Clear architecture\n- Developer-friendly workflow";
    }
    return items.map((item) => `- ${item}`).join("\n");
  }

  private startCommand(project: ProjectInfo): string {
    if (project.scripts.dev) {
      return `${project.packageManager ?? "npm"} run dev`;
    }
    if (project.scripts.start) {
      return `${project.packageManager ?? "npm"} start`;
    }
    return "# Add a start script for this project";
  }

  private folderStructure(root: string): string {
    const maxEntries = 80;
    const ignored = new Set(["node_modules", ".git", "dist", "coverage"]);
    const lines: string[] = ["."]; 

    const walk = (directory: string, depth: number): void => {
      if (lines.length >= maxEntries || depth > 3) {
        return;
      }

      const entries = fs
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry) => !ignored.has(entry.name))
        .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));

      for (const entry of entries) {
        if (lines.length >= maxEntries) {
          return;
        }
        const fullPath = path.join(directory, entry.name);
        const relative = toPosixPath(path.relative(root, fullPath));
        lines.push(`${"  ".repeat(depth)}${entry.isDirectory() ? "├──" : "└──"} ${relative}`);
        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        }
      }
    };

    walk(root, 1);
    return lines.join("\n");
  }
}

export const readmeGenerator = new ReadmeGenerator();
