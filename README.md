# STARDEV CLI

![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%3E%3D20-22c55e?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)
![CLI](https://img.shields.io/badge/CLI-stardev-7c3aed)

STARDEV CLI is an enterprise-grade developer productivity platform for automating the repetitive work around building, documenting, publishing, deploying, reviewing, optimizing, releasing, and packaging software projects.

It is designed as a real open-source CLI foundation: modular TypeScript, strongly typed services, provider boundaries, encrypted local configuration, safe defaults, and command workflows that can grow without turning into a single giant script.

## Commands

- `stardev init` prepares a project with docs, assets, screenshots, Git, README, LICENSE, and safe ignore files.
- `stardev github` creates a GitHub repository, sets description/topics/homepage, pushes the project, and opens the repo.
- `stardev publish` generates documentation and publishes to GitHub in one workflow.
- `stardev readme` generates a premium README with badges, tech stack, installation, screenshots, roadmap, author, and links.
- `stardev deploy` routes deployment to Vercel, Netlify, Railway, Render, or Firebase.
- `stardev screenshot` captures responsive screenshots, thumbnails, compressed images, and an animated GIF preview.
- `stardev review` scans source files for quality, accessibility, security, duplication, and maintenance findings.
- `stardev optimize` runs audit, Prettier, ESLint, and dependency hygiene workflows.
- `stardev doctor` checks Node, Git, package manager, env safety, and project readiness.
- `stardev release` generates changelog, creates a Git tag, pushes tags, and can create a GitHub release.
- `stardev portfolio` generates portfolio-ready project JSON.
- `stardev client` generates proposal, invoice, estimate, Fiverr, Upwork, LinkedIn, GitHub, and summary copy.
- `stardev ai readme|description|proposal|review|changelog` uses a provider abstraction for local or hosted AI output.

## Tech Stack

- TypeScript and Node.js
- Commander.js for CLI composition
- Inquirer for interactive prompts
- Chalk, Ora, Gradient String, and CLI Progress for terminal UI
- simple-git for Git automation
- Octokit for GitHub API workflows
- Axios for AI/provider HTTP integrations
- dotenv for environment loading
- fs-extra for robust filesystem operations
- Prettier and ESLint for quality workflows
- Zod for configuration validation
- Playwright, Sharp, and gif-encoder-2 for screenshots and previews

## Installation

```bash
npm install
npm run build
npm link
```

After linking, run:

```bash
stardev --help
```

For global publishing:

```bash
npm publish
npm install -g stardev-cli
```

## Configuration

STARDEV stores local configuration in an encrypted JSON payload outside the project directory.

```bash
stardev config set
stardev config path
```

Supported values include:

- GitHub token
- Vercel token
- default author
- portfolio path
- default license
- company
- Git username
- Git email

Secrets are never written into generated project files and `.env` files are ignored by default.

## Architecture

```text
src/
├── ai/
├── changelog/
├── commands/
├── config/
├── constants/
├── deployment/
├── errors/
├── github/
├── logger/
├── portfolio/
├── readme/
├── releases/
├── review/
├── screenshots/
├── templates/
├── types/
├── utils/
└── index.ts
```

Each command is registered independently. Commands orchestrate user input and workflows, while domain services implement GitHub, deployment, README generation, screenshot capture, review analysis, release creation, AI provider access, and encrypted configuration.

## Example Workflows

Initialize and document a project:

```bash
stardev init
stardev readme
stardev doctor
```

Publish to GitHub:

```bash
stardev config set
stardev github --topics "typescript,cli,developer-tools"
```

Capture launch assets:

```bash
stardev screenshot --url https://example.com --full-page
stardev portfolio --demo https://example.com --github https://github.com/user/repo
stardev client --client "Acme Inc"
```

Prepare a release:

```bash
stardev review
stardev optimize
stardev release --version v1.0.0 --owner user --repo repo
```

## AI Provider Model

The AI module is provider-based. The local provider is deterministic and does not send project data to an API. Hosted providers can be added behind the `AiProvider` interface without changing command code.

```bash
stardev ai readme --provider local
stardev ai proposal --provider openai --api-key "$OPENAI_API_KEY"
```

## Security

- `.env` and `.env.*` are ignored by default.
- Tokens are stored in encrypted local configuration.
- Commands validate structured inputs where applicable.
- GitHub and deployment calls are isolated behind services.
- Debug details are printed only when `STARDEV_DEBUG=1`.

## Roadmap

- Add automated unit tests for all services.
- Add Render API blueprint automation.
- Add unused dependency analysis by package graph.
- Add richer React and Tailwind static checks.
- Add provider adapters for Gemini, Claude, and local model servers.
- Add CI templates and release automation for npm publishing.

## Contributing

Contributions are welcome. Keep changes modular, typed, and command-focused. Prefer service boundaries over adding logic directly into command files.

## License

MIT
