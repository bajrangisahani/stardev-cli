import type { Command } from "commander";
import inquirer from "inquirer";

import { deploymentService } from "../deployment/DeploymentService.js";
import { logger } from "../logger/logger.js";
import type { DeploymentProvider } from "../types/index.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

interface DeployOptions {
  root?: string;
  provider?: DeploymentProvider;
  production?: boolean;
  dryRun?: boolean;
}

export function registerDeployCommand(program: Command): void {
  program
    .command("deploy")
    .description("Deploy to Vercel, Netlify, Railway, Render, or Firebase.")
    .option("-r, --root <path>", "Project root")
    .option("-p, --provider <provider>", "Deployment provider")
    .option("--production", "Production deployment")
    .option("--dry-run", "Print deployment command without executing")
    .action(async (options: DeployOptions) => {
      const root = resolveRoot(options.root);
      const project = await projectDetector.detect(root);
      const suggested = deploymentService.suggestProvider(project);
      const answer = options.provider
        ? { provider: options.provider }
        : await inquirer.prompt<{ provider: DeploymentProvider }>([
            {
              name: "provider",
              message: "Deployment provider",
              type: "list",
              default: suggested,
              choices: ["vercel", "netlify", "railway", "render", "firebase"],
            },
          ]);

      await deploymentService.deploy(project, {
        provider: answer.provider,
        production: options.production ?? false,
        dryRun: options.dryRun ?? false,
      });
      logger.success("Deployment command completed");
    });
}
