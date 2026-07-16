import { simpleGit, type DefaultLogFields } from "simple-git";

export class ChangelogGenerator {
  public async generate(root: string, version: string): Promise<string> {
    const git = simpleGit(root);
    const isRepo = await git.checkIsRepo();
    const date = new Date().toISOString().slice(0, 10);

    if (!isRepo) {
      return `# Changelog

## ${version} - ${date}

- Initial release.
`;
    }

    const log = await git.log({ maxCount: 50 });
    const commits = log.all.map((commit: DefaultLogFields) => `- ${commit.message}`).join("\n");

    return `# Changelog

## ${version} - ${date}

${commits || "- Initial release."}
`;
  }
}

export const changelogGenerator = new ChangelogGenerator();
