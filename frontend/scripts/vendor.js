const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const vendor = path.join(root, 'vendor');
fs.mkdirSync(vendor, { recursive: true });

const files = [
  ['react/umd/react.development.js', 'react.development.js'],
  ['react-dom/umd/react-dom.development.js', 'react-dom.development.js'],
  ['react-router-dom/umd/react-router-dom.js', 'react-router-dom.js'],
  ['react-query/dist/react-query.development.js', 'react-query.js'],
  ['react-query/LICENSE', 'LICENSE-react-query.txt'],
  ['react-router-dom/LICENSE', 'LICENSE-react-router-dom.txt'],
  ['react-router/LICENSE', 'LICENSE-react-router.txt'],
  ['history/LICENSE', 'LICENSE-history.txt'],
  ['hoist-non-react-statics/LICENSE.md', 'LICENSE-hoist-non-react-statics.txt'],
  ['mini-create-react-context/LICENSE', 'LICENSE-mini-create-react-context.txt'],
  ['path-to-regexp/LICENSE', 'LICENSE-path-to-regexp.txt'],
  ['tiny-invariant/LICENSE', 'LICENSE-tiny-invariant.txt'],
  ['tiny-warning/LICENSE', 'LICENSE-tiny-warning.txt'],
  ['resolve-pathname/LICENSE', 'LICENSE-resolve-pathname.txt'],
  ['value-equal/LICENSE', 'LICENSE-value-equal.txt'],
  ['react/LICENSE', 'LICENSE-react.txt'],
  ['react-dom/LICENSE', 'LICENSE-react-dom.txt']
];

for (const [source, destination] of files) {
  const sourcePath = path.join(root, 'node_modules', source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing expected vendor package file: ${source}`);
  }
  fs.copyFileSync(sourcePath, path.join(vendor, destination));
}
