# Site vitrine de L'Arbre aux absents : SvelteKit prérendu → nginx non-root, avec la version web
# du jeu sous /jouer/ (build Vite de apps/game). Builds natifs : .github/workflows/tauri.yml.
#
#   docker build -t arbre-site .
#   docker run --rm -p 8080:8080 arbre-site     → http://localhost:8080 , /healthz
#
# Images de base épinglées par digest (build reproductible) ; Dependabot les met à jour.
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.29-alpine@sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6

# ---------------------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
ENV CI=true \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

# Contexte réduit par .dockerignore (liste blanche) : racine, packages/, apps/site, apps/game (sans
# Tauri), scripts, content, art.
COPY . .

# Lockfile figé ; racine + site + jeu web + outils de contenu (pas la CLI Tauri) ; aucun script
# d'installation.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --include-workspace-root \
      --workspace @arbre/site --workspace @arbre/game --workspace @arbre/content-tools

RUN npm run content:build \
 && npm run build -w @arbre/site \
 && npm run build -w @arbre/game \
 && cp -R apps/game/dist apps/site/build/jouer \
 && sh scripts/csp-hashes.sh apps/site/build /app/csp-hashes.conf \
 && sh scripts/precompress.sh apps/site/build

# ---------------------------------------------------------------------------------------------
FROM ${NGINX_IMAGE} AS runtime
LABEL org.opencontainers.image.title="L'Arbre aux absents — site" \
      org.opencontainers.image.description="Site vitrine statique (SvelteKit prérendu, nginx)" \
      org.opencontainers.image.vendor="CM Interactive" \
      org.opencontainers.image.source="https://github.com/fs0ciety7000/arbre-aux-absents"
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1

# Fichiers appartenant à root, en lecture seule pour l'utilisateur nginx (101).
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/csp-hashes.conf /etc/nginx/csp-hashes.conf
COPY --from=build /app/apps/site/build /usr/share/nginx/html

USER 101
RUN nginx -t -q
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
