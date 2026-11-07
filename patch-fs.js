// Preload script for Node.js process to patch fs and prevent EMFILE on Windows
const fs = require('fs');
const fsPromises = require('fs/promises');

try {
  const gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(fs);

  const patchPromiseFn = (fnName) => {
    if (typeof gracefulFs[fnName] === 'function') {
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

  ['readFile', 'writeFile', 'open', 'stat', 'lstat', 'readdir', 'unlink'].forEach(patchPromiseFn);
} catch (e) {
  // Graceful-fs fallback
}

