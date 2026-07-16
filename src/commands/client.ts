import path from "node:path";

import type { Command } from "commander";

import { logger } from "../logger/logger.js";
import { generateClientAssets } from "../utils/clientAssets.js";
import { safeWriteFile } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface ClientOptions {
  root?: string;
  client?: string;
  rate?: string;
  output?: string;
}

export function registerClientCommand(program: Command): void {
  program
    .command("client")
    .description("Generate proposal, invoice, estimate, Fiverr, Upwork, LinkedIn, GitHub, and summary assets.")
    .option("-r, --root <path>", "Project root")
    .option("-c, --client <name>", "Client name", "Client")
    .option("--rate <amount>", "Hourly or planning rate", "50")
    .option("-o, --output <file>", "Output file", "docs/client-pack.md")
    .action(async (options: ClientOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const content = generateClientAssets(
        project,
        options.client ?? "Client",
        Number.parseInt(options.rate ?? "50", 10),
      );
      await safeWriteFile(path.resolve(root, options.output ?? "docs/client-pack.md"), content);
      logger.success("Client asset pack generated");
    });
}
