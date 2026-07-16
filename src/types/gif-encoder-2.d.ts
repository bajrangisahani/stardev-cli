declare module "gif-encoder-2" {
  import type { Readable } from "node:stream";

  export default class GIFEncoder {
    public constructor(width: number, height: number);
    public createReadStream(): Readable;
    public start(): void;
    public setRepeat(repeat: number): void;
    public setDelay(delay: number): void;
    public setQuality(quality: number): void;
    public addFrame(data: Buffer): void;
    public finish(): void;
  }
}
