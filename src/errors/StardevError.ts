export type ErrorCode =
  | "CONFIG_ERROR"
  | "GIT_ERROR"
  | "GITHUB_ERROR"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "FILE_SYSTEM_ERROR"
  | "COMMAND_ERROR"
  | "AUTH_ERROR"
  | "DEPLOYMENT_ERROR"
  | "AI_ERROR";

export class StardevError extends Error {
  public readonly code: ErrorCode;
  public readonly details: unknown | undefined;

  public constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "StardevError";
    this.code = code;
    this.details = details;
  }
}

export function toStardevError(error: unknown, fallbackCode: ErrorCode): StardevError {
  if (error instanceof StardevError) {
    return error;
  }

  if (error instanceof Error) {
    return new StardevError(fallbackCode, error.message, error);
  }

  return new StardevError(fallbackCode, "An unknown error occurred.", error);
}
