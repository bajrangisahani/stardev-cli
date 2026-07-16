import path from "node:path";

import { Octokit } from "@octokit/rest";
import fs from "fs-extra";
import { simpleGit } from "simple-git";

import { changelogGenerator } from "../changelog/ChangelogGenerator.js";
import { StardevError } from "../errors/StardevError.js";
import { safeWriteFile } from "../utils/files.js";

export interface ReleaseOptions {
  version: string;
  token: string | undefined;
  owner: string | undefined;
  repo: string | undefined;
  assets: string[];
  push: boolean;
}

export class ReleaseService {
  public async release(root: string, options: ReleaseOptions): Promise<string> {
    const changelog = await changelogGenerator.generate(root, options.version);
    const changelogPath = path.join(root, "CHANGELOG.md");
    await safeWriteFile(changelogPath, changelog);

    const git = simpleGit(root);
    if (!(await git.checkIsRepo())) {
      throw new StardevError("GIT_ERROR", "Release requires a Git repository.");
    }

    await git.add(["CHANGELOG.md"]);
    const status = await git.status();
    if (status.files.length > 0) {
      await git.commit(`chore(release): ${options.version}`);
    }
    await git.addTag(options.version);

    if (options.push) {
      await git.push();
      await git.pushTags();
    }

    if (!options.token || !options.owner || !options.repo) {
      return changelogPath;
    }

    const octokit = new Octokit({ auth: options.token });
    const release = await octokit.repos.createRelease({
      owner: options.owner,
      repo: options.repo,
      tag_name: options.version,
      name: options.version,
      body: changelog,
    });

    for (const asset of options.assets) {
      const data = await fs.readFile(asset);
      await octokit.repos.uploadReleaseAsset({
        owner: options.owner,
        repo: options.repo,
        release_id: release.data.id,
        name: path.basename(asset),
        data: data as unknown as string,
      });
    }

    return release.data.html_url;
  }
}

export const releaseService = new ReleaseService();
