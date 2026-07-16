import path from "node:path";

import fs from "fs-extra";

import { StardevError } from "../errors/StardevError.js";

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    if (!(await fs.pathExists(filePath))) {
      return fallback;
    }
    return (await fs.readJson(filePath)) as T;
  } catch (error) {
    throw new StardevError("FILE_SYSTEM_ERROR", `Unable to read JSON file: ${filePath}`, error);
  }
}

export async function writeFileIfMissing(filePath: string, content: string): Promise<boolean> {
  if (await fs.pathExists(filePath)) {
    return false;
  }
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
  return true;
}

export async function safeWriteFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
}

export async function listFiles(root: string, extensions: string[]): Promise<string[]> {
  const ignored = new Set(["node_modules", ".git", "dist", "coverage", ".next", "build"]);
  const results: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (ignored.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (extensions.includes(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }

  await walk(root);
  return results;
}
