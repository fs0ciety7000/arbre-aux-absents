---
name: deploy-coolify
description: Met en production une app Dockerisée sur Coolify (coolify.fs0ciety.org) sur le domaine choisi au kickoff (défaut *.fs0ciety.org, autre domaine possible) via Cloudflare. À utiliser quand l'utilisateur demande de déployer, mettre en prod ou configurer le domaine.
---
# Déploiement Coolify + Cloudflare

Délègue à `devops`. Prérequis : image Docker qui build et répond 200 sur /api/health.

0. **Domaine** : lire celui consigné dans `docs/DEPLOYMENT.md`. Absent → le demander
   (défaut proposé `<nom>.fs0ciety.org`). Autre domaine : vérifier que sa zone est sur
   Cloudflare (sinon donner les étapes : ajout de la zone + changement des NS chez le
   registrar) ; apex → enregistrement A/CNAME aplati vers le serveur Coolify.
1. **DNS Cloudflare** : sous `fs0ciety.org`, CNAME `<sous-domaine>` → `fs0ciety.org`,
   proxied (convention de la zone) ; autre domaine, enregistrement vers le serveur Coolify,
   proxied. Token API Cloudflare en variable d'env (`CLOUDFLARE_API_TOKEN`), jamais commité.
2. **Coolify** : projet dédié, application depuis le repo GitHub (GitHub App), build pack
   Dockerfile, port exposé, domaine `https://<domaine choisi>`, healthcheck
   `/api/health`, auto-deploy sur `main`, variables d'env copiées de `.env.example`.
   Token API Coolify en variable d'env (`COOLIFY_API_TOKEN`), jamais commité.
3. Déclencher le déploiement, suivre les logs, vérifier `curl -I https://<domaine>/api/health`.
4. Consigner dans `docs/DEPLOYMENT.md` (uuid de l'app, branche, domaine) et ROADMAP.
Si un accès manque (token, réseau), le dire et donner les étapes manuelles exactes.
