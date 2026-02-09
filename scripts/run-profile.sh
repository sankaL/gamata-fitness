#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_CMD=(npx -y supabase@latest)

LOCAL_BACKEND_ENV_PATH="./backend/.env.local-profile"
LOCAL_FRONTEND_ENV_PATH="./frontend/.env.local-profile"

PREPARE_ONLY=false
DETACHED=false

usage() {
  cat <<'EOF'
Usage:
  ./scripts/run-profile.sh local [--detached] [--prepare-only]
  ./scripts/run-profile.sh prod-like [--detached] [--prepare-only]
  ./scripts/run-profile.sh down

Profiles:
  local       Starts local Supabase + app in dev mode (Vite HMR + backend reload).
  prod-like   Starts local Supabase + app using production Dockerfiles locally.
  down        Stops both app compose stacks and local Supabase.

Options:
  --detached      Run docker compose in detached mode.
  --prepare-only  Start local Supabase and generate profile env files, but do not run app containers.
EOF
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
}

extract_env_value() {
  local key="$1"
  local payload="$2"
  printf '%s\n' "$payload" | sed -n "s/^${key}=\"\\(.*\\)\"$/\\1/p" | head -n 1
}

ensure_supabase_initialized() {
  if [ ! -f "$ROOT_DIR/supabase/config.toml" ]; then
    echo "Initializing Supabase project..."
    (cd "$ROOT_DIR" && "${SUPABASE_CMD[@]}" init --yes)
  fi
}

ensure_supabase_started() {
  local status_output
  if ! status_output="$(cd "$ROOT_DIR" && "${SUPABASE_CMD[@]}" status -o env 2>/dev/null)"; then
    echo "Starting local Supabase stack..."
    (cd "$ROOT_DIR" && "${SUPABASE_CMD[@]}" start)
    status_output="$(cd "$ROOT_DIR" && "${SUPABASE_CMD[@]}" status -o env)"
  fi
  printf '%s' "$status_output"
}

write_local_profile_env_files() {
  local status_output="$1"

  local api_url
  local db_url
  local publishable_key
  local anon_key
  local service_role_key

  api_url="$(extract_env_value "API_URL" "$status_output")"
  db_url="$(extract_env_value "DB_URL" "$status_output")"
  publishable_key="$(extract_env_value "PUBLISHABLE_KEY" "$status_output")"
  anon_key="$(extract_env_value "ANON_KEY" "$status_output")"
  service_role_key="$(extract_env_value "SERVICE_ROLE_KEY" "$status_output")"

  if [ -z "$api_url" ] || [ -z "$service_role_key" ]; then
    echo "Failed to parse required local Supabase values from 'supabase status -o env'."
    exit 1
  fi

  if [ -z "$publishable_key" ]; then
    publishable_key="$anon_key"
  fi

  if [ -z "$publishable_key" ]; then
    echo "Missing both PUBLISHABLE_KEY and ANON_KEY from local Supabase status output."
    exit 1
  fi

  cat >"$ROOT_DIR/backend/.env.local-profile" <<EOF
APP_ENV=development
SUPABASE_URL=${api_url}
SUPABASE_ANON_KEY=${publishable_key}
SUPABASE_SERVICE_ROLE_KEY=${service_role_key}
DATABASE_URL=${db_url}
CORS_ALLOWED_ORIGINS=http://localhost:5173
EOF

  cat >"$ROOT_DIR/frontend/.env.local-profile" <<EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=${api_url}
VITE_SUPABASE_ANON_KEY=${publishable_key}
EOF
}

compose_with_local_profile_env() {
  (
    cd "$ROOT_DIR" && \
      BACKEND_ENV_FILE="$LOCAL_BACKEND_ENV_PATH" \
      FRONTEND_ENV_FILE="$LOCAL_FRONTEND_ENV_PATH" \
      docker compose "$@"
  )
}

stop_app_containers() {
  compose_with_local_profile_env -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans >/dev/null 2>&1 || true
  compose_with_local_profile_env -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans >/dev/null 2>&1 || true
}

start_profile() {
  local profile="$1"
  local compose_args=()
  local status_output

  require_cmd docker
  require_cmd npx

  ensure_supabase_initialized
  status_output="$(ensure_supabase_started)"
  write_local_profile_env_files "$status_output"

  echo "Generated profile env files:"
  echo "  $ROOT_DIR/backend/.env.local-profile"
  echo "  $ROOT_DIR/frontend/.env.local-profile"

  if [ "$PREPARE_ONLY" = true ]; then
    echo "Preparation complete. Skipping app container startup because --prepare-only was provided."
    exit 0
  fi

  stop_app_containers

  case "$profile" in
    local)
      compose_args=(-f docker-compose.yml -f docker-compose.dev.yml up --build)
      ;;
    prod-like)
      compose_args=(-f docker-compose.yml -f docker-compose.prod.yml up --build)
      ;;
    *)
      echo "Unsupported profile: $profile"
      exit 1
      ;;
  esac

  if [ "$DETACHED" = true ]; then
    compose_args+=(-d)
  fi

  echo "Starting profile: $profile"
  compose_with_local_profile_env "${compose_args[@]}"
}

stop_all() {
  require_cmd docker
  require_cmd npx

  stop_app_containers

  echo "Stopping local Supabase..."
  (cd "$ROOT_DIR" && "${SUPABASE_CMD[@]}" stop >/dev/null 2>&1 || true)
  echo "All local services stopped."
}

if [ $# -lt 1 ]; then
  usage
  exit 1
fi

PROFILE="$1"
shift

while [ $# -gt 0 ]; do
  case "$1" in
    --prepare-only)
      PREPARE_ONLY=true
      ;;
    --detached)
      DETACHED=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

case "$PROFILE" in
  local|prod-like)
    start_profile "$PROFILE"
    ;;
  down)
    stop_all
    ;;
  *)
    echo "Unknown profile: $PROFILE"
    usage
    exit 1
    ;;
esac
