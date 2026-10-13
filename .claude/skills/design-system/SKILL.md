---
name: design-system
description: Crée ou fait évoluer le design system du projet (docs/DESIGN.md, tokens OKLCH, typographie, motion, primitives UI, page /design). À utiliser au kickoff, ou dès qu'une UI a besoin d'un token/composant inexistant.
---
# Design system

Délègue à l'agent `design-lead` (tu restes orchestrateur) avec ce brief :

1. **Direction** : une métaphore forte + 3-4 piliers (cf. docs/DESIGN.md §1). Si l'utilisateur
   n'a rien donné, proposer 2 directions contrastées en 3 lignes chacune et lui faire choisir.
2. **Tokens** (OKLCH) : canvas, surfaces ×3, lignes ×2, textes ×3, accent unique + contraste,
   états. Palette par défaut du framework désactivée. Contrastes AA **calculés** et notés.
3. **Typo** : display + texte auto-hébergées, échelle fluide `clamp()`.
4. **Espacement / rayons / grille / breakpoints**.
5. **Motion** : easings + durées en tokens, règles GSAP/Motion/Lenis, reduced-motion.
6. **Primitives** : Button, Input, Card, Badge, Tooltip, Dialog, Toast (+ besoins du projet),
   tous états (hover, focus-visible, active, disabled, loading), a11y.
7. **Démo** `/design` (noindex) qui montre tokens + primitives.
8. Checklist de conformité §7 à jour (utilisée par qa-reviewer).

Vérification : `check`, rendu de `/design` en 360 px et desktop, reduced-motion activé.
