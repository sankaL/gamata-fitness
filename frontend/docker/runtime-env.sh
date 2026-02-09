#!/bin/sh
set -eu

escape_js_string() {
  # Escape backslashes and quotes for safe inclusion in JS string literals.
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

api_base_url="$(escape_js_string "${VITE_API_BASE_URL:-}")"
supabase_url="$(escape_js_string "${VITE_SUPABASE_URL:-}")"
supabase_anon_key="$(escape_js_string "${VITE_SUPABASE_ANON_KEY:-}")"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  VITE_API_BASE_URL: "${api_base_url}",
  VITE_SUPABASE_URL: "${supabase_url}",
  VITE_SUPABASE_ANON_KEY: "${supabase_anon_key}"
}
EOF
