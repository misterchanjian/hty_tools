// Patch jose in jwks-rsa to fix Cloudflare Workers build
// The nested jose@4.15.9 has a broken workerd entry that esbuild can't resolve.
// We remove the workerd entry so it falls back to the Node.js entry which works in CF Workers.

const path = require('path');
const fs = require('fs');

const josePath = path.join(__dirname, '..', 'node_modules', 'jwks-rsa', 'node_modules', 'jose', 'package.json');

if (fs.existsSync(josePath)) {
  const pkg = JSON.parse(fs.readFileSync(josePath, 'utf8'));
  if (pkg.exports && pkg.exports['.']) {
    // Remove workerd/browser entries that cause esbuild issues
    delete pkg.exports['.']['workerd'];
    delete pkg.exports['.']['browser'];
    delete pkg.exports['.']['worker'];
    delete pkg.exports['.']['bun'];
    delete pkg.exports['.']['deno'];
    // Also remove nested subpath exports that might cause issues
    const keysToDelete = Object.keys(pkg.exports).filter(k => k !== '.' && k.startsWith('./'));
    for (const k of keysToDelete) {
      delete pkg.exports[k]['workerd'];
      delete pkg.exports[k]['browser'];
    }
    fs.writeFileSync(josePath, JSON.stringify(pkg, null, 2));
    console.log('Patched jose@4.15.9 exports for Cloudflare Workers compatibility');
  }
}
