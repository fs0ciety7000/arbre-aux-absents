# Polices — licences et provenance

Toutes les polices sont sous **SIL Open Font License 1.1** (texte complet dans `OFL-*.txt`).
Fichiers WOFF2 non modifiés, issus des paquets npm **@fontsource** 5.3.0 (13 oct. 2026), déjà
sous-ensemblés par Fontsource en tranches `latin` et `latin-ext` (déclarées avec `unicode-range`
dans `../styles/fonts.css`). Aucun nom réservé n'est réutilisé pour une version modifiée.

| Famille CSS                | Rôle                                              | Paquet                                            | Fichiers                                                               | Licence                              |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| Literata                   | Serif de lecture et de titrage (axes opsz + wght) | `@fontsource-variable/literata`                   | `literata-latin(-ext)-opsz-normal`, `literata-latin(-ext)-wght-italic` | `OFL-literata.txt`                   |
| Instrument Sans            | Interface (wght 400–700)                          | `@fontsource-variable/instrument-sans`            | `instrument-sans-latin(-ext)-wght-normal`                              | `OFL-instrument-sans.txt`            |
| Courier Prime              | Machine à écrire (400, 700)                       | `@fontsource/courier-prime`                       | `courier-prime-latin(-ext)-{400,700}-normal`                           | `OFL-courier-prime.txt`              |
| Caveat                     | Manuscrite décorative, remplaçable                | `@fontsource-variable/caveat`                     | `caveat-latin(-ext)-wght-normal`                                       | `OFL-caveat.txt`                     |
| Atkinson Hyperlegible Next | Option de lisibilité                              | `@fontsource-variable/atkinson-hyperlegible-next` | `atkinson-hyperlegible-next-latin(-ext)-wght-{normal,italic}`          | `OFL-atkinson-hyperlegible-next.txt` |

Mise à jour : `npm pack <paquet>` dans un dossier temporaire, recopier les fichiers listés, mettre à
jour la version ci-dessus et les poids dans docs/DESIGN.md §3.
