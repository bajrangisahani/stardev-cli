import { Octokit } from "@octokit/rest";
import open from "open";
import { simpleGit, type SimpleGit } from "simple-git";

import { DEFAULT_BRANCH } from "../constants/index.js";
import type { ProjectInfo } from "../types/index.js";

export interface CreateRepositoryOptions {
  token: string;
  name: string;
  description: string;
  privateRepo: boolean;
  topics: string[];
  homepage?: string | undefined;
  push: boolean;
  openBrowser: boolean;
}

export class GitHubService {
  public async createAndPublish(
    project: ProjectInfo,
    options: CreateRepositoryOptions,
  ): Promise<string> {
    const octokit = new Octokit({ auth: options.token });
    const createOptions: Parameters<typeof octokit.repos.createForAuthenticatedUser>[0] = {
      name: options.name,
      description: options.description,
      private: options.privateRepo,
      auto_init: false,
    };
    if (options.homepage) {
      createOptions.homepage = options.homepage;
    }
    const response = await octokit.repos.createForAuthenticatedUser(createOptions);

    const repo = response.data;
    if (options.topics.length > 0) {
      await octokit.repos.replaceAllTopics({
        owner: repo.owner.login,
        repo: repo.name,
        names: options.topics.map((topic) => topic.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
      });
    }

    if (options.push) {
      const git: SimpleGit = simpleGit(project.root);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        await git.init();
      }
      const remotes = await git.getRemotes(true);
      if (!remotes.some((remote) => remote.name === "origin")) {
        await git.addRemote("origin", repo.clone_url);
      }
      await git.branch(["-M", DEFAULT_BRANCH]);
      await git.add(".");
      const status = await git.status();
      if (status.files.length > 0) {
        await git.commit("chore: publish project with stardev");
      }
      await git.push("origin", DEFAULT_BRANCH, ["--set-upstream"]);
    }

    if (options.openBrowser) {
      await open(repo.html_url);
    }

    return repo.html_url;
  }
}

export const githubService = new GitHubService();
