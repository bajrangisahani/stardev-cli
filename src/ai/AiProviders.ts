import axios from "axios";

import { StardevError } from "../errors/StardevError.js";
import type { AiProvider, AiRequest } from "../types/index.js";

export class EchoAiProvider implements AiProvider {
  public readonly name = "local";

  public async complete(request: AiRequest): Promise<string> {
    return `# ${request.task}

${request.prompt}

This local provider produces deterministic text without sending project data to an external API. Configure an API-backed provider when you want hosted model output.`;
  }
}

export class OpenAiCompatibleProvider implements AiProvider {
  public readonly name: string;
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly model: string;

  public constructor(name: string, apiKey: string, endpoint: string, model: string) {
    this.name = name;
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.model = model;
  }

  public async complete(request: AiRequest): Promise<string> {
    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are STARDEV CLI, a precise senior software assistant that writes production-quality developer artifacts.",
            },
            {
              role: "user",
              content: JSON.stringify(request),
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 60_000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("AI provider returned an unexpected response.");
      }
      return content;
    } catch (error) {
      throw new StardevError("AI_ERROR", `AI provider ${this.name} failed.`, error);
    }
  }
}

export function createAiProvider(provider: string, apiKey?: string): AiProvider {
  if (!apiKey || provider === "local") {
    return new EchoAiProvider();
  }

  if (provider === "openai") {
    return new OpenAiCompatibleProvider(
      "openai",
      apiKey,
      "https://api.openai.com/v1/chat/completions",
      "gpt-4.1-mini",
    );
  }

  throw new StardevError("AI_ERROR", `Unsupported AI provider: ${provider}`);
}
