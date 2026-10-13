# art/ — carte de la Velmarche

Carte du monde imaginaire du jeu, gravée en taille-douce et rehaussée d'aquarelle (DESIGN §10),
générée par script. Géographie : `docs/monde/00-monde.md` §3. Repère et contrat : ARCHITECTURE §3.

## Générer

```bash
python3 art/tools/build.py              # 5 couches + content/world/map.json + places/*.json
python3 art/tools/build.py relief water # quelques couches seulement
npm run content:check                   # règles 8 (SVG) et 9 (budgets)
```

Python 3.10+, **aucune dépendance**. Graine fixe (`common.SEED = 1974`) : deux exécutions
donnent des fichiers identiques à l'octet près. Ne pas retoucher les SVG à la main : modifier les
scripts puis régénérer.

## Repère

- `aspect` = **1,35** (paysage proche du 4:3 de la bible, viewBox entière) : viewBox `0 0 1350 1000`.
- Positions normalisées (x, y) ∈ [0, 1], origine en haut à gauche ; les lieux de
  `content/world/places/<id>.json` reprennent exactement les ancres des vignettes.
- Échelle : 70 lieues velmarchoises d'ouest en est, soit environ 15,8 unités par lieue
  (1 lieue = 4,6 km).

## Couches (`art/map/`)

| Couche | Contenu |
|---|---|
| `base.svg` | papier, mers (`water`, eaux profondes `water-deep`), terre (`<use>` du trait de côte), lavis des provinces (Ostrie lilas, vallée sauge, Thalberie ardoise), liseré carmin et trait mixte de la frontière, limite de l'Ostrie, routes (double trait) et chemins (tirets) |
| `relief.svg` | labours en marqueterie autour des villes, falaises hachurées de l'Ostrie, landes de bruyère, menhirs, roselières de Grisenoue, collines en taupinières, forêts (feuillus et pins), monts Corvins en profils gravés (corps papier, ombre hachurée, du fond vers l'avant) |
| `water.svg` | lignes d'eau parallèles aux côtes, vagues du large, lignes de paquebots, Orvelle/Clairette/ruisseaux en rubans à largeur croissante, lacs, mares, récif des Dents de Tennok, ponts |
| `places.svg` | un `<g id="places-<id>">` par lieu : vignette gravée (lavis à l'intérieur) + toponyme du lieu |
| `labels.svg` | provinces, pays, eaux, hameaux d'Ostrie, notes du graveur, rose des vents à la fougère, échelle en lieues, cartouche « La Velmarche », cadre gradué à double filet |

Couleurs **uniquement par classes** `ART_CLASSES` (`packages/ui/src/art-classes.ts`) ; hors
classes, seulement `none`, `currentColor`, `url(#…)` locaux. Niveau des grands lavis porté par
`fill-opacity` (l'`opacity` du lavis reste celle du design system). Ids préfixés par le nom de la
couche. Les motifs `#art-hatch|art-hatch-dense|art-stipple` viennent de `<ArtDefs />`.

## Procédé (`art/tools/`)

| Script | Rôle |
|---|---|
| `common.py` | repère, formatage compact des chemins, bruit de valeur à graine, géométrie (Chaikin, Douglas-Peucker, Catmull-Rom, rubans), masque d'occupation |
| `world.py` | géographie de la bible : polygone de contrôle de la terre, fjords, îles, fleuves, routes, frontière, lieux, toponymes ; champ terre/mer (distance signée + bruit fractal + crêtes de fjords) et trait de côte par *marching squares* |
| `base.py`, `relief.py`, `water.py`, `places.py`, `labels.py` | une couche chacun (`build()` → texte SVG) |
| `content.py` | `content/world/map.json` et `places/<id>.json` (descriptions sans rien du rôle des lieux dans l'affaire) |
| `build.py` | point d'entrée |

Pour déplacer un lieu : changer `pos` dans `world.PLACES` (et, si besoin, `PLACE_LABELS`), puis
régénérer ; relief et végétation s'écartent d'eux-mêmes des vignettes et des toponymes.

## Budgets mesurés (gzip après svgo, comme `content:check`)

| Couche | gzip | nœuds |
|---|---|---|
| base | 15,9 Ko (≤ 60) | 21 |
| relief | 45,3 Ko | 723 |
| water | 10,9 Ko | 14 |
| places | 12,6 Ko | 303 |
| labels | 2,7 Ko | 67 |
| **total** | **87,4 Ko (≤ 300)** | **1 128 (≤ 6 000)** |
