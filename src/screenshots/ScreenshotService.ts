import path from "node:path";

import fs from "fs-extra";
import GIFEncoder from "gif-encoder-2";
import { chromium, type Browser } from "playwright";
import sharp from "sharp";

export interface ScreenshotOptions {
  url: string;
  outDir: string;
  widths: number[];
  fullPage: boolean;
}

export interface ScreenshotResult {
  screenshots: string[];
  thumbnails: string[];
  preview: string;
}

export class ScreenshotService {
  public async capture(options: ScreenshotOptions): Promise<ScreenshotResult> {
    await fs.ensureDir(options.outDir);
    const browser = await chromium.launch();

    try {
      const screenshots: string[] = [];
      const thumbnails: string[] = [];

      for (const width of options.widths) {
        const file = path.join(options.outDir, `screenshot-${width}.png`);
        const thumbnail = path.join(options.outDir, `thumbnail-${width}.webp`);
        await this.captureWidth(browser, options.url, width, options.fullPage, file);
        await sharp(file).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 78 }).toFile(thumbnail);
        await sharp(file).png({ compressionLevel: 9 }).toFile(file.replace(".png", ".compressed.png"));
        screenshots.push(file);
        thumbnails.push(thumbnail);
      }

      const preview = path.join(options.outDir, "preview.gif");
      await this.createPreview(screenshots, preview);

      return { screenshots, thumbnails, preview };
    } finally {
      await browser.close();
    }
  }

  private async captureWidth(
    browser: Browser,
    url: string,
    width: number,
    fullPage: boolean,
    file: string,
  ): Promise<void> {
    const page = await browser.newPage({ viewport: { width, height: Math.round(width * 0.625) } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.screenshot({ path: file, fullPage });
    await page.close();
  }

  private async createPreview(files: string[], output: string): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const width = 960;
    const height = 600;
    const encoder = new GIFEncoder(width, height);
    const stream = encoder.createReadStream().pipe(fs.createWriteStream(output));

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(900);
    encoder.setQuality(10);

    for (const file of files) {
      const frame = await sharp(file)
        .resize({ width, height, fit: "contain", background: "#ffffff" })
        .ensureAlpha()
        .raw()
        .toBuffer();
      encoder.addFrame(frame);
    }

    encoder.finish();
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }
}

export const screenshotService = new ScreenshotService();
