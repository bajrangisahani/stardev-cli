import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

import envPaths from "env-paths";
import fs from "fs-extra";

import { APP_NAME } from "../constants/index.js";
import { StardevError } from "../errors/StardevError.js";
import type { LocalConfig } from "../types/index.js";
import { localConfigSchema } from "./schema.js";

interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

const EMPTY_CONFIG: LocalConfig = {};

export class ConfigStore {
  private readonly filePath: string;

  public constructor(filePath = path.join(envPaths(APP_NAME).config, "config.enc.json")) {
    this.filePath = filePath;
  }

  public get path(): string {
    return this.filePath;
  }

  public async getAll(): Promise<LocalConfig> {
    if (!(await fs.pathExists(this.filePath))) {
      return EMPTY_CONFIG;
    }

    try {
      const payload = (await fs.readJson(this.filePath)) as EncryptedPayload;
      const decrypted = this.decrypt(payload);
      return localConfigSchema.parse(JSON.parse(decrypted));
    } catch (error) {
      throw new StardevError("CONFIG_ERROR", "Unable to read encrypted STARDEV config.", error);
    }
  }

  public async set(values: LocalConfig): Promise<LocalConfig> {
    const current = await this.getAll();
    const next = localConfigSchema.parse({ ...current, ...values });
    await fs.ensureDir(path.dirname(this.filePath));
    await fs.writeJson(this.filePath, this.encrypt(JSON.stringify(next)), { spaces: 2 });
    return next;
  }

  public async get<K extends keyof LocalConfig>(key: K): Promise<LocalConfig[K] | undefined> {
    const config = await this.getAll();
    return config[key];
  }

  private getKey(): Buffer {
    const material = [
      os.userInfo().username,
      os.hostname(),
      os.homedir(),
      APP_NAME,
      "local-config-v1",
    ].join(":");

    return crypto.createHash("sha256").update(material).digest();
  }

  private encrypt(value: string): EncryptedPayload {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      data: encrypted.toString("base64"),
    };
  }

  private decrypt(payload: EncryptedPayload): string {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.getKey(),
      Buffer.from(payload.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(payload.data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}

export const configStore = new ConfigStore();
