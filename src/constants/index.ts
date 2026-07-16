export const APP_NAME = "stardev-cli";
export const CLI_NAME = "stardev";
export const DEFAULT_LICENSE = "MIT";
export const DEFAULT_BRANCH = "main";

export const SAFE_ENV_PATTERNS = [".env", ".env.*", "!.env.example"] as const;

export const PROJECT_DIRECTORIES = [
  "screenshots",
  "docs",
  "assets",
  ".github",
] as const;

export const SUPPORTED_DEPLOYMENT_PROVIDERS = [
  "vercel",
  "netlify",
  "railway",
  "render",
  "firebase",
] as const;
