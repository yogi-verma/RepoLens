export type Repository = {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  subscribers_count?: number;
  watchers_count?: number;
  language: string | null;
  html_url: string;
  topics?: string[];
  license?: { name: string } | null;
};
