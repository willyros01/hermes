#!/usr/bin/env bash
# Durable simulated-only evidence. Push ONLY simulator-evidence; never Android,
# ios, main or main-3 and never publish a binary.
set -Eeuo pipefail
SOURCE="${1:-evidence}"
test -f "$SOURCE/REPORT.md"
test -f "$SOURCE/results.json"
GITDIR="$(mktemp -d)"
git fetch -q origin simulator-evidence:refs/remotes/origin/simulator-evidence
git worktree add -q --detach "$GITDIR" origin/simulator-evidence
RUN="logs/run-${GITHUB_RUN_NUMBER:-local}-${GITHUB_SHA:0:7}"
mkdir -p "$GITDIR/$RUN"
cp -R "$SOURCE/." "$GITDIR/$RUN/"
git -C "$GITDIR" config user.name 'fidunio-simulator-ci'
git -C "$GITDIR" config user.email 'fidunio-simulator-ci@users.noreply.github.com'
git -C "$GITDIR" add "$RUN"
git -C "$GITDIR" commit -qm "ci(simulator): record run ${GITHUB_RUN_NUMBER:-local} test evidence"
git -C "$GITDIR" push -q origin HEAD:simulator-evidence
echo "FIDUNIO evidence: https://github.com/${GITHUB_REPOSITORY:-willyros01/hermes}/tree/simulator-evidence/$RUN"
