# Brief commun des lots T1 (traduction des pièces en anglais)

Worktree `/home/user/arbre-i18n`, branche `claude/i18n-en`. D'autres agents travaillent en même temps
dans ce worktree (code du jeu, site, autres lots de traduction) : tu ne touches **qu'aux fichiers de
ton lot**.

## À lire avant d'écrire
1. `docs/i18n/PLAN.md` (§ règles des calques, règle 12, lot T1).
2. `docs/i18n/en/GLOSSAIRE.md` : obligatoire, à suivre à la lettre (registres, typographie, noms
   propres jamais traduits, institutions, tampons, métiers, §9 termes de recherche et genre).
3. `docs/i18n/en/<id-de-l-affaire>.md` : table id → libellé et termes anglais de l'affaire, pièges de
   parité des liens pièce par pièce, indices de genre. Les termes de recherche y sont **fixés**.
4. Exemple de format : `packages/content-tools/fixtures/mini/content/cases/mini/locales/en/`
   (documents, fins, JSON) face au français de `packages/content-tools/fixtures/mini/content/cases/mini/`.

## Règles
- Fichier anglais = même chemin relatif sous `content/cases/<id>/locales/en/` que la source française.
- Frontmatter : seuls les champs traduisibles (le format exact est celui de la fixture et du schéma
  dans `packages/contract/src/i18n.ts`) ; jamais `hearing`, ni les ids, dates, `reveals`, `place`.
- Liens `[[texte|id]]` conservés avec le même id ; même ensemble de mots-clés liés par pièce que le
  français (parité, règle 12.3) : un mot anglais courant qui recouperait un terme crée un lien en trop.
- Même ordre et même nombre de figures, `::stamp`, `::redacted`, `::hand` (gardé) ; aucun HTML.
- Anglais britannique, registre d'époque selon le type de pièce ; on traduit le sens et la voix, pas
  mot à mot. Les noms propres et lieux de la carte ne sont jamais traduits.
- Les indices de déduction (genre, dates, chiffres, noms) doivent survivre à la traduction.

## Vérification (porte G3)
`npm run content:i18n -- --case <id> --only '<glob du lot>'` doit finir à **0 erreur**. Ne lance ni
`npm run check`, ni `npm run build`, ni `content:build`.

## Livraison
- `prettier --check` sur tes fichiers (Markdown et JSON).
- `git add <tes fichiers>` puis `git commit -- <tes chemins>` (jamais `git commit -a`, jamais
  `git stash`), message conventionnel en français, ex. `content(i18n): pièces ph de la Succession
  Varenque en anglais (lot V1)`, terminé par les deux lignes :
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_011WgRbQiUpjveoVBv1rGWFZ`
- Si `.git/index.lock` existe, attends quelques secondes et réessaie. Puis `git push origin
  claude/i18n-en` ; s'il est refusé, `git fetch` puis `git rebase origin/claude/i18n-en` n'est pas
  possible avec un worktree sale : préviens simplement dans ton rapport, l'orchestrateur poussera.
- Rapport court : fichiers, résultat de `content:i18n`, choix discutables (surtout ceux qui touchent
  la déduction).
