const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Merge monorepo root into Expo's default watchFolders instead of replacing.
config.watchFolders = [monorepoRoot, ...(config.watchFolders ?? [])];

// Resolve packages from the app directory first, then fall back to the
// monorepo root. This mirrors how pnpm hoists in the workspace.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.unstable_enableSymlinks = false;

module.exports = config;
