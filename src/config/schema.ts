import { z } from "zod";

export const localConfigSchema = z.object({
  githubToken: z.string().min(1).optional(),
  vercelToken: z.string().min(1).optional(),
  defaultAuthor: z.string().min(1).optional(),
  portfolioPath: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  gitUsername: z.string().min(1).optional(),
  gitEmail: z.string().email().optional(),
});
