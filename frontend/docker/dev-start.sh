#!/bin/sh
set -eu

LOCKFILE_PATH="/app/package-lock.json"
NODE_MODULES_PATH="/app/node_modules"
LOCKFILE_HASH_PATH="${NODE_MODULES_PATH}/.package-lock.hash"

CURRENT_HASH="$(sha256sum "${LOCKFILE_PATH}" | awk '{print $1}')"
INSTALLED_HASH=""

if [ -f "${LOCKFILE_HASH_PATH}" ]; then
  INSTALLED_HASH="$(cat "${LOCKFILE_HASH_PATH}")"
fi

if [ ! -d "${NODE_MODULES_PATH}" ] || [ "${CURRENT_HASH}" != "${INSTALLED_HASH}" ]; then
  echo "Installing frontend dependencies (lockfile changed or node_modules missing)..."
  npm ci
  mkdir -p "${NODE_MODULES_PATH}"
  echo "${CURRENT_HASH}" > "${LOCKFILE_HASH_PATH}"
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
