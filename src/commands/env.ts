import type { Command } from "commander";

import { envScanner } from "../env/EnvScanner.js";
import { logger } from "../logger/logger.js";
import { resolveRoot } from "../utils/path.js";

interface EnvCommandOptions {
  root?: string;
  output?: string;
  force?: boolean;
}

export function registerEnvCommand(program: Command): void {
  program
    .command("env")
    .description("Scan source code and generate .env.example from environment variable usage.")
    .option("-r, --root <path>", "Project root")
    .option("-o, --output <file>", "Output file", ".env.example")
    .option("--force", "Overwrite the output file instead of appending missing keys")
    .action(async (options: EnvCommandOptions) => {
      const root = resolveRoot(options.root);
      const variables = await envScanner.scan(root);
      const output = await envScanner.writeExample(root, options.output ?? ".env.example", options.force ?? false);
      logger.success(`Environment example updated: ${output}`);
      logger.info(`Detected ${variables.length} environment variable(s)`);
    });
}
