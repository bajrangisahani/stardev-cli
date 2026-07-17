import path from "node:path";

import fs from "fs-extra";

import { listFiles, safeWriteFile } from "../utils/files.js";
import { toPosixPath } from "../utils/path.js";

export interface EnvVariableFinding {
  key: string;
  files: string[];
}

const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".java",
  ".php",
  ".go",
  ".rs",
];

export class EnvScanner {
  public async scan(root: string): Promise<EnvVariableFinding[]> {
    const files = await listFiles(root, SOURCE_EXTENSIONS);
    const found = new Map<string, Set<string>>();

    for (const file of files) {
      const content = await fs.readFile(file, "utf8");
      const relative = toPosixPath(path.relative(root, file));
      for (const key of this.extractKeys(content)) {
        const filesForKey = found.get(key) ?? new Set<string>();
        filesForKey.add(relative);
        found.set(key, filesForKey);
      }
    }

    return [...found.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, filesForKey]) => ({ key, files: [...filesForKey].sort() }));
  }

  public async writeExample(root: string, output: string, overwrite: boolean): Promise<string> {
    const variables = await this.scan(root);
    const outputPath = path.resolve(root, output);

    if (!overwrite && (await fs.pathExists(outputPath))) {
      const existing = await fs.readFile(outputPath, "utf8");
      const existingKeys = new Set(
        existing
          .split(/\r?\n/)
          .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
          .filter((key): key is string => Boolean(key)),
      );
      const missing = variables.filter((variable) => !existingKeys.has(variable.key));
      if (missing.length === 0) {
        return outputPath;
      }
      await fs.appendFile(outputPath, `\n${this.render(missing)}`);
      return outputPath;
    }

    await safeWriteFile(outputPath, this.render(variables));
    return outputPath;
  }

  public render(variables: EnvVariableFinding[]): string {
    if (variables.length === 0) {
      return "# No environment variables were detected.\n";
    }

    return `${variables
      .map((variable) => `# Used in: ${variable.files.join(", ")}\n${variable.key}=`)
      .join("\n\n")}\n`;
  }

  private extractKeys(content: string): string[] {
    const patterns = [
      /\bprocess\.env\.([A-Z][A-Z0-9_]*)\b/g,
      /\bprocess\.env\[['"`]([A-Z][A-Z0-9_]*)['"`]\]/g,
      /\bimport\.meta\.env\.([A-Z][A-Z0-9_]*)\b/g,
      /\bDeno\.env\.get\(['"`]([A-Z][A-Z0-9_]*)['"`]\)/g,
      /\bos\.Getenv\(['"`]([A-Z][A-Z0-9_]*)['"`]\)/g,
      /\bSystem\.getenv\(['"`]([A-Z][A-Z0-9_]*)['"`]\)/g,
      /\bgetenv\(['"`]([A-Z][A-Z0-9_]*)['"`]\)/g,
    ];

    const keys = new Set<string>();
    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) {
        if (match[1]) {
          keys.add(match[1]);
        }
      }
    }
    return [...keys];
  }
}

export const envScanner = new EnvScanner();
