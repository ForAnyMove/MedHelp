// Patch Node.js fs.promises with graceful-fs to prevent EMFILE (too many open files) on Windows
const fs = require("fs");
const fsPromises = require("fs/promises");
const gracefulFs = require("graceful-fs");

// Gracefulify standard fs
gracefulFs.gracefulify(fs);

// Gracefulify fs/promises methods used by Metro bundler and metro-cache
const patchPromiseFn = (fnName) => {
  if (typeof gracefulFs[fnName] === "function") {
    const wrapped = function (...args) {
      return new Promise((resolve, reject) => {
        gracefulFs[fnName](...args, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    };
    if (fs.promises) fs.promises[fnName] = wrapped;
    if (fsPromises) fsPromises[fnName] = wrapped;
  }
};

["readFile", "writeFile", "open", "stat", "lstat", "readdir", "unlink"].forEach(patchPromiseFn);

const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Limit worker concurrency on Windows to avoid EMFILE file descriptor exhaustion
  config.maxWorkers = 2;

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer")
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"]
  };

  return config;
})();

