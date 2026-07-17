import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import GIFEncoder from "gif-encoder-2";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "assets");
const output = path.join(outDir, "demo.gif");

const width = 1200;
const height = 720;
const terminalX = 70;
const terminalY = 64;
const terminalWidth = 1060;
const terminalHeight = 592;

const frames = [
  {
    title: "Sync to GitHub",
    command: "stardev sync --repo github.com/bajrangisahani/stardev-cli",
    lines: [
      "STARDEV CLI",
      "Developer workflow automation for serious projects",
      "",
      "$ git init",
      "$ git remote set-url origin github.com/bajrangisahani/stardev-cli",
      "$ git add .",
      "$ git commit -m \"feat: sync project updates\"",
      "✓ Sync complete: committed, pushed",
    ],
  },
  {
    title: "Generate CI",
    command: "stardev ci --audit",
    lines: [
      "STARDEV CLI",
      "Creating GitHub Actions quality workflow",
      "",
      "✓ Workflow: .github/workflows/stardev-ci.yml",
      "✓ Install dependencies",
      "✓ Audit dependencies",
      "✓ Lint, typecheck, build",
    ],
  },
  {
    title: "Create .env.example",
    command: "stardev env",
    lines: [
      "STARDEV CLI",
      "Scanning source code for environment variables",
      "",
      "✓ Environment example updated: .env.example",
      "i Detected 5 environment variable(s)",
      "  OPENAI_API_KEY",
      "  GITHUB_TOKEN",
      "  RENDER_SERVICE_ID",
    ],
  },
  {
    title: "Security Scan",
    command: "stardev security",
    lines: [
      "STARDEV CLI",
      "Scanning secrets and risky code patterns",
      "",
      "✓ No hard-coded tokens detected",
      "✓ No unsafe shell patterns detected",
      "✓ Security scan passed",
    ],
  },
  {
    title: "Project Health",
    command: "stardev health",
    lines: [
      "STARDEV CLI",
      "Scoring project quality and deployment readiness",
      "",
      "✓ Health score: 85/90 (A)",
      "✓ README, license, package, CI",
      "✓ Env example and security checks",
      "i Report: docs/stardev-health.md",
    ],
  },
];

await fs.mkdir(outDir, { recursive: true });

const encoder = new GIFEncoder(width, height);
const stream = encoder.createReadStream();
const chunks = [];

stream.on("data", (chunk) => chunks.push(chunk));

encoder.start();
encoder.setRepeat(0);
encoder.setDelay(1250);
encoder.setQuality(12);

for (const frame of frames) {
  const svg = renderFrame(frame);
  const raw = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
  encoder.addFrame(raw);
}

encoder.finish();

await new Promise((resolve, reject) => {
  stream.on("end", resolve);
  stream.on("error", reject);
});

await fs.writeFile(output, Buffer.concat(chunks));
console.log(`Created ${path.relative(root, output)}`);

function renderFrame(frame) {
  const lineMarkup = frame.lines
    .map((line, index) => {
      const y = terminalY + 170 + index * 42;
      const color = line.startsWith("✓")
        ? "#34d399"
        : line.startsWith("i")
          ? "#67e8f9"
          : line.startsWith("$")
            ? "#fbbf24"
            : "#dbeafe";
      return `<text x="${terminalX + 70}" y="${y}" fill="${color}" font-size="26" font-family="Consolas, Monaco, monospace">${escapeXml(line)}</text>`;
    })
    .join("");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="48%" stop-color="#172554"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#020617" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <text x="70" y="44" fill="#c7d2fe" font-size="22" font-family="Inter, Arial, sans-serif">STARDEV CLI demo</text>
  <rect x="${terminalX}" y="${terminalY}" width="${terminalWidth}" height="${terminalHeight}" rx="18" fill="#020617" filter="url(#shadow)"/>
  <rect x="${terminalX}" y="${terminalY}" width="${terminalWidth}" height="74" rx="18" fill="#0f172a"/>
  <circle cx="${terminalX + 34}" cy="${terminalY + 37}" r="10" fill="#fb7185"/>
  <circle cx="${terminalX + 64}" cy="${terminalY + 37}" r="10" fill="#fbbf24"/>
  <circle cx="${terminalX + 94}" cy="${terminalY + 37}" r="10" fill="#34d399"/>
  <text x="${terminalX + 140}" y="${terminalY + 46}" fill="#e0f2fe" font-size="22" font-family="Consolas, Monaco, monospace">${escapeXml(frame.command)}</text>
  <rect x="${terminalX + 36}" y="${terminalY + 100}" width="14" height="440" rx="7" fill="url(#accent)"/>
  <text x="${terminalX + 70}" y="${terminalY + 132}" fill="#ffffff" font-size="42" font-weight="700" font-family="Inter, Arial, sans-serif">${escapeXml(frame.title)}</text>
  ${lineMarkup}
  <text x="${terminalX + 70}" y="${terminalY + terminalHeight - 40}" fill="#94a3b8" font-size="20" font-family="Inter, Arial, sans-serif">Build, document, secure, sync, and ship projects faster.</text>
</svg>`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
