#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOS_ROOT="${REPOS_ROOT:-$ROOT/repos}"
GITHUB_OWNER="${GITHUB_OWNER:-joker170120}"

DEPENDENCIES=(
  tradeplug255
  phanbusiness
  football-shop
)

install_repo() {
  local dir="$1"
  if [[ ! -f "$dir/package.json" ]]; then
    echo "skip (no package.json): $dir"
    return 0
  fi

  echo "Installing dependencies in $dir"
  (
    cd "$dir"
    if [[ -f package-lock.json ]]; then
      npm ci --no-audit --no-fund
    else
      npm install --no-audit --no-fund
    fi
  )
}

mkdir -p "$REPOS_ROOT"

for name in "${DEPENDENCIES[@]}"; do
  target="$REPOS_ROOT/$name"
  if [[ ! -d "$target/.git" ]]; then
    echo "Cloning github.com/$GITHUB_OWNER/$name"
    git clone --depth 1 "https://github.com/$GITHUB_OWNER/$name.git" "$target"
  fi
done

install_repo "$ROOT"

for name in "${DEPENDENCIES[@]}"; do
  install_repo "$REPOS_ROOT/$name"
done

echo "Cloud install complete."
