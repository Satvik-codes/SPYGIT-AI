import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';

// Create an axios instance with default configuration
const githubClient = axios.create({
  baseURL: GITHUB_API_URL,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
  },
});

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  created_at: string;
  default_branch: string;
}

export interface CommitActivity {
  total: number;
  week: number;
  days: number[];
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
  };
}

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  total_commits?: number;
}

export interface CommitData {
  sha: string;
  author: {
    login: string;
    avatar_url: string;
  };
}

const handleApiError = (error: any) => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        throw new Error('GitHub API authentication failed. Please check your token.');
      case 403:
        throw new Error('GitHub API rate limit exceeded or access forbidden.');
      case 404:
        throw new Error('Repository or user not found.');
      default:
        throw new Error(`GitHub API error: ${error.response.data.message || 'Unknown error'}`);
    }
  }
  throw error;
};

export const githubApi = {
  async getUser(username: string): Promise<GitHubUser> {
    try {
      const { data } = await githubClient.get(`/users/${username}`);
      return {
        login: data.login,
        name: data.name || data.login,
        avatar_url: data.avatar_url,
        bio: data.bio || '',
        followers: data.followers,
        following: data.following,
        public_repos: data.public_repos,
        html_url: data.html_url,
        created_at: data.created_at,
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getRepos(username: string): Promise<GitHubRepo[]> {
    try {
      const { data } = await githubClient.get(
        `/users/${username}/repos?sort=updated&per_page=100`
      );
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getCommitActivity(username: string, repo: string): Promise<CommitActivity[]> {
    try {
      const { data } = await githubClient.get(
        `/repos/${username}/${repo}/stats/commit_activity`
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  async getLanguages(username: string, repo: string): Promise<Record<string, number>> {
    try {
      const { data } = await githubClient.get(
        `/repos/${username}/${repo}/languages`
      );
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getBranches(username: string, repo: string): Promise<Branch[]> {
    try {
      const { data } = await githubClient.get(
        `/repos/${username}/${repo}/branches`
      );
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getCommitsForBranch(
    username: string,
    repo: string,
    branch: string
  ): Promise<CommitData[]> {
    try {
      const { data } = await githubClient.get(
        `/repos/${username}/${repo}/commits?sha=${branch}&per_page=100`
      );
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getContributors(username: string, repo: string): Promise<Contributor[]> {
    try {
      // Get all branches first
      const branches = await this.getBranches(username, repo);
      
      // Get contributors from the default API endpoint
      const { data: baseContributors } = await githubClient.get(
        `/repos/${username}/${repo}/contributors?per_page=100`
      );

      // Create a map to store total commits per contributor across all branches
      const contributorMap = new Map<string, Contributor>();

      // Initialize the map with base contributors
      baseContributors.forEach((contributor: Contributor) => {
        contributorMap.set(contributor.login, {
          ...contributor,
          total_commits: contributor.contributions,
        });
      });

      // Fetch commits from each branch
      for (const branch of branches) {
        const commits = await this.getCommitsForBranch(username, repo, branch.name);
        
        // Count commits per author in this branch
        commits.forEach((commit) => {
          if (commit.author) {
            const contributor = contributorMap.get(commit.author.login);
            if (contributor) {
              contributor.total_commits = (contributor.total_commits || 0) + 1;
            } else {
              contributorMap.set(commit.author.login, {
                login: commit.author.login,
                avatar_url: commit.author.avatar_url,
                html_url: `https://github.com/${commit.author.login}`,
                contributions: 0,
                total_commits: 1,
              });
            }
          }
        });
      }

      // Convert map back to array and sort by total commits
      return Array.from(contributorMap.values()).sort(
        (a, b) => (b.total_commits || 0) - (a.total_commits || 0)
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getReadme(username: string, repo: string, branch: string): Promise<string> {
    try {
      const { data } = await githubClient.get(
        `/repos/${username}/${repo}/readme?ref=${branch}`,
        {
          headers: {
            Accept: 'application/vnd.github.raw',
          },
        }
      );
      return data;
    } catch (error) {
      return ''; // Return empty string if README doesn't exist
    }
  },
};