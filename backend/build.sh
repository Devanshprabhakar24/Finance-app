#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci

echo "Checking TypeScript version..."
npx tsc --version

echo "Checking @types/node installation..."
ls node_modules/@types/node || echo "@types/node not found"

echo "Building TypeScript..."
npm run build

echo "Build completed successfully!"