#!/bin/bash
set -e
echo "=== Patching jose ==="
node scripts/patch-jose.js
echo "=== Building Next.js ==="
npx next build
echo "=== Building OpenNext ==="
npx opennextjs-cloudflare build
echo "=== Deploying to Cloudflare ==="
npx opennextjs-cloudflare deploy
echo "=== Done ==="
