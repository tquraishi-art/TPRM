#!/usr/bin/env bash
set -euo pipefail

# scripts/run_all.sh
# Single path to: commit, push, install deps, run tests, build and push docker image.
# Usage:
#   ./scripts/run_all.sh --remote git@github.com:owner/repo.git --registry ghcr.io --image owner/tprm --tag latest
# Environment:
#   GHCR_LOGIN (optional): if set, will attempt `echo "$GHCR_LOGIN" | docker login ghcr.io -u $GHCR_USER --password-stdin`

REMOTE="${1:-}" # if empty, won't change remote
REGISTRY="${2:-ghcr.io}"
IMAGE="${3:-${USER:-youruser}/tprm}"
TAG="${4:-latest}"

echo "--- RUN ALL: commit, push, deps, tests, docker build/push ---"

# Commit changes
if git diff --quiet --ignore-submodules --cached && git diff --quiet --ignore-submodules; then
  echo "No local changes to commit"
else
  git add -A
  git commit -m "chore(ci/docker): commit before run_all" || true
fi

BR=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)
echo "Current branch: $BR"

# Optionally set remote
if [ -n "$REMOTE" ]; then
  echo "Setting origin to $REMOTE"
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REMOTE"
fi

# Push
echo "Pushing to origin/$BR"
git push -u origin "$BR"

# Install deps
echo "Installing dependencies"
npm ci --no-audit --no-fund

# Run tests
echo "Running tests"
npx jest --runInBand --colors --verbose

# Docker build
FULL="${REGISTRY}/${IMAGE}:${TAG}"

echo "Building docker image: $FULL"
docker build -t "$FULL" .

# Docker push
if [ -n "${GHCR_LOGIN:-}" ] && [ -n "${GHCR_USER:-}" ]; then
  echo "Logging into $REGISTRY"
  echo "$GHCR_LOGIN" | docker login "$REGISTRY" -u "$GHCR_USER" --password-stdin
fi

echo "Pushing $FULL"
docker push "$FULL"

echo "All done - image pushed: $FULL"
