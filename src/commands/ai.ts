import path from "node:path";

import type { Command } from "commander";

import { createAiProvider } from "../ai/AiProviders.js";
import { logger } from "../logger/logger.js";
import { safeWriteFile } from "../utils/files.js";
import { projectDetector } from "../utils/ProjectDetector.js";
import { resolveRoot } from "../utils/path.js";

type AiTask = "readme" | "description" | "proposal" | "review" | "changelog";

interface AiOptions {
  root?: string;
  provider?: string;
  apiKey?: string;
  prompt?: string;
  output?: string;
}

export function registerAiCommand(program: Command): void {
  const command = program.command("ai").description("Generate AI-assisted project artifacts.");

  for (const task of ["readme", "description", "proposal", "review", "changelog"] as const) {
    command
      .command(task)
      .description(`Generate AI-assisted ${task} content.`)
      .option("-r, --root <path>", "Project root")
      .option("-p, --provider <provider>", "AI provider", "local")
      .option("--api-key <key>", "Provider API key")
      .option("--prompt <text>", "Additional prompt")
      .option("-o, --output <file>", "Output file")
      .action(async (options: AiOptions) => runAiTask(task, options));
  }
}

async function runAiTask(task: AiTask, options: AiOptions): Promise<void> {
  const root = resolveRoot(options.root);
  const project = await projectDetector.detect(root);
  const provider = createAiProvider(options.provider ?? "local", options.apiKey ?? process.env.OPENAI_API_KEY);
  const content = await provider.complete({
    task,
    prompt:
      options.prompt ??
      `Create a professional ${task} artifact for ${project.name}, a ${project.framework} project using ${project.language}.`,
    context: { project },
  });

  const output = options.output ?? path.join("docs", `ai-${task}.md`);
  await safeWriteFile(path.resolve(root, output), content);
  logger.success(`AI ${task} generated with ${provider.name}: ${output}`);
}
