# DEPLOYMENT

> Maintenu par l'agent `devops`. Procédure de mise en ligne : skill `/deploy-coolify`.
> **Rien n'est mis en ligne sans le feu vert de l'utilisateur** (ROADMAP › Décisions).

Deux livrables, deux chaînes :

| Livrable | Où | Chaîne |
|---|---|---|
| Site vitrine (`apps/site`) | `arbre.fs0ciety.org`, Coolify | `Dockerfile` → nginx statique |
| Jeu (`apps/game`) | Windows, macOS, Linux, Android ; démo HTML5 itch.io | `.github/workflows/tauri.yml` ; build web dans `ci.yml` |

## 1. Site vitrine (Coolify)

| Élément | Valeur |
|---|---|
| Hébergeur | Coolify — `coolify.fs0ciety.org` |
| Domaine | `arbre.fs0ciety.org` (défaut), Cloudflare proxied |
| Build | `Dockerfile` à la racine, contexte `.` (liste blanche `.dockerignore` : racine, `packages/`, `apps/site/`, `scripts/`, `content/`, `art/`, `static/`) |
| Port exposé | `8080` (nginx non-root) |
| Healthcheck | `GET /healthz` → `200 ok` (aussi `HEALTHCHECK` Docker) |
| Branche déployée | `main` (auto-deploy), après feu vert |
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

- **CSP** : `default-src 'self'` ; `script-src 'self'` + empreintes sha256 générées au build (aucun
  `'unsafe-inline'` pour les scripts) ; `style-src 'self'` et `style-src-attr 'unsafe-inline'`
  (attributs `style` du HTML prérendu) ; `img-src 'self' data:` ; `object-src 'none'` ;
  `frame-ancestors 'none'` ; `base-uri`/`form-action 'self'`. Plus `nosniff`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, HSTS.
- **Cache** : `/_app/immutable/**` 1 an `immutable` ; HTML et `version.json` `no-cache` ;
  `/healthz` `no-store` ; autres fichiers statiques 1 jour.
- `gzip_static on` (fichiers précompressés), pas de compression à la volée. Cloudflare ajoute Brotli.
- **404** : `404.html` du site s'il existe (route prérendue `src/routes/404/`), sinon une page HTML
  minimale ; jamais la page par défaut de nginx. Fichiers cachés (`/.xxx`) → 404.
- Redirections relatives (`absolute_redirect off`) : pas de fuite du port 8080 derrière le proxy.

### En local

```bash
docker build -t arbre-site .
docker run --rm -p 8080:8080 arbre-site     # http://localhost:8080 , curl localhost:8080/healthz
sh scripts/docker-smoke.sh arbre-site 8080  # démarre, attend « healthy », vérifie santé, CSP, cache, 404
```

### Coolify (à faire au feu vert, skill `/deploy-coolify`)

1. Nouvelle ressource « Application » depuis le repo GitHub, Build Pack **Dockerfile**, branche `main`.
2. Port exposé `8080`, domaine `https://arbre.fs0ciety.org`.
3. Healthcheck : chemin `/healthz`, port `8080` (le `HEALTHCHECK` de l'image suffit aussi).
4. Aucune variable d'environnement. Optionnel : conteneur en lecture seule + tmpfs `/tmp`.

### DNS Cloudflare

- Zone `fs0ciety.org` : **CNAME** `arbre` → `fs0ciety.org`, **proxied** (convention de la zone).
- SSL/TLS « Full (strict) » ; le certificat d'origine est géré par Coolify (Let's Encrypt).
- Autre domaine : zone ajoutée à Cloudflare (NS changés chez le registrar), enregistrement vers le
  serveur Coolify, proxied.

## 2. Jeu : builds natifs (Tauri 2)

Configuration : `apps/game/src-tauri/` (Tauri ≥ 2.12, plugins `fs` et `dialog`, aucune commande Rust).

