import axios from "axios";

import { StardevError } from "../errors/StardevError.js";
import type { DeploymentProvider, ProjectInfo } from "../types/index.js";
import { runCommand } from "../utils/exec.js";

export interface DeployOptions {
  provider: DeploymentProvider;
  production: boolean;
  dryRun: boolean;
}

export class DeploymentService {
  public suggestProvider(project: ProjectInfo): DeploymentProvider {
    if (project.framework === "next" || project.framework === "react" || project.framework === "vue") {
      return "vercel";
    }
    if (project.framework === "django" || project.framework === "flask" || project.framework === "express") {
      return "render";
    }
    return "railway";
  }

  public async deploy(project: ProjectInfo, options: DeployOptions): Promise<void> {
    if (options.provider === "render") {
      await this.deployRender();
      return;
    }

    const args = this.argsFor(options);
    const binary = this.binaryFor(options.provider);
    await runCommand(binary, args, { cwd: project.root, dryRun: options.dryRun });
  }

  private binaryFor(provider: DeploymentProvider): string {
    switch (provider) {
      case "vercel":
        return "vercel";
      case "netlify":
        return "netlify";
      case "railway":
        return "railway";
      case "render":
        return "render";
      case "firebase":
        return "firebase";
    }
  }

  private argsFor(options: DeployOptions): string[] {
    switch (options.provider) {
      case "vercel":
        return options.production ? ["--prod"] : [];
      case "netlify":
        return options.production ? ["deploy", "--prod"] : ["deploy"];
      case "railway":
        return ["up"];
      case "firebase":
        return ["deploy"];
      case "render":
        return [];
    }
  }

  private async deployRender(): Promise<void> {
    const deployHook = process.env.RENDER_DEPLOY_HOOK_URL;
    if (deployHook) {
      await axios.post(deployHook, undefined, { timeout: 30_000 });
      return;
    }

    const serviceId = process.env.RENDER_SERVICE_ID;
    const apiKey = process.env.RENDER_API_KEY;
    if (!serviceId || !apiKey) {
      throw new StardevError(
        "DEPLOYMENT_ERROR",
        "Render deployment requires RENDER_DEPLOY_HOOK_URL or both RENDER_SERVICE_ID and RENDER_API_KEY.",
      );
    }

    await axios.post(
      `https://api.render.com/v1/services/${serviceId}/deploys`,
      {},
      {
        timeout: 30_000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
  }
}

export const deploymentService = new DeploymentService();
