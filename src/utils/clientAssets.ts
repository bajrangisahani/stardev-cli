import type { ProjectInfo } from "../types/index.js";

export function generateClientAssets(project: ProjectInfo, clientName: string, rate: number): string {
  const estimate = Math.max(1200, rate * 40);

  return `# Client Pack: ${project.name}

## Project Proposal

Hi ${clientName},

I can build and deliver ${project.name}, a polished ${project.framework} project with a maintainable architecture, clear documentation, deployment setup, and professional handoff assets.

## Project Estimate

- Discovery and setup: ${Math.round(estimate * 0.15)}
- Core implementation: ${Math.round(estimate * 0.55)}
- Testing, optimization, and documentation: ${Math.round(estimate * 0.2)}
- Deployment and handoff: ${Math.round(estimate * 0.1)}
- Total estimate: ${estimate}

## Invoice Summary

Project: ${project.name}
Amount: ${estimate}
Payment terms: 50% upfront, 50% on delivery

## Fiverr Description

I will create a professional ${project.framework} application with clean code, responsive UI, deployment support, README documentation, and GitHub-ready project structure.

## Upwork Proposal

I reviewed your requirements and can deliver a production-quality implementation with strong communication, clean TypeScript/JavaScript practices, and a deployment-ready handoff.

## LinkedIn Post

Just shipped ${project.name}: a ${project.framework} project focused on clean architecture, developer experience, and production readiness.

## GitHub Description

${project.name} is a ${project.framework} project built with a maintainable structure, clear documentation, and deployment-ready workflow.

## Project Summary

${project.name} uses ${project.language} and is ready for documentation, review, optimization, deployment, and portfolio publishing.
`;
}
