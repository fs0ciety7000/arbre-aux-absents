#!/usr/bin/env bash
# Démarrage de session : installe les dépendances (Node, Go, Python, Rust) et rappelle le protocole.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || pnpm install >/dev/null 2>&1 || true
  elif [ -f package-lock.json ]; then
    npm ci >/dev/null 2>&1 || true
  elif [ -f bun.lockb ] && command -v bun >/dev/null 2>&1; then
    bun install >/dev/null 2>&1 || true
  fi
fi
if [ -f go.mod ] && command -v go >/dev/null 2>&1; then
  go mod download >/dev/null 2>&1 || true
fi
if [ -f pyproject.toml ] && command -v uv >/dev/null 2>&1; then
  uv sync >/dev/null 2>&1 || true
fi
if [ -f Cargo.toml ] && command -v cargo >/dev/null 2>&1; then
  cargo fetch >/dev/null 2>&1 || true
fi

if grep -q '{{' CLAUDE.md 2>/dev/null; then
  echo "[claude-start] Projet non initialisé : lance le skill /kickoff (CLAUDE.md contient des {{…}})."
fi

cat <<'MSG'
[claude-start] Protocole : lire CLAUDE.md puis docs/WORKFLOW.md et docs/ROADMAP.md.
Tu es chef de projet / orchestrateur : cadre (contrat + docs), délègue en parallèle aux agents
de .claude/agents/ (architect, design-lead, frontend, backend, devops, qa-reviewer) sur des
fichiers disjoints, intègre, vérifie (check + build), puis /ship (ROADMAP, commit, push).
Tous les agents nécessaires (projet + Explore/Plan/general-purpose) sont autorisés.
Skills : /new-project, /kickoff, /orchestrate, /design-system, /ship, /deploy-coolify.
MSG
