# DEPLOYMENT

> Maintenu par l'agent `devops`. Procédure de mise en ligne : skill `/deploy-coolify`.
> **Site en ligne depuis le 13/10/2026** (feu vert de l'utilisateur) : https://arbre.cardormedia.com
> (domaine de production depuis le 13/10 au soir ; `arbre.fs0ciety.org` redirige en 301, `nginx.conf`).

Trois livrables, trois chaînes :

| Livrable | Où | Chaîne |
|---|---|---|
| Site vitrine (`apps/site`) | `arbre.cardormedia.com` (ancien : `arbre.fs0ciety.org` → 301), Coolify | `Dockerfile` → nginx statique |
| Jeu web (`apps/game`, build Vite) | `arbre.cardormedia.com/jouer/`, même image | copié dans le site au build Docker, CSP propre (`nginx.conf`) |
| Jeu (`apps/game`) | Windows, macOS, Linux, Android ; démo HTML5 itch.io | `.github/workflows/tauri.yml` ; build web dans `ci.yml` |
| Service de signalement (`apps/report`) | `arbre-api.cardormedia.com`, Coolify (app séparée) | `apps/report/Dockerfile` → Node 22 + SQLite sur `/data` (§5) |

## 1. Site vitrine (Coolify)

| Élément | Valeur |
|---|---|
| Hébergeur | Coolify — `coolify.fs0ciety.org` |
| Domaine | `https://arbre.cardormedia.com` (zone `cardormedia.com` : **A** `arbre` → `152.53.176.13`, proxied, comme les autres sous-domaines) ; `https://arbre.fs0ciety.org` gardé dans Coolify pour la redirection 301 |
| Build | `Dockerfile` à la racine, contexte `.` (liste blanche `.dockerignore` : racine, `packages/`, `apps/site/`, `scripts/`, `content/`, `art/`, `static/`) |
| Port exposé | `8080` (nginx non-root) |
| Healthcheck | `GET /healthz` → `200 ok` (aussi `HEALTHCHECK` Docker) |
| Branche déployée | `claude/project-thread-kdwfab` (auto-deploy) tant que `main` n'est pas fusionnée |
| Variables d'exécution | aucune |

### Image

- **Étape `build`** : `node:22-bookworm-slim` (digest épinglé) ; `npm ci --ignore-scripts` limité à la
  racine et aux workspaces `@arbre/site` et `@arbre/content-tools` (lockfile figé, ni Tauri ni le jeu) ; `content:build` ;
  build SvelteKit prérendu ; `scripts/csp-hashes.sh` (empreintes des scripts en ligne) ;
  `scripts/precompress.sh` (`.gz` reproductibles, `gzip -9 -n`).
- **Étape `runtime`** : `nginxinc/nginx-unprivileged:1.29-alpine` (digest épinglé), utilisateur 101,
  fichiers en lecture seule appartenant à root, `nginx -t` au build. Fonctionne avec
  `--read-only --tmpfs /tmp --cap-drop ALL` (testé par `scripts/docker-smoke.sh`).
- Les digests sont mis à jour par Dependabot (`.github/dependabot.yml`).

### nginx (`nginx.conf`)

- **CSP** : `default-src 'self'` ; `script-src 'self'` + empreintes sha256 des `<script>` en ligne ;
  `style-src 'self'` + empreintes sha256 des `<style>` en ligne : CSS de chaque page (inlinée par
  `kit.inlineStyleThreshold`, aucune feuille bloquante) et `art.css` embarqué dans les SVG d'art
  `/art/*.svg`. Aucun `'unsafe-inline'` pour les scripts ni les `<style>`. Les empreintes sont
  calculées au build par `scripts/csp-hashes.sh` (fragment `csp-hashes.conf` : `$csp_script_hashes`,
  `$csp_style_hashes`), et le serveur e2e (`tests/e2e/servers/static.mjs`) réutilise ce script.
  `style-src-attr 'unsafe-inline'` reste pour les attributs `style` du HTML prérendu (variables CSS
  posées par les composants : une empreinte ne les couvrirait qu'avec `'unsafe-hashes'`) ;
  `img-src 'self' data:` (fond de la carte d'accueil embarqué en `data:`) ; `object-src 'none'` ;
  `connect-src 'self' https://arbre-api.cardormedia.com` (service de signalement, §5 ; aussi sur
  `/jouer/`) ;
  `frame-src https://itch.io https://www.youtube-nocookie.com` (widget itch.io ; lecteur de la
  bande-annonce, chargé seulement au clic sur la façade de l'accueil, script en ligne haché comme
  les autres) ; `frame-ancestors 'none'` ; `base-uri`/`form-action 'self'`. Plus `nosniff`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, HSTS.
- **Cache** : `/_app/immutable/**` et `/art/<nom>.<empreinte>.svg` 1 an `immutable` ; HTML et `version.json` `no-cache` ;
  `/healthz` `no-store` ; autres fichiers statiques 1 jour.
- `gzip_static on` (fichiers précompressés), pas de compression à la volée. Cloudflare ajoute Brotli.
- **404** : `404.html` du site s'il existe (route prérendue `src/routes/404/`), sinon une page HTML
  minimale ; jamais la page par défaut de nginx. Fichiers cachés (`/.xxx`) → 404.
- **Site anglais** (`/en/`, mêmes slugs) : sa 404 est `/en/404.html` (prérendue), sinon une page
  minimale en anglais.
- **Pages de suivi** (`/suivi/`, `/en/suivi/`) : `Referrer-Policy: no-referrer` (le jeton de suivi
  est dans le fragment, D10) ; ailleurs `strict-origin-when-cross-origin` (`map $uri $referrer_policy`).
- Redirections relatives (`absolute_redirect off`) : pas de fuite du port 8080 derrière le proxy.

### En local

```bash
docker build -t arbre-site .
docker run --rm -p 8080:8080 arbre-site     # http://localhost:8080 , curl localhost:8080/healthz
sh scripts/docker-smoke.sh arbre-site 8080  # démarre, attend « healthy », vérifie santé, CSP, cache, 404 (FR et /en/), suivi
```

### Coolify (en production)

| Élément | Valeur |
|---|---|
| Instance | `https://coolify.fs0ciety.org` (Coolify 4.4.6), serveur `localhost` (`r0os4cws004gs88k840wckok`) |
| Projet | « Arbre aux absents » — uuid `9ncijjge9recntgn78krbybu`, environnement `production` (`rxkljsm57zpadq9seov0vffl`) |
| Application | `arbre-aux-absents-site` — uuid **`eweadblfcqdmi41stteqeskr`** |
| Source | GitHub App de l'instance (la même que les autres apps), repo `fs0ciety7000/arbre-aux-absents` |
| Branche | `claude/project-thread-kdwfab`, **auto-deploy** à chaque push |
| Build pack | Dockerfile (`/Dockerfile`), port exposé `8080` |
| Healthcheck Coolify | `GET http://127.0.0.1:8080/healthz` (hôte `127.0.0.1` et non `localhost` : nginx n'écoute qu'en IPv4) |
| Variables d'env | aucune |

Le nom du projet n'a pas d'apostrophe : l'API Coolify la refuse dans les noms de projet.

**Redéployer** :
- normalement : `git push origin claude/project-thread-kdwfab` (auto-deploy via la GitHub App) ;
- à la main : Coolify › projet « Arbre aux absents » › `arbre-aux-absents-site` › *Redeploy* ;
- par l'API (jeton dans l'environnement de l'opérateur, jamais dans le repo) :

```bash
curl -sS -X POST -H "Authorization: Bearer $COOLIFY_API_TOKEN" -H 'Content-Type: application/json' \
  "$COOLIFY_API_URL/api/v1/deploy" -d '{"uuid":"eweadblfcqdmi41stteqeskr","force":false}'
# suivi : GET $COOLIFY_API_URL/api/v1/deployments/<deployment_uuid>
```

**Passage sur `main`** (après fusion, avec l'accord de l'utilisateur) : changer la branche de
l'application (Coolify › Configuration › Git, ou `PATCH /api/v1/applications/eweadblfcqdmi41stteqeskr`
avec `{"git_branch":"main"}`), redéployer, puis mettre à jour ce tableau.

Vérification après déploiement : `curl -sI https://arbre.fs0ciety.org/` (200 + CSP),
`curl https://arbre.fs0ciety.org/healthz` (`ok`), une URL inconnue → 404. Au tout premier
déploiement Cloudflare répond **526** une à deux minutes, le temps que Traefik obtienne le
certificat Let's Encrypt d'origine.

### DNS Cloudflare

- Zone `fs0ciety.org` : **CNAME** `arbre` → `fs0ciety.org`, **proxied** (convention de la zone),
  créé le 13/10/2026 (id d'enregistrement `4508d1e26c873cca239e70206f8713e5`).
- HSTS : l'en-tête vu par le navigateur est celui de Cloudflare (`max-age=86400`, réglage de la zone),
  qui remplace celui de nginx (1 an).
- SSL/TLS « Full (strict) » ; le certificat d'origine est géré par Coolify (Let's Encrypt).
- Autre domaine : zone ajoutée à Cloudflare (NS changés chez le registrar), enregistrement vers le
  serveur Coolify, proxied.

## 2. Jeu : builds natifs (Tauri 2)

Configuration : `apps/game/src-tauri/` (Tauri ≥ 2.12, plugins `fs`, `dialog` et `opener`, aucune
commande Rust).

| Élément | Valeur |
|---|---|
| Identifiant | `org.cardormedia.arbreauxabsents` |
| Nom | « L’Arbre aux absents » avec apostrophe typographique U+2019 (binaire `arbre-aux-absents`) : l'apostrophe droite `'` casse l'installeur NSIS (`IsShortcutTarget` met le chemin du raccourci entre `'…'` : « NSISCOMCALL requires 4 parameter(s), passed 8 ») et les ressources Android |
| Version | celle de `apps/game/package.json` |
| Frontend | `frontendDist: ../dist`, `devUrl: http://localhost:5173` |
| Avant build | `npm run tauri:before-build` = `content:build` + `vite build --mode tauri` (`apps/game/.env.tauri` → `VITE_TARGET=tauri`) |
| CSP | `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `media-src 'self' blob:`, `connect-src 'self' ipc: http://ipc.localhost https://arbre-api.cardormedia.com` (service de signalement, §5) ; aucun autre domaine distant. L'origine de l'API y est **figée** : si `VITE_REPORT_API` change, changer aussi ce `connect-src`. `vite build --mode tauri` **échoue** si elles divergent (`apps/game/vite/report-csp.ts`) |
| Capabilities | `core:default`, plein écran, fermeture, `dialog` open/save, `fs` lecture/écriture/renommage/suppression **limités à `$APPDATA/saves/**`** (les chemins choisis dans un dialogue d'export/import sont ajoutés au scope par le plugin) ; `opener:allow-open-url` **limité à `https://arbre.cardormedia.com/*` et `https://cardorinteractive.itch.io/*`** (suivi des signalements, forum itch ; D11), sans `opener:default` |
| Linux | AppImage (`bundleMediaFramework: true`, GStreamer embarqué pour l'audio) + deb + rpm |
| Windows | NSIS par utilisateur, bootstrapper WebView2 |
| macOS | binaire universel (Intel + Apple Silicon), dmg, `minimumSystemVersion` 10.15 |
| Android | `minSdkVersion` 24, APK + AAB |
| Icônes | emblème du kit presse (cachet de cire à la fougère sur la nuit). Sources dans `src-tauri/icons/` : `app-icon.png` (icône à coins arrondis 1024 px), `app-icon-android-fg.png` (avant-plan adaptatif Android : cachet ≈ 53 dp sur 108, dans la zone sûre de 66 dp) et le manifeste `app-icon.json` (fond Android `#07152e`). `bash scripts/app-icons.sh` les redérive du kit (`apps/site/static/presse/kit/logos/`, ImageMagick) avec les icônes web du jeu (`apps/game/public/`), puis `npm run tauri:icons -w @arbre/game` régénère PNG/ICO/ICNS et `icons/android/` (supprimer le dossier `icons/ios/` qu'il crée, non utilisé) |

Commandes (racine) : `npm run tauri:dev` (alias `dev:tauri`), `npm run tauri:build`,
`npm run tauri:android`. En local il faut Rust stable et, sous Linux,
`libwebkit2gtk-4.1-dev libxdo-dev libssl-dev librsvg2-dev libayatana-appindicator3-dev`.

**Android** : `src-tauri/gen/` n'est pas versionné. `tauri android init` exige le SDK et le NDK
(`ANDROID_HOME`, `NDK_HOME`) : il est lancé en CI à chaque build, suivi de `tauri:icons` (qui
copie les icônes dans `gen/android`). En local : installer Android Studio (SDK 34+, NDK 27),
puis `npm run tauri -w @arbre/game -- android init` et `npm run tauri:android`. Pour
`tauri android dev` sur appareil, Vite doit écouter sur `TAURI_DEV_HOST` (à prévoir dans
`apps/game/vite.config.ts`). Le `versionCode` vient du numéro d'exécution CI (strictement croissant).

### Signature (à budgéter avant la vente)

| Plateforme | Sans secret | Avec secret |
|---|---|---|
| macOS | non signé : Gatekeeper bloque au premier lancement (clic droit › Ouvrir) | Developer ID + notarisation : **Apple Developer Program, 99 $/an** |
| Windows | non signé : SmartScreen avertit | certificat de signature de code (OV ~200–400 €/an ; EV ou Azure Trusted Signing ~10 $/mois) via `bundle.windows.signCommand`, à brancher le moment venu |
| Android | **APK debug** seulement (non publiable) | APK + AAB release signés (`scripts/android-sign.sh`) ; Play Console : 25 $ une fois |
| Linux | — | (optionnel) signature GPG de l'AppImage |

Le **keystore Android ne vit jamais dans le repo** : le garder hors ligne (gestionnaire de mots de
passe + sauvegarde), le perdre empêche toute mise à jour sur le Play Store (ou activer « Play App
Signing », recommandé). Création :

```bash
keytool -genkeypair -v -keystore arbre-release.jks -alias arbre -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 arbre-release.jks   # → secret ANDROID_KEYSTORE_B64
```

### itch.io (préparé, rien de publié)

Page prête à coller, canaux, visuels, thème et questions ouvertes : **`docs/ITCH.md`**.

Le build web (`apps/game/dist`, `base: './'`) est jouable tel quel dans l'iframe itch.io. La CI
produit les artefacts `game-web` (complet), `game-web-demo` (`content:build -- --edition demo`)
et `itch-zips` (`npm run package:itch` : `index.html` à la racine, moins de 1000 fichiers, vérifié
par `zipWebBuild`).

Envoi : `scripts/itch-push.sh [--dry-run] [--channels "…"] <artefacts> <compte/jeu>` pousse avec
`butler` un canal par cible (`html5-demo`, `html5`, `windows`, `macos`, `linux`, `android`) à partir
des artefacts de `ci.yml` (`itch-zips`) et de `tauri.yml` (`desktop-windows`,
`desktop-macos-universal`, `desktop-linux`, `android`), avec `--userversion` = version de
`apps/game/package.json`. Clé `BUTLER_API_KEY` lue dans l'environnement seulement ; `--dry-run`
affiche les commandes sans rien envoyer. Le job `itch` de `tauri.yml` le lance sur chaque tag `v*`.

## 3. CI (GitHub Actions)

### `ci.yml` — chaque push et PR

| Job | Contenu |
|---|---|
| `check` | `npm ci`, `content:build` (modules générés gitignorés), `npm run check` |
| `build` | `npm run build` → artefacts `game-web`, `site` ; build démo (`content:build -- --edition demo`, sortie `apps/game/dist-demo`) → `game-web-demo` ; `package:itch -- --skip-build` → `itch-zips` (`dist/itch/*.zip`) |
| `e2e` | si `tests/e2e/` existe : build, `playwright install --with-deps chromium webkit`, `npm run test:e2e` (sinon `playwright test --project=chromium --project=webkit`) ; rapport en artefact en cas d'échec |
| `docker` | buildx (cache GHA) puis `scripts/docker-smoke.sh` : run, `healthy`, `curl /healthz`, CSP (dont `connect-src`), cache, 404 FR et `/en/`, `Referrer-Policy` du suivi |
| `docker-report` | buildx de `apps/report/Dockerfile` (cache GHA `scope=report`) puis `scripts/docker-smoke.sh --report` : `healthy`, non-root, `/healthz` JSON, base créée dans `/data`, pas de `node_modules`, CORS autorisé/refusé, 404 |
| `rust-lint` | Ubuntu 24.04 + `libwebkit2gtk-4.1-dev` : `cargo fmt --check`, `cargo clippy --locked -D warnings` |

Cache : npm (`setup-node`), cargo (`Swatinem/rust-cache`), couches Docker (`type=gha`).

### `tauri.yml` — tag `v*`, lancement manuel ou commit « [tauri] »

- Tag `v*` : release **brouillon** créée d'abord, complétée par chaque job, publiée à la main.
  Lancement manuel : artefacts de workflow seulement (possible une fois le fichier sur `main`).
- Avant la fusion : un commit poussé sur une branche `claude/**` dont le message contient
  `[tauri]` lance les mêmes builds, en artefacts seulement (les autres poussées sont sautées).
- Matrice desktop via `tauri-apps/tauri-action` : `ubuntu-22.04` (AppImage, deb, rpm),
  `windows-latest` (NSIS, msi), `macos-latest` (`--target universal-apple-darwin`, dmg).
- Android : JDK 17, SDK **préinstallé** de l'image (`$ANDROID_HOME`, pas `setup-android`) + NDK 27,
  cibles Rust Android, `tauri android init --ci`, puis APK/AAB signés si les 4 secrets existent,
  sinon APK debug.
- Pièges connus : `tauriScript: npm run tauri` **sans** `--` final (tauri-action ajoute lui-même
  `--` avant `args`) ; sur `ubuntu-22.04`, retirer `libunwind-14-dev` avant d'installer
  `libgstreamer1.0-dev` (conflit avec `libunwind-dev`).

## 4. Variables et secrets

Aucun secret dans le repo ; `.env.example` en est le miroir.

### Variables de build (non secrètes)

| Nom | Où | Description |
|---|---|---|
| `ARBRE_EDITION` | `content:build` | `full` (défaut) ou `demo` ; équivaut à `-- --edition` |
| `VITE_TARGET` | build du jeu | `web` (défaut) ou `tauri` (posé par `apps/game/.env.tauri`) |
| `VITE_REPORT_API` | builds du jeu et du site | `https://arbre-api.cardormedia.com` (public). Absente : même valeur par défaut ; service injoignable : repli « Copier le rapport » et forum itch.io. La CSP du build web du jeu la suit ; celles de Tauri (`tauri.conf.json`, vérifiée au build `--mode tauri`) et de nginx (`nginx.conf`) l'écrivent en dur : les changer ensemble |

Les variables d'exécution du service de signalement (dont `GITHUB_TOKEN` et
`GITHUB_WEBHOOK_SECRET`) vivent dans Coolify uniquement : §5.

### Secrets GitHub Actions (à créer par l'utilisateur, tous optionnels)

| Secret | Usage |
|---|---|
| `ANDROID_KEYSTORE_B64` | keystore release en base64 |
| `ANDROID_KEY_ALIAS` | alias de la clé |
| `ANDROID_KEY_PASSWORD` | mot de passe de la clé |
| `ANDROID_STORE_PASSWORD` | mot de passe du keystore |
| `APPLE_CERTIFICATE` | certificat Developer ID Application `.p12` en base64 |
| `APPLE_CERTIFICATE_PASSWORD` | mot de passe du `.p12` |
| `APPLE_SIGNING_IDENTITY` | ex. `Developer ID Application: … (TEAMID)` |
| `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | notarisation (mot de passe d'application) |
| `BUTLER_API_KEY` | secret GitHub : publication itch.io sur tag `v*` (job `itch` de `tauri.yml`) ; en local, exportée dans le shell pour `scripts/itch-push.sh` |

`GITHUB_TOKEN` (automatique) suffit pour les releases. Coolify et Cloudflare se configurent dans
leurs interfaces ; leurs jetons d'API restent sur le poste de l'opérateur.

## 5. Service de signalement (`apps/report`, Coolify)

Signaler un problème depuis le jeu ou le site, puis suivre son ticket sans compte (ARCHITECTURE §8,
décisions D9 à D13). App Coolify **séparée** du site : `https://arbre-api.cardormedia.com`.

| Élément | Valeur |
|---|---|
| Domaine | `https://arbre-api.cardormedia.com` (sous-domaine à un niveau : couvert par le certificat Cloudflare) |
| Build | `apps/report/Dockerfile`, **contexte `.`** (racine du repo). BuildKit lit `apps/report/Dockerfile.dockerignore` (liste blanche : `package.json`, `package-lock.json`, `tsconfig.base.json`, `packages/contract/`, `apps/report/`) à la place du `.dockerignore` du site, qui exclut `apps/report` |
| Image | `node:22-bookworm-slim` épinglée par digest (la même que le site) ; étape `build` : `npm ci --ignore-scripts` (lockfile figé, racine + `@arbre/report`), `npm run build -w @arbre/report` → `dist/server.js` et `dist/admin.js` autonomes (zod et le contrat embarqués) ; étape `runtime` : `dist/` + `package.json` seulement, **aucun `node_modules`**, fichiers à root en lecture seule, utilisateur `node` (1000) |
| Port exposé | `8090` |
| Healthcheck | `GET /healthz` → `200 {ok, github: 'ok'\|'degraded', pending, failed}`. `degraded` : pas de jeton, jeton refusé (401) ou GitHub injoignable ; la soumission reste acceptée (file `pending`). Sonde : `node dist/admin.js healthcheck` (`HEALTHCHECK` Docker et healthcheck Coolify : l'image n'a ni curl ni wget) |
| Stockage | **volume persistant `/data`** (base SQLite, `DATA_DIR=/data`), seul dossier inscriptible ; `VOLUME /data` dans l'image. Sans volume Coolify nommé, chaque redéploiement repart d'une base vide (tickets et jetons de suivi perdus) |
| Commande | `node dist/server.js` (`NODE_OPTIONS=--disable-warning=ExperimentalWarning` pour `node:sqlite`) |
| Branche | celle du site (auto-deploy) ; voir « Ordre de déploiement » |
| **Statut** | **en ligne depuis le 15/10/2026**, `github: "degraded"` tant que `GITHUB_TOKEN` n'est pas saisi (voir « Reste à faire ») |

### En local

```bash
docker build -f apps/report/Dockerfile -t arbre-report .
docker run --rm -p 8090:8090 -v arbre-report-data:/data arbre-report   # curl localhost:8090/healthz
sh scripts/docker-smoke.sh --report arbre-report 8090   # healthy, non-root, /healthz, /data, CORS, 404
```

Sans `GITHUB_TOKEN`, le service démarre et ne parle pas à GitHub (tout reste dans la file
`pending`) : c'est le mode du test de fumée. En dev sans Docker : `npm run dev:report` (variables
dans `apps/report/.env.local`, gitignoré).

### DNS Cloudflare

Zone `cardormedia.com` : **A** `arbre-api` → `152.53.176.13`, **proxied**, comme `arbre` (créé le
15/10/2026, id d'enregistrement `529ba9d49ff727d10a8e575fb60db12d`). SSL/TLS « Full (strict) », certificat d'origine
Let's Encrypt géré par Coolify (526 une à deux minutes au premier déploiement, comme pour le site).
Cloudflare transmet `CF-Connecting-IP`, seule entrée de la limitation de débit (HMAC en mémoire,
jamais stocké) : le service doit rester derrière le proxy Cloudflare. L'origine est **fermée aux IP
non Cloudflare** pour cette app seulement (middleware Traefik `arbre-api-cf-only`, voir Coolify
ci-dessous) : sans cela, un client qui joint `152.53.176.13` directement pourrait inventer son
`CF-Connecting-IP` et contourner la limite de débit.

### Coolify

| Élément | Valeur |
|---|---|
| Application | `arbre-aux-absents-report` — uuid **`swybrgki0ennurono4isofot`** (projet `9ncijjge9recntgn78krbybu`, env. `rxkljsm57zpadq9seov0vffl`, serveur `r0os4cws004gs88k840wckok`) |
| Source | GitHub App de l'instance (`cckkooog08wk8088gg8wg4sk`, la même que le site), branche `claude/project-thread-kdwfab`, **auto-deploy** |
| Build | Dockerfile `/apps/report/Dockerfile`, base `/`, port `8090`, domaine `https://arbre-api.cardormedia.com` |
| *Watch paths* | `apps/report/**`, `packages/contract/**`, `package-lock.json` : un push qui ne touche que le site ne redéploie pas le service. Le site, lui, n'a pas de *watch paths* (son image dépend de presque tout le repo) et se redéploie à chaque push |
| Volume | persistant `swybrgki0ennurono4isofot-arbre-report-data` (uuid `jqi9r23nbriiuv9wxcd232fk`) → `/data` |
| Healthcheck | type **commande** : `node dist/admin.js healthcheck` (le type HTTP de Coolify exige curl ou wget, absents de l'image, et le champ commande refuse guillemets et parenthèses) |
| Variables | `GITHUB_REPO`, `ALLOWED_ORIGINS`, `PUBLIC_SITE_URL`, `DATA_DIR`, `REPORTS_ENABLED`, `TICKET_PREFIX`, `GITHUB_WEBHOOK_SECRET` (posé, généré localement, jamais affiché), `GITHUB_TOKEN` **vide** (à saisir) ; toutes à l'exécution seulement, aucune au build |
| Origine fermée | *Container labels* personnalisés : middleware `traefik.http.middlewares.arbre-api-cf-only.ipallowlist.sourcerange=<plages IPv4 et IPv6 de https://api.cloudflare.com/client/v4/ips>` ajouté au routeur `https-0-swybrgki0ennurono4isofot` (`middlewares=gzip,arbre-api-cf-only`). Vérifié : avec une plage factice le service répond 403 via Cloudflare, avec les plages Cloudflare 200 (Traefik voit bien l'IP Cloudflare). Sans effet sur les autres apps du serveur |

Attention aux *labels* : ils sont figés. Si le domaine change, ou après *Reset labels to defaults*
dans Coolify, remettre les deux lignes `arbre-api-cf-only`. Plages Cloudflare à revoir une fois par an.

Redéployer : `git push` d'un fichier sous les *watch paths*, Coolify › `arbre-aux-absents-report` ›
*Redeploy*, ou `POST $COOLIFY_API_URL/api/v1/deploy` avec `{"uuid":"swybrgki0ennurono4isofot"}`.

Création (faite le 15/10/2026, pour mémoire) : projet « Arbre aux absents », environnement `production`,
**nouvelle application** :

1. Source : même GitHub App et même repo `fs0ciety7000/arbre-aux-absents`, même branche que le site.
2. Build pack **Dockerfile** ; *Base directory* `/` ; *Dockerfile location* `/apps/report/Dockerfile`.
3. Port exposé `8090` ; domaine `https://arbre-api.cardormedia.com`.
4. Healthcheck : type commande, `node dist/admin.js healthcheck` (sonde `http://127.0.0.1:8090/healthz`).
5. *Persistent storage* : volume nommé (ex. `arbre-report-data`) monté sur **`/data`**.
6. Variables d'environnement (miroir : `.env.example`, bloc « Service de signalement ») ; cocher
   *Is secret* pour `GITHUB_TOKEN` et `GITHUB_WEBHOOK_SECRET`, jamais *Build variable* :

| Variable | Valeur |
|---|---|
| `GITHUB_TOKEN` | jeton fine-grained (ci-dessous) — **secret** |
| `GITHUB_REPO` | `fs0ciety7000/arbre-aux-absents-signalements` (dépôt **privé**, D12) |
| `GITHUB_WEBHOOK_SECRET` | ≥ 16 caractères aléatoires (`openssl rand -hex 32`), le même que dans le webhook — **secret** |
| `ALLOWED_ORIGINS` | `https://arbre.cardormedia.com,tauri://localhost,http://tauri.localhost,https://html-classic.itch.zone` |
| `PUBLIC_SITE_URL` | `https://arbre.cardormedia.com` |
| `DATA_DIR` | `/data` |
| `REPORTS_ENABLED` | `true` (`false` : interrupteur d'urgence, `POST /v1/reports` → 503 `disabled`) |
| `TICKET_PREFIX` | `AA` |

Le contact laissé par un joueur ne se lit que depuis le terminal Coolify de l'app :
`node dist/admin.js contact AA-0042`. Aucune route HTTP d'administration.

`/healthz` `failed` > 0 : une opération GitHub a été abandonnée après 8 erreurs 4xx permanentes
(ticket refusé par GitHub, ex. 422). `node dist/admin.js pending` liste les lignes `ÉCHEC` (ticket,
opération, statut HTTP) ; `status AA-0042` les détaille ; une fois la cause corrigée,
`retry AA-0042` remet l'opération dans la file. Le joueur garde son ticket (« reçu ») entre-temps.

### Jeton GitHub fine-grained

GitHub › Settings › Developer settings › Fine-grained tokens › *Generate new token* :

- *Resource owner* `fs0ciety7000` ; *Repository access* : **Only select repositories** →
  `fs0ciety7000/arbre-aux-absents-signalements` seulement ;
- *Repository permissions* : **Issues : Read and write**, **Metadata : Read-only** (obligatoire),
  rien d'autre ;
- expiration : 1 an au plus. **Noter la date d'expiration** (agenda + ROADMAP) et poser un rappel
  deux semaines avant. Un jeton expiré fait passer `/healthz` en `degraded` ; les signalements
  restent acceptés et s'accumulent dans la file `pending` jusqu'au nouveau jeton (Coolify ›
  variables › redéployer).

### Webhook GitHub

Dépôt `fs0ciety7000/arbre-aux-absents-signalements` › Settings › Webhooks › *Add webhook* :

- *Payload URL* `https://arbre-api.cardormedia.com/v1/github/webhook` ; *Content type*
  `application/json` ; *Secret* = `GITHUB_WEBHOOK_SECRET` (vérifié en HMAC SHA-256) ;
- *Let me select individual events* : **Issues**, **Issue comments**, **Milestones** (rien d'autre) ;
- après l'enregistrement, *Recent Deliveries* : le `ping` doit recevoir une réponse 2xx.

Le rapprochement toutes les 30 min et le rafraîchissement à la lecture rattrapent un webhook perdu.

### Étiquettes et jalons

```bash
gh auth login                                     # compte administrateur du dépôt des signalements
sh scripts/report-labels.sh --dry-run             # affiche les commandes
sh scripts/report-labels.sh --milestone v1.2.0    # crée/met à jour les étiquettes + le jalon
```

Le script crée (idempotent, `gh label create --force`) : `signalement`, `source:jeu`,
`source:site`, `cat:<catégorie>` (les 8 de `REPORT_CATEGORIES`), `langue:en`, `statut:confirmé`,
`statut:en-cours`, `doublon`, `public`. Ces noms sont lus par le service : ne pas les renommer.

**Jalons `vX.Y.Z`** : un par version publiée du jeu (`--milestone vX.Y.Z`, ou GitHub › Issues ›
Milestones). Fermer un ticket « completed » avec le jalon de la version qui le corrige : le joueur
voit « Corrigé dans vX.Y.Z ». Fermé sans jalon : « Classé (résolu) » ; « not planned » : « Classé
(non retenu) ». Réponse visible du joueur : commentaire d'un mainteneur dont la première ligne
est `/public`. Problème connu : étiquette `public` (titre relu avant) et, en anglais, commentaire
`/public-title-en <titre>`.

### Reste à faire à la main (15/10/2026)

1. **Jeton** : créer le jeton fine-grained (section ci-dessus), puis Coolify › projet « Arbre aux
   absents » › `arbre-aux-absents-report` › *Environment Variables* › `GITHUB_TOKEN` › coller la
   valeur, cocher *Is secret* (cadenas) › *Save* › *Redeploy*. `/healthz` doit passer à `github: "ok"`.
2. **Webhook** (l'API GitHub n'était pas accessible depuis la session de déploiement) : GitHub ›
   `fs0ciety7000/arbre-aux-absents-signalements` › Settings › Webhooks › *Add webhook*, réglages de la
   section « Webhook GitHub » ; le *Secret* est la valeur de `GITHUB_WEBHOOK_SECRET` à copier depuis
   Coolify › *Environment Variables* (icône œil), puis cocher *Is secret* sur cette variable dans
   Coolify. Vérifier le `ping` en 2xx (*Recent Deliveries*). Sans signature valide, la route répond 401
   (vérifié).
3. **Étiquettes** : `sh scripts/report-labels.sh --milestone v1.2.0` depuis un poste où `gh` est
   connecté avec un compte administrateur du dépôt (même raison).
4. Test réel de bout en bout (« Ordre de déploiement », point 3).

### Ordre de déploiement

1. DNS `arbre-api`, puis app Coolify (volume, variables), puis `curl https://arbre-api.cardormedia.com/healthz`.
2. Étiquettes (`scripts/report-labels.sh`) et webhook (ping 2xx).
3. Test réel : un signalement depuis le site → ticket dans le dépôt privé, lien de suivi qui
   affiche « Reçu » ; poser `statut:confirmé` → le suivi passe à « Confirmé ».
4. Seulement ensuite : redéployer le site et publier les builds du jeu construits avec
   `VITE_REPORT_API` (CSP déjà ouverte vers `arbre-api`). Le service doit être en ligne **avant**
   tout build de jeu qui pointe vers lui ; pendant l'intervalle, le repli hors ligne du jeu
   (« Copier le rapport ») couvre les joueurs.

Vérification : `curl -s https://arbre-api.cardormedia.com/healthz` (`"ok":true`, `github: "ok"`),
`curl -sI -X OPTIONS -H 'Origin: https://arbre.cardormedia.com' -H 'Access-Control-Request-Method: POST' https://arbre-api.cardormedia.com/v1/reports`
(`access-control-allow-origin`).
