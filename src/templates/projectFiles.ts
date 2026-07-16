import { DEFAULT_LICENSE } from "../constants/index.js";
import type { ProjectInfo } from "../types/index.js";

export function gitignoreTemplate(): string {
  return `node_modules
dist
build
coverage
.env
.env.*
!.env.example
.DS_Store
*.log
.next
.nuxt
.vercel
.netlify
`;
}

export function licenseTemplate(author: string, license = DEFAULT_LICENSE): string {
  if (license.toUpperCase() !== "MIT") {
    return `${license} License

Copyright (c) ${new Date().getFullYear()} ${author}
`;
  }

  return `MIT License

Copyright (c) ${new Date().getFullYear()} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

export function defaultReadme(project: ProjectInfo): string {
  return `# ${project.name}

A ${project.framework} project prepared with STARDEV CLI.

## Getting Started

Install dependencies and run the project using the commands for your framework.

## License

MIT
`;
}
