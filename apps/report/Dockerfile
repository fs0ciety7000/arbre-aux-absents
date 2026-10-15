# syntax=docker/dockerfile:1
# Service de signalement de L'Arbre aux absents (apps/report, ARCHITECTURE §8, D9) :
# node:http + node:sqlite, zod embarqué au build → dist/server.js et dist/admin.js autonomes,
# aucun node_modules au runtime. Contexte = racine du repo, liste blanche Dockerfile.dockerignore.
#
#   docker build -f apps/report/Dockerfile -t arbre-report .
#   docker run --rm -p 8090:8090 -v arbre-report-data:/data arbre-report   → curl localhost:8090/healthz
#   sh scripts/docker-smoke.sh --report arbre-report 8090
#
# Accès de l'équipe au contact d'un ticket (terminal Coolify) : node dist/admin.js contact AA-0042
# Sonde de santé (Docker et Coolify, sans curl ni wget dans l'image) : node dist/admin.js healthcheck
#
# Même image Node que le site, épinglée par digest (build reproductible ; Dependabot la met à jour).
# node:sqlite exige Node ≥ 22.13 sans option (engines : ≥ 22.17).
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392

# ---------------------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
ENV CI=true \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

# Manifestes d'abord (couche npm ci en cache tant que les dépendances ne changent pas). Seuls le
# contrat et le service entrent dans le contexte : les autres workspaces du lockfile sont ignorés.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contract/package.json packages/contract/
COPY apps/report/package.json apps/report/

# Lockfile figé ; racine (vite, typescript) + service ; aucun script d'installation.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --include-workspace-root --workspace @arbre/report

COPY packages/contract packages/contract
COPY apps/report apps/report

RUN npm run build -w @arbre/report \
 && test -s apps/report/dist/server.js \
 && test -s apps/report/dist/admin.js

# ---------------------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
LABEL org.opencontainers.image.title="L'Arbre aux absents — signalements" \
      org.opencontainers.image.description="Service de signalement de problèmes avec suivi (node:http, node:sqlite)" \
      org.opencontainers.image.vendor="CM Interactive" \
      org.opencontainers.image.source="https://github.com/fs0ciety7000/arbre-aux-absents"

# Aucun secret ici : GITHUB_TOKEN, GITHUB_WEBHOOK_SECRET… viennent des variables Coolify.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8090 \
    DATA_DIR=/data \
    NODE_OPTIONS=--disable-warning=ExperimentalWarning

WORKDIR /app

# Base SQLite sur le volume /data, seul dossier accessible en écriture à l'utilisateur node (1000).
RUN mkdir -p /data && chown node:node /data && chmod 700 /data

# Fichiers appartenant à root, en lecture seule pour l'utilisateur node. Le package.json du service
# fixe "type": "module" pour les .js ESM de dist/ (aucune dépendance n'est installée).
COPY apps/report/package.json ./package.json
COPY --from=build /app/apps/report/dist ./dist

USER node
VOLUME ["/data"]
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "dist/admin.js", "healthcheck"]

CMD ["node", "dist/server.js"]
