import { defineConfig } from 'vitest/config';

const DEFAULT_REPO_NAME = 'aiaicaptain';

/**
 * GitHub Pages serves the site from /<repo-name>/. GitHub Actions sets
 * GITHUB_REPOSITORY ("owner/name"), so forks and renamed repos get the right
 * path automatically; local builds fall back to this repo's name.
 */
function pagesBase(): string {
  // Read through globalThis because Node's type definitions aren't a dependency of this project.
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  const repoName = env?.GITHUB_REPOSITORY?.split('/')[1] || DEFAULT_REPO_NAME;
  return `/${repoName}/`;
}

export default defineConfig({
  base: pagesBase(),
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
