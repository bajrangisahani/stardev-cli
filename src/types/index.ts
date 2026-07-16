export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type ProjectFramework =
  | "react"
  | "next"
  | "angular"
  | "vue"
  | "node"
  | "express"
  | "flask"
  | "django"
  | "java"
  | "spring-boot"
  | "php"
  | "laravel"
  | "unknown";

export type DeploymentProvider = "vercel" | "netlify" | "railway" | "render" | "firebase";

export interface ProjectInfo {
  name: string;
  root: string;
  framework: ProjectFramework;
  packageManager: PackageManager | undefined;
  language: "typescript" | "javascript" | "python" | "java" | "php" | "mixed" | "unknown";
  hasGit: boolean;
  hasPackageJson: boolean;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface ReadmeInput {
  project: ProjectInfo;
  description: string;
  author: string;
  license: string;
  githubUrl: string | undefined;
  liveDemo: string | undefined;
  socialLinks: string[];
  features: string[];
  roadmap: string[];
}

export interface ReviewFinding {
  severity: "info" | "warning" | "error";
  category: string;
  file?: string;
  line?: number;
  message: string;
  suggestion: string;
}

export interface AiRequest {
  task: "readme" | "description" | "proposal" | "review" | "changelog";
  prompt: string;
  context: Record<string, unknown> | undefined;
}

export interface AiProvider {
  readonly name: string;
  complete(request: AiRequest): Promise<string>;
}

export interface LocalConfig {
  githubToken?: string | undefined;
  vercelToken?: string | undefined;
  defaultAuthor?: string | undefined;
  portfolioPath?: string | undefined;
  license?: string | undefined;
  company?: string | undefined;
  gitUsername?: string | undefined;
  gitEmail?: string | undefined;
}
