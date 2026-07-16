import path from "node:path";

import type { Command } from "commander";

import { logger } from "../logger/logger.js";
import { screenshotService } from "../screenshots/ScreenshotService.js";
import { resolveRoot } from "../utils/path.js";

interface ScreenshotOptions {
  root?: string;
  url: string;
  widths?: string;
  fullPage?: boolean;
}

export function registerScreenshotCommand(program: Command): void {
  program
    .command("screenshot")
    .description("Capture website screenshots, thumbnails, compressed images, and an animated GIF preview.")
    .requiredOption("-u, --url <url>", "Website URL")
    .option("-r, --root <path>", "Project root")
    .option("-w, --widths <items>", "Comma-separated viewport widths", "390,768,1440")
    .option("--full-page", "Capture full-page screenshots")
    .action(async (options: ScreenshotOptions) => {
      const root = resolveRoot(options.root);
      const widths = (options.widths ?? "390,768,1440")
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value > 0);
      const result = await screenshotService.capture({
        url: options.url,
        outDir: path.join(root, "screenshots"),
        widths,
        fullPage: options.fullPage ?? false,
      });

      logger.success(`Captured ${result.screenshots.length} screenshot(s)`);
      logger.info(`Preview: ${result.preview}`);
    });
}