| Élément | Valeur |
|---|---|
| Identifiant | `org.cardormedia.arbreauxabsents` |
| Nom | « L'Arbre aux absents » (binaire `arbre-aux-absents`) |
| Version | celle de `apps/game/package.json` |
| Frontend | `frontendDist: ../dist`, `devUrl: http://localhost:5173` |
| Avant build | `npm run tauri:before-build` = `content:build` + `vite build --mode tauri` (`apps/game/.env.tauri` → `VITE_TARGET=tauri`) |
| CSP | `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `media-src 'self' blob:`, `connect-src ipc:` ; aucun domaine distant |
| Capabilities | `core:default`, plein écran, fermeture, `dialog` open/save, `fs` lecture/écriture/renommage/suppression **limités à `$APPDATA/saves/**`** (les chemins choisis dans un dialogue d'export/import sont ajoutés au scope par le plugin) |
| Linux | AppImage (`bundleMediaFramework: true`, GStreamer embarqué pour l'audio) + deb + rpm |
| Windows | NSIS par utilisateur, bootstrapper WebView2 |
| macOS | binaire universel (Intel + Apple Silicon), dmg, `minimumSystemVersion` 10.15 |
| Android | `minSdkVersion` 24, APK + AAB |
| Icônes | provisoires, depuis `src-tauri/icons/app-icon.svg` : `npm run tauri:icons -w @arbre/game` |

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

### Démo itch.io (plus tard)

Le build web (`apps/game/dist`, `base: './'`) est jouable tel quel dans l'iframe itch.io. La CI
produit les artefacts `game-web` (complet), `game-web-demo` (`content:build -- --edition demo`)
et `itch-zips` (`npm run package:itch`). Publication : workflow `itch.yml` à venir, `butler push` par canal
(`html5-demo`, puis `windows`, `mac`, `linux`, `android`), clé `BUTLER_API_KEY`.

## 3. CI (GitHub Actions)

### `ci.yml` — chaque push et PR

| Job | Contenu |
|---|---|
| `check` | `npm ci`, `content:build` (modules générés gitignorés), `npm run check` |
| `build` | `npm run build` → artefacts `game-web`, `site` ; build démo (`content:build -- --edition demo`, sortie `apps/game/dist-demo`) → `game-web-demo` ; `package:itch -- --skip-build` → `itch-zips` (`dist/itch/*.zip`) |
| `e2e` | si `tests/e2e/` existe : build, `playwright install --with-deps chromium webkit`, `npm run test:e2e` (sinon `playwright test --project=chromium --project=webkit`) ; rapport en artefact en cas d'échec |
| `docker` | buildx (cache GHA) puis `scripts/docker-smoke.sh` : run, `healthy`, `curl /healthz`, CSP, cache, 404 |
| `rust-lint` | Ubuntu 24.04 + `libwebkit2gtk-4.1-dev` : `cargo fmt --check`, `cargo clippy --locked -D warnings` |

Cache : npm (`setup-node`), cargo (`Swatinem/rust-cache`), couches Docker (`type=gha`).

### `tauri.yml` — tag `v*` ou lancement manuel

- Tag `v*` : release **brouillon** créée d'abord, complétée par chaque job, publiée à la main.
  Lancement manuel : artefacts de workflow seulement.
- Matrice desktop via `tauri-apps/tauri-action` : `ubuntu-22.04` (AppImage, deb, rpm),
  `windows-latest` (NSIS, msi), `macos-latest` (`--target universal-apple-darwin`, dmg).
- Android : JDK 17, SDK + NDK 27, cibles Rust Android, `tauri android init --ci`, puis APK/AAB
  signés si les 4 secrets existent, sinon APK debug.

## 4. Variables et secrets

Aucun secret dans le repo ; `.env.example` en est le miroir.

### Variables de build (non secrètes)

| Nom | Où | Description |
|---|---|---|
| `ARBRE_EDITION` | `content:build` | `full` (défaut) ou `demo` ; équivaut à `-- --edition` |
| `VITE_TARGET` | build du jeu | `web` (défaut) ou `tauri` (posé par `apps/game/.env.tauri`) |

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
| `BUTLER_API_KEY` | plus tard, publication itch.io |

`GITHUB_TOKEN` (automatique) suffit pour les releases. Coolify et Cloudflare se configurent dans
leurs interfaces ; leurs jetons d'API restent sur le poste de l'opérateur.
