#!/usr/bin/env bash
# Set up four git worktrees so the four sessions never edit one working tree.
# Owner: Claude 4. Run once from the repo root after the first commit on `main`.
#
#   CAT PROJECT (main)
#   ├── ../cat-backend      (branch: backend)      -> Claude 1
#   ├── ../cat-ml           (branch: ml)           -> Claude 2
#   ├── ../cat-frontend     (branch: frontend)     -> Claude 3
#   └── ../cat-integration  (branch: integration)  -> Claude 4
#
# Integration (Claude 4) owns merges back into main.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

create() {
  local branch="$1" dir="$2"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    echo "branch $branch exists — skipping create"
  else
    git branch "$branch"
  fi
  if [ -d "$dir" ]; then
    echo "worktree $dir exists — skipping"
  else
    git worktree add "$dir" "$branch"
  fi
}

create backend     "../cat-backend"
create ml          "../cat-ml"
create frontend    "../cat-frontend"
create integration "../cat-integration"

echo "Done. Worktrees:"
git worktree list
