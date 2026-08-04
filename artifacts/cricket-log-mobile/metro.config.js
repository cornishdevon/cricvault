const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude Android Maven temp directories that expo-sharing creates
// These don't exist in the dev environment and cause Metro's watcher to crash
config.resolver = config.resolver || {};
config.resolver.blockList = [
  ...(config.resolver.blockList ? [config.resolver.blockList].flat() : []),
  /.*_tmp_\d+\/local-maven-repo\/.*/,
];

module.exports = config;
