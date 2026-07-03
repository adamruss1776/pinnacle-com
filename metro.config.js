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

// EAS builds from the monorepo root, so Metro cannot infer the @/ alias
// from the Expo project at artifacts/earniq. Intercept @/ imports here
// and rewrite them to absolute paths before the default resolver runs.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const absolutePath = path.resolve(projectRoot, moduleName.slice(2));
    return (defaultResolveRequest ?? context.resolveRequest)(
      context,
      absolutePath,
      platform
    );
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
