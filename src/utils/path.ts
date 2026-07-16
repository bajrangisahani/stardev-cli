import path from "node:path";
import process from "node:process";

export function resolveRoot(root?: string): string {
  return path.resolve(root ?? process.cwd());
}

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
