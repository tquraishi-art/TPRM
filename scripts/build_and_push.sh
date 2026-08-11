#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/build_and_push.sh <registry> <image> [tag]
# Example: ./scripts/build_and_push.sh ghcr.io myuser/tprm latest

REGISTRY=${1:-ghcr.io}
IMAGE=${2:-${GH_USERNAME:-youruser}/tprm}
TAG=${3:-latest}

FULL=${REGISTRY}/${IMAGE}:${TAG}

echo "Building ${FULL}"
docker build -t "${FULL}" .

echo "Pushing ${FULL}"
docker push "${FULL}"

echo "Done: ${FULL}"
