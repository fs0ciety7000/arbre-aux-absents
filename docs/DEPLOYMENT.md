# DEPLOYMENT

> Maintenu par l'agent `devops`. Procédure détaillée : skill `/deploy-coolify`.

## Cible

| Élément | Valeur |
|---|---|
| Hébergeur | Coolify — `coolify.fs0ciety.org` |
| Domaine | `{{domaine}}` — demandé au kickoff (défaut `<nom>.fs0ciety.org`), Cloudflare proxied |
| Build | Dockerfile multi-stage, port `{{3000}}` |
| Healthcheck | `GET /api/health` → 200 |
| Branche déployée | `main` (auto-deploy) |

## Docker

- Image multi-stage minimale, utilisateur non-root, `HEALTHCHECK`, lockfile figé.
- `docker build -t {{app}} . && docker run -p 3000:3000 {{app}}`

## Variables d'environnement

| Nom | Obligatoire | Description |
|---|---|---|
| | | (miroir de `.env.example`) |

## CI (GitHub Actions)

`check` + `build` + `docker build` sur chaque push / PR.

## DNS Cloudflare

- Sous `fs0ciety.org` : CNAME `{{sous-domaine}}` → `fs0ciety.org`, proxied (convention de la zone).
- Autre domaine : zone ajoutée à Cloudflare (NS changés chez le registrar), enregistrement
  vers le serveur Coolify, proxied.
