const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = path.resolve(__dirname, "artifacts/earniq");
const monorepoRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot, ...(config.watchFolders ?? [])];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Resolve the @/ alias to the Expo app root so Metro finds it when
// bundling from the monorepo root (as EAS does).
config.resolver.alias = {
  "@": projectRoot,
};

module.exports = config;
