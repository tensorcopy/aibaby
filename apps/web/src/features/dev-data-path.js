const fs = require('node:fs');
const path = require('node:path');

function resolveWebDevDataPath(relativePath) {
  return path.resolve(resolveWebWorkspaceRoot(), '.data', relativePath);
}

function resolveWebWorkspaceRoot() {
  const cwd = process.cwd();
  const nestedWorkspaceRoot = path.resolve(cwd, 'apps/web');

  if (fs.existsSync(nestedWorkspaceRoot)) {
    return nestedWorkspaceRoot;
  }

  return cwd;
}

module.exports = {
  resolveWebDevDataPath,
  resolveWebWorkspaceRoot,
};
