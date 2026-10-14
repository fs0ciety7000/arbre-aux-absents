# L'Arbre aux absents — bande-annonce

| Fichier | Format | Durée | Poids | Sonie |
|---|---|---|---|---|
| `trailer-1080p.mp4` | 1920 × 1080, 30 i/s, H.264 High (yuv420p, faststart), AAC 192 kb/s 48 kHz | 60,2 s | 38,2 Mo | −16,0 LUFS intégrés, crête vraie −1,6 dBTP, LRA 3,5 LU |
| `trailer-vertical-1080x1920.mp4` | 1080 × 1920, 30 i/s, mêmes réglages | 18,2 s | 9,8 Mo | −16,0 LUFS, crête vraie −1,5 dBTP, LRA 2,1 LU |
| `trailer-poster.jpg` | 1920 × 1080 | | | Art clé et titre, à 6,6 s |
| `planche.jpg` | 12 vignettes en 4 × 3, avec leur minutage | | | |

Les images de jeu sont de **vraies captures** du build web, avec une partie avancée seulement dans la
première génération du dossier (gens du Cap). Le curseur est visible et les gestes vont à un rythme humain.
Ni secret, ni fin, ni réponse de la suite du jeu n'apparaît, et le panneau Archives n'est jamais filmé.

La musique est celle du jeu : la musique générative, humeurs « Titre » puis « Bureau », avec l'ambiance
de pluie. Elle est rendue hors ligne (OfflineAudioContext), avec le tampon et l'accord de l'« Établi »
calés sur l'image. Les fondus sont de 1,6 s en entrée et 3,2 s en sortie.

## Découpage (version 16:9)

Les plans s'enchaînent en fondus de 0,6 s ; le film ouvre au noir en 0,9 s et ferme au noir en 1,4 s.

| Début | Plan |
|---|---|
| 0:00,0 | Art clé « Le bureau sous la lampe » en lente approche, puis le titre s'encre mot à mot |
| 0:06,8 | Carton : « Velmarche, automne 1974. » |
| 0:09,8 | Catalogue → Lecteur : la lettre de Maaren, manuscrite, avec ses mots-clés soulignés (approche vers le Lecteur) |
| 0:18,0 | Carton : « Une famille entière effacée des registres. » |
| 0:21,0 | Catalogue : on tape « Tenna Orrvik », une fiche est trouvée, la photographie s'ouvre |
| 0:28,1 | Carton : « Rendez-leur un nom, un visage, un métier. » |
| 0:31,1 | Le visage est pris dans la photographie et posé sur la case de Tenna |
| 0:35,6 | Le métier est choisi, la carte de révélation apparaît, puis les tampons « Établi » (son du tampon et accord) |
| 0:40,9 | Carton : « On ne devine pas. On déduit. » |
| 0:43,6 | La carte gravée de la Velmarche, survol du cap de Tennok et d'Aubrelieu |
| 0:50,2 | Carton de fin (voir ci-dessous) |

Le carton de fin réunit :
- le titre et le fleuron ;
- « Gratuit sur itch.io » ;
- WINDOWS · MACOS · LINUX · ANDROID · NAVIGATEUR ;
- `arbre.cardormedia.com` ;
- les logos CARDOR Media, CM Interactive et CM Creative Lab, avec la mention « Une production CARDOR Media · CM Interactive · CM Creative Lab ».

## Découpage (version verticale, réseaux sociaux)

| Début | Plan |
|---|---|
| 0:00,0 | Art clé vertical, le titre s'encre |
| 0:04,1 | Carton : « Une famille entière effacée des registres. » |
| 0:06,6 | Sur téléphone, le métier de Tenna choisi dans la liste |
| 0:09,6 | Sur téléphone, « Continuer », puis les tampons « Établi » (son du tampon et accord) |
| 0:12,7 | Carton de fin vertical : titre, itch.io, plateformes, site, logos |

## YouTube (proposition)

**Titre :** L'Arbre aux absents — Bande-annonce | Jeu d'enquête généalogique gratuit

**Description :**

> Velmarche, automne 1974. Une famille entière a été effacée des registres.
>
> Dans L'Arbre aux absents, vous reconstituez l'arbre d'une famille disparue à partir de lettres,
> de photographies, d'actes et d'un catalogue d'archives. Soulignez les noms, cherchez, recoupez,
> puis rendez à chacun un nom, un visage et un métier. Rien ne se devine : tout se déduit.
>
> Gratuit sur itch.io : Windows, macOS, Linux, Android et navigateur.
> Site : https://arbre.cardormedia.com
>
> Un jeu de CM Interactive, écrit avec CM Creative Lab, une production CARDOR Media.
> Musique : la partition générative du jeu.
>
> #jeuvidéo #enquête #généalogie #indie #puzzle

## Régénérer

Les scripts sont dans `scripts/trailer/` du dépôt et ne demandent aucune dépendance en plus.
Les deux variables d'environnement sont optionnelles :
- `TRAILER_WORK` : dossier de travail, par défaut `node_modules/.cache/trailer` ;
- `TRAILER_OUT` : dossier de sortie, par défaut ce dossier-ci.

```bash
flock /tmp/arbre-e2e.lock npm run build && cp -r apps/game/dist /chemin/scratch/dist   # sous verrou, court
npx tsx scripts/trailer/record.ts --dist /chemin/scratch/dist   # prises de jeu (Chromium, ralenti ×0,25)
npx tsx scripts/trailer/cards.ts                                # cartons et art clé (HTML image par image)
npx tsx scripts/trailer/audio.ts --seed 1974                    # musique du jeu, rendue hors ligne
npx tsx scripts/trailer/assemble.ts --cut all                   # montage, mixage −16 LUFS, affiche, planche
```

Le découpage (plans, points d'entrée et de sortie, cadrages, repères sonores) se règle dans un seul
fichier, `scripts/trailer/timeline.ts`, qui sert au montage comme à la musique.
