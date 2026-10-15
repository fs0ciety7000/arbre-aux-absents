# Glossaire anglais — la loi des traducteurs

> Lot **T0** du plan `docs/i18n/PLAN.md` (décision D3). Tenu par `scenariste`. Toute traduction
> anglaise du jeu (documents, fins, calques JSON, UI, carte, site) **s'y conforme**. Un terme absent
> d'ici se décide dans la table de l'affaire (`docs/i18n/en/<id>.md`, lots T0-V et T0-H) s'il ne
> concerne qu'une affaire, ici s'il concerne les deux ou l'interface.
>
> Sources vérifiées : `docs/monde/00-monde.md`, `docs/scenario/**` (deux affaires),
> `content/cases/*/{family,progression,tree}.json`, un échantillon de chaque type de pièce,
> `apps/game/src/messages.fr.ts`, `apps/game/src/panels/messages.ts`, `assets/social/DEVLOG.md`
> (anglais déjà publié : on s'aligne dessus, sauf écart signalé au §11).

## 0. Le principe en trois lignes

1. **Le velmarchois devient l'anglais.** En français, le velmarchois est « rendu en français »
   (bible §4). En anglais, il est rendu en **anglais britannique**. On ne fait pas « parler français »
   les Velmarchois en anglais : la Velmarche **n'est pas la France**. D'où : institutions, titres de
   presse, formules et civilités **traduits**.
2. **Les noms propres ne bougent pas.** Personnes, lieux de la carte, toponymes, rues, maisons,
   enseignes, navires, marques, mots ostriens et thalbères, sigles et cotes restent **à la lettre**,
   accents compris. C'est aussi ce qui garde les sauvegardes et les recherches valides d'une langue
   à l'autre.
3. **La déduction passe avant le style.** Un mot qui sert d'indice (trait héréditaire, terme de
   recherche, genre grammatical qui trahit une personne, initiale, date, chiffre) se traduit
   **toujours de la même façon** et ne se perd jamais. En cas de conflit entre élégance et indice,
   l'indice gagne.

---

## 1. Ton et registre

### 1.1 Règles générales

- **Anglais britannique** : orthographe en *-our*, *-ise* (comme le DEVLOG : *organised*, *colour*),
  *grey*, *catalogue*, *programme*, *centre*, *metre*, *storey*, *travelled*, *jewellery*.
  Vocabulaire britannique : *post* (pas *mail*), *postman*, *pavement*, *lorry*, *petrol*, *autumn*,
  *flat*, *queue*, *cutting* (coupure de presse), *advert*. Jamais d'américanisme (*gotten*,
  *faucet*, *mom*, *zip code*, *fall*).
- **Époque sans pastiche** (1846–1976). On écrit l'anglais qu'aurait un traducteur soigneux de
  1975 traduisant des pièces anciennes : tournures datées **légères** (*I have the honour to*,
  *yours affectionately*, *the late Mr…*, *of no occupation*), jamais de *thee/thou*, de *'tis*, de
  dickensien, de cockney de théâtre. Aucun anachronisme lexical : pas de *okay* avant les
  années 1950 et seulement à l'oral, pas de *teenager* avant 1945, pas de *computer* (dire
  *calculating machine*, *terminal*), pas de *email*, *online*, *fax*.
- **Même longueur, même rythme.** Une phrase courte reste courte, une litanie reste une litanie.
  L'ironie des marges (Ferrandot, Adélaïde, Mallet) se garde : on adapte l'image, on ne l'explique pas.
- **Rien d'ajouté, rien de retiré.** Pas de note du traducteur, pas de glose entre crochets (sauf
  si le français en a une). Un mot rayé reste rayé (`~~…~~`), un passage caviardé garde son
  `::redacted[n]` (le `n` peut varier de ±30 % pour suivre la longueur du mot anglais).
- **Aucune référence réelle** : pas de *Royal Mail*, *Scotland Yard*, *Trinity House*, *RNLI*,
  *Whitehall*, *Hansard*, *Great Exhibition* (voir §4), *Prince Rupert's drop* (la « larme » de verre
  de l'affaire 2 reste *a glass tear*), aucune monnaie réelle (*pound*, *shilling*, *penny*), aucun
  saint, roi ou ville réels ajoutés.

### 1.2 Par type de pièce

| Type (FR, `kind`) | Registre anglais | Repères |
|---|---|---|
| **Lettres de l'Office** (OF, 1974–1976 ; Ferrandot, Sauge, Ollier) | Fonction publique britannique des années 1970 : sèche, précise, ironie pince-sans-rire. | *Subject:*, *To:*, *Enclosures*, *I would remind you that…*, *I remain at your disposal, door 4, mornings.* Phrases courtes. |
| **Actes d'état civil** (RG, certificats, 1848–1953) | Formulaire figé, nombres et dates en toutes lettres comme en français. | *In the year eighteen hundred and seventy-eight, on Tuesday the twenty-third of April, at ten o'clock in the morning, before us, mayor of the commune of Hautcorvin, registrar, at the Town House, there appeared publicly:* (§5). |
| **Registres, tables, annuaires** (RG, AN) | Télégraphique, abréviations, colonnes. Pas de phrase là où le français n'en a pas. | *Augier, widow, laundress, 3 rue des Tanneurs.* |
| **Procès-verbaux d'audition, rapports de police, expertises** (PV, RP, EX) | Juridique et neutre, troisième personne du greffier ; **les réponses restent orales**, avec les hésitations et les phrases cassées du français. | *There appeared the claimant, who states that his name is…* ; *Q.* / *A.* ; *Duly recorded.* |
| **Documents de la Régence** (1937–1952 : BRR, *Bulletin of Order*, Garde, avis, *The Herald*) | Emphase bureaucratique, euphémismes, majuscules d'idéologie (*Order*, *Nation*, *the Regent*), passif. | *The persons named below are struck off the registers of the Nation.* Jamais de caricature : c'est glaçant parce que c'est propre. |
| **Presse** (PR, PH « newspaper ») | Selon le titre et l'année : voir §1.3. | Manchettes en capitales si le français l'est ; sous-titres en phrase. |
| **Lettres privées** (LT, CP) | La voix du personnage, d'abord. Anglais naturel de son époque et de son milieu ; formules d'appel et de congé au §5.4. | Adélaïde : vive, sentencieuse, drôle. Lucie : phrases simples, oralité. Odile : elliptique. Selda : précise, tournures d'Ostrienne (ordre des mots un peu raide, gardé). |
| **Écritures d'enfant ou d'écolier** (traduction d'Adé à 13 ans, billets, cahiers) | Vocabulaire simple, phrases appliquées, ponctuation sage. Une faute d'enfant en français devient **une** faute d'enfant plausible en anglais (*definately*, *beleive*), pas la même faute. | Jamais de « bébé-parlé ». |
| **Billets clandestins, télégrammes** (LT-10, LT-06, TG) | Compression extrême ; initiales intactes. Télégrammes en capitales, `STOP`. | Le nombre de mots imprimé dans l'en-tête d'un télégramme **ne change pas** (c'est un fait du document) ; viser un texte de longueur voisine. |
| **Réclames, affiches** (PB) | Accroche d'époque, jeux de mots **adaptés** (pas traduits), prix intacts. | *Belaube Lozenges for the sailor's cough.* |
| **Objets, menus, faire-part, catalogues** (DV, CT, OB) | Registre de l'objet (menu de noces : français de cuisine traduit en anglais de menu britannique ; faire-part : formules de deuil, §5.4). | |
| **Fins** (`endings/*.md`) | Récit au passé, sobre, littéraire ; pas plus lyrique que le français. | Mêmes étiquettes `## [sx] …`, même ordre. |
| **Aides, succès, rapport** (JSON) | Anglais moderne, clair, deuxième personne ; **jamais d'archaïsme** (c'est l'interface). | Ne jamais révéler plus que le français (relecture `level-designer`). |
| **Ostrien et thalbère** | **Jamais traduits** dans le texte. Leurs traductions *in-world* (traduction épinglée de LT-02, traduction jurée de LT-08, lexique DV-05) sont traduites en anglais. | Voir §6.3 (lexique). |

### 1.3 Presse : une voix par titre

| Titre FR | Titre EN (italique) | Voix anglaise |
|---|---|---|
| *Le Courrier d'Aubrelieu* | *The Aubrelieu Courier* | Quotidien libéral de référence : mesuré, complet, un peu solennel. |
| *La Gazette de l'Orvelle* | *The Orvelle Gazette* | Provinciale, mondaine ; nécrologies fleuries, « notre ville ». |
| *L'Écho de Port-Sénane* | *The Port-Sénane Echo* | Maritime, faits divers, un peu sensationnel. |
| *L'Œil velmarchois* | *The Velmarche Eye* | Hebdomadaire illustré, léger, légendes de photos vives. |
| *Le Héraut* (1937–1952) | *The Herald* | Organe de la Régence : emphatique, menaçant sous le lyrisme. |
| *Fougère* (clandestin) | *Fern* | Ronéo : sec, urgent, phrases nominales. |
| *La Sentinelle des Corvins* | *The Corvins Sentinel* (court : *the Sentinel*) | Hebdomadaire de la haute vallée : local, prudent sous la Régence. |
| *Antenne velmarchoise* | *Velmarche Antenna* | Magazine radio-télé des années 1950 : bavard, souriant. |
| *Le Messager de Brenzac* (édition velmarchoise) | *The Brenzac Messenger* | Journal étranger traduit : légère raideur assumée ; daté « Brénica ». |
| *Bulletin d'Ordre* | *Bulletin of Order* | Journal officiel de la Régence : listes, articles numérotés. |
| *Bulletin des Postes velmarchoises* | *Velmarche Posts Bulletin* | Bulletin interne, aimable. |
| *Vel Taalik* | *Vel Taalik* (ostrien, **inchangé**) | Hebdomadaire bilingue : simple, communautaire. Le sous-titre « le Messager de la mer » devient *the Messenger of the Sea*. |

---

## 2. Typographie

### 2.1 Ponctuation

| Français | Anglais | Note |
|---|---|---|
| « … » | “…” | Guillemets anglais courbes. Citation dans la citation : ‘…’. |
| apostrophe ' ou ’ | ’ (courbe) | Les deux sont normalisées pareil par le moteur de recherche. |
| espace avant `; : ! ?` | **aucune** | Supprimer les espaces insécables françaises. |
| ponctuation dans/hors guillemets | **logique** (britannique) | Le point ou la virgule n'entre dans les guillemets que s'ils appartiennent à la citation. |
| tiret d'incise ` — ` dans la prose | tiret demi-cadratin espacé ` – ` | Règle britannique. |
| ` — ` dans les titres, en-têtes, tampons, `Q.`/`A.` | ` — ` **conservé** | Séparateur visuel identique à la pièce source (« *The Aubrelieu Courier* — “Storm on the Mer Grise” »). |
| intervalle de dates « 1938-1952 », « 1938–1952 » | `1938–1952` (demi-cadratin, sans espace) | |
| `…` | `…` (un seul caractère) | |
| `P.-S.` | `P.S.` | |

### 2.2 Dates et heures

- **Format** : `17 April 1923` (jour, mois en toutes lettres, année ; sans ordinal ni virgule).
  Avec le jour : `Monday 24 November 1924`. « le 1er décembre » → `1 December` (dans les actes et la
  prose datée à l'ancienne, `the first of December` est permis).
- **Mois abrégés** (tableaux, cotes, PV) : `Jan.`, `Feb.`, `Mar.`, `Apr.`, `May`, `June`, `July`,
  `Aug.`, `Sept.`, `Oct.`, `Nov.`, `Dec.` (« 12 janv. 1976 » → `12 Jan. 1976`).
- **Cachets postaux et dates en chiffres romains** (`14 IV 52`, `30 I 76 — 17 H`) : **inchangés**,
  ce sont des empreintes (seul `H` peut rester, c'est le tampon).
- **Dates numériques** `1.12.1937`, `22.4.1971` : inchangées (ordre jour-mois, britannique).
- **Heures** : on garde les chiffres et le système du français. `9 h 40` → `9.40` ; `23 h 10` →
  `23.10` (main courante, PV, télégrammes : 24 heures). En toutes lettres dans un acte ou une
  lettre : `at ten o'clock in the morning`, `at ten past two in the afternoon`.
- **Années en lettres** (actes) : `in the year nineteen hundred and seventy-four`.
- **Décennies** : `the 1930s` (sans apostrophe).

### 2.3 Nombres, monnaie, mesures

- **Séparateurs** : décimale `.`, milliers `,` : `1,71 m` → `1.71 m` ; `9 140 feuilles` →
  `9,140 sheets` ; `3 500 000 fl.` → `3,500,000 fl.` ; `0,25 Fn` → `0.25 Fn`.
- **Pour cent** : `45 %` → `45%` (sans espace) dans l'UI comme dans les pièces.
- **Chiffres invariants** : âges, dates, matricules (`0214`, `1171`), numéros de fiche
  (`41-2207`), cotes, numéros de clichés, de dossiers (`74-0318`), de listes, de cellules, de pièces,
  de pages, prix. **Un chiffre ne change jamais** en traduction : c'est un indice.
- **N°** : `n° 9` → `No. 9` (capitale, point) ; `nos` → `Nos`.
- **Ordinaux** : `3e étage` → `third floor` (même convention d'étage que le français) ;
  `1er arrondissement` → `1st Ward` (§4.6).
- **Monnaie** : *florin(s)*, `fl.` ; *sou(s)* (pluriel anglais *sous*) ; *order florin(s)* et
  *order sous* (Régence) ; *new florin*, abréviation `Fn` **inchangée** ; *talar(s)* (Thalberie).
  Aucune conversion.
- **Mesures** : métriques, **inchangées** (`km`, `m`, `cm`, `kg`, `°C`). *lieue* → *league*
  (1 league = 4.6 km) ; *mille* (marin) → *nautical mile*. Jamais de pieds, de miles terrestres.

### 2.4 Majuscules

- Titres d'œuvres, de journaux, de rubriques : *title case* britannique pour les titres d'œuvres et
  de journaux (*The Lantern of Ostrie*, *Faces of the Coast*) ; **phrase** pour les titres de
  documents du jeu (`title:` du frontmatter : « Letter from Lucien to Adélaïde, May 1906 »).
- Institutions : capitales aux mots pleins (*Civil Re-registration Office*, *Census and Removals
  Bureau*). Métiers : minuscules dans le texte (*a master glassmaker*), capitale initiale seulement
  en libellé de liste (`family.json`).
- Tampons (`::stamp[…]`) : en **CAPITALES** si le français l'est, accents conservés sur les noms
  propres (`BAINS-DE-MÉRANDE`).
- Peuples, langues : *Velmarchois*, *Ostrian*, *Thalbère* prennent la capitale en anglais, adjectifs
  compris (*an Ostrian name*), au contraire du français.

### 2.5 Civilités et titres : décision

| Français | Anglais | |
|---|---|---|
| `M.` | `Mr` | sans point (britannique) |
| `Mme` | `Mrs` | toujours, comme le velmarchois dit toujours *Mme* à une adulte |
| `Mlle` | `Miss` | |
| `MM.` | `Messrs` | |
| `Me` (notaire, avocat) | **`Maître`**, en entier | jamais `Me` (lu *me*) ni `Mr` |
| `Dr` | `Dr` | sans point |
| `Vve` (veuve, annuaires) | `widow` | « Augier Vve » → *Augier, widow* |
| `née` | `née` | l'anglais l'emploie tel quel : *Mrs Colombe Brossal, née Tessonnal* |
| `feu M. X` | `the late Mr X` | |
| `sœur Agathe` | `Sister Agathe` | |
| `l'abbé Pradeil` | `Father Pradeil` | |
| `tante Maaren`, `l'oncle Firmin` | `Aunt Maaren`, `Uncle Firmin` | |
| `Papa`, `Maman` (lettres d'enfants bourgeois, 1890–1910) | `Papa`, `Mama` | |
| `le capitaine Firmin Varenque` | `Captain Firmin Varenque` | |
| `le général Ambroise Destrade` | `General Ambroise Destrade` | |
| `le Régent`, `le Grand-Duc` | `the Regent`, `the Grand Duke` | |

**Pourquoi traduire *M./Mme/Mlle* :** le velmarchois est rendu dans la langue du joueur ; garder
*M.* et *Mme* ferait de la Velmarche une province française et gênerait la lecture (abréviations
opaques pour un anglophone). **Pourquoi garder *Maître* :** c'est un titre professionnel sans
équivalent anglais, déjà employé tel quel en anglais pour les juristes francophones, et surtout
**un indice de métier** : « Me Armand Varenque » dit *avocat* avant l'annuaire. *Mr Armand Varenque*
effacerait l'indice.

### 2.6 Écriture inclusive → neutre

- Point médian des libellés (`Gardien·ne de phare`, `Graveur·se sur verre`, `Directeur·rice des
  Verreries`, `Passeur·se`) → **un mot neutre** (*Lighthouse keeper*, *Glass engraver*, *Director of
  the Glassworks*, *Border runner*). Jamais de barre oblique, jamais de *he/she* dans un libellé.
- `Madame, Monsieur le rapporteur,` → `Dear Rapporteur,`.
- Interface : *you* et pluriels ; *they* singulier permis dans l'UI moderne.
- Pièces des années 1970 : pas de *they* singulier ; tourner la phrase (*the rapporteur*) ou
  *he or she*, usage administratif de l'époque.
- **Mais le genre qui est un indice se garde** (§9.3) : quand l'accord français révèle le sexe d'une
  personne désignée par une initiale ou un prénom épicène, l'anglais doit le dire (pronom, *Mrs*,
  *Miss*, *woman*).

### 2.7 Abréviations et sigles

**Sigles inchangés**, partout (texte, tampons, cotes, termes de recherche) : `ORC` et `O.R.C.`
(selon la source), `BRR` et `B.R.R.`, `CVC`, `RTV`, `LX-2`, `MF-74-112`, `P-4471`, `P-4472`,
formulaires `R-4`, `ORC-3`. À la **première occurrence** d'une pièce, le nom complet anglais
précède le sigle si le français l'écrit en entier : *Civil Re-registration Office (ORC)*. Les
lecteurs anglophones ont l'habitude des sigles étrangers ; changer `ORC` en `CRO` casserait les
tampons des illustrations, les cotes et les termes.

| Français | Anglais |
|---|---|
| `art.` | `Art.` |
| `al.` | `para.` (« art. 4, al. 3 » → *Art. 4, para. 3*) |
| `n°` | `No.` |
| `Cie` | `Co.` |
| `St-`, `Saint-` dans un nom propre | inchangé (*Saint-Ormel*, *Saint-Éloi*) ; *St Éloi* permis pour la fête (§4.5) |
| `ch. 9` (chambre d'hôtel) | `room 9` |
| `env.` | `approx.` |
| `fl.`, `Fn`, `S.` (sous, tampons) | inchangés |
| `cf.`, `etc.`, `id.` | `cf.`, `etc.`, `id.` |

---

## 3. Noms propres : jamais traduits

### 3.1 Règle

Restent **exactement** comme en français (graphie, accents, traits d'union, article intérieur) :

1. **Personnes** : prénoms, noms, variantes d'épouse, graphies ostriennes en *-essa*, initiales,
   ordre inversé des registres (*Tessonnal Bastien*, *Dalvarin Andrin*), surnoms en langue
   étrangère (*Maask*, *Colo*, *Adé*, *Claudie*).
2. **Lieux de la carte** (`content/world/places/*.json`, champ `name`) : ces noms ne sont **pas**
   dans le calque `WorldTranslation` ; l'UI les affiche en français. La prose anglaise les reprend
   **sous la même forme**, avec l'article anglais : *the Col de Corvenne*, *the Mer Grise*, *the
   Monts Corvins*, *the Golfe d'Ambre*, *the Lac d'Aulne*, *the Landes d'Ostrie*, *the Pas de
   l'Ourse*. Les formes courtes de ces noms aussi (*the Moulin de la Sorbe*, *the Cap de Tennok*,
   *the island of Kessaar*, *the Orvelle*, *the Clairette*).
3. **Toponymes secondaires** d'un seul mot ou composés à traits d'union : *Orrvik*, *Kessvel*,
   *Draavik*, *Haask*, *Laakvik*, *Tormaas*, *Vikmaar*, *Kessdaan*, *Combe-aux-Sables*,
   *Plaine-aux-Saules*, *Dents de Tennok* (gravé sur la carte), et les noms thalbères *Brénica*,
   *Dalvica*, *Vernica*, *Dalva*.
4. **Adresses** : *rue Haute*, *rue des Tanneurs*, *rue des Foulons*, *rue des Scieurs*, *rue des
   Chartes*, *quai des Chartes*, *quai des Séchoirs*, *quai du Môle*, *quai des Messageries*, *quai
   des Bacs*, *place de la Charte*, *place du Marché*, *boulevard de la Charte*, *cours de
   l'Amirauté*, *jetée Est*. Format : *12 rue des Tanneurs, Aubrelieu* (virgule française après le
   numéro supprimée).
5. **Maisons, bâtiments à enseigne, établissements nommés** : *Les Tilleuls* (*at Les Tilleuls*),
   *Palais des Chartes*, *Hôtel du Grand-Cerf*, *Auberge des Guides*, *Refuge de l'Ourse*, *Thermes
   de Mérande*, *redoute du Bec*, *fortin des Corneilles*, *hôpital de la Croix-de-Brénica*.
6. **Navires, avions** : *l'Albatros* → *the Albatros* (pas *Albatross*), *L'Hirondelle*, l'*Orvelle*
   (paquebot). Italique conservée.
7. **Marques et raisons sociales à nom propre** : *Studio Lumen*, *Studio Orlhac*, *L'Égide*,
   *Aéro-Velmarche*, *Belaube*, *Mérande*, *Dumesnil-Corre*, *Rosvel*, *Corbeval*, *Hachard
   frères* ; le mot générique qui les accompagne se traduit (§4.4).
8. **Mots, titres et formules ostriens et thalbères** : *Vel Taalik*, *Taalikmaal*, *tenn-vaardessa*,
   *Draa ta orr, ommen aar* (non traduit, volontairement), *Kessdaan*, *talar*.
9. **Sigles et codes** (§2.7).

### 3.2 Liste vérifiée (grep sur `content/`, 15 octobre 2026)

**Affaire 1, les 30 cases** (toutes présentes dans les pièces) : Anselme Varenque, Clémence
Aubertot, Firmin Varenque (1849), Maaren Tennok, Augustin Varenque (1872), Henriette Sorbelle, Lucien
Varenque, Pauline Sauge, Adélaïde Varenque, Aldrik Varenque, Tenna Orrvik, Gaspard Varenque, Irène
Castagne, Blanche Varenque, Marcel Daubry, Odile Varenque, Orrin Kessvel, Victor Sauge, Ninon Brial,
Firmin Varenque (1900), Hessa Draavik, Selda Varenque, Augustin Varenque (1924), Armand Varenque,
Mathilde Rouvière, Hélène Varenque, Paul Marsal, Lise Daubry, Claude Sauge, Tavik Varenque.
Variantes : *Tennokessa*, *Orrvikessa*, *Draavikessa*, *Blanche Daubry*, *Blanche Aubertine* (nom de
scène), *Hélène Marsal*, *Élise*, *Augustin V.*, *A. Varenque*, *L. Daubry*, *C. Sauge*, *T. Orrvik*,
*O. Kessvel*. Hors arbre : Jacques Varenque, Joren Tennok, Jorre et Teodor Haask, Nora Ilvess,
Marc Dobrin, Rosine Ferrandot, Brunesseau (Achille), Desaulnes (Fernand), Hautfeuille, Ossak Draavik,
Davik et Ammik Laakvik, Aurèle Vasquin, Hippolyte Aubertot, Octave Bréval, Fernand Ravenel (tampon de
l'Opéra) ; dans la bible seulement : Ambroise Destrade (le Régent).

**Affaire 2, les 28 cases** (toutes présentes) : Évariste Tessonnal, Clotilde Mervaux, Dranko
Dalvarin, Barthélemy Neviot, Annette Combal, Honoré Tessonnal, Eugénie Ravenel, Danela Dalvarin,
Marguerite Tessonnal (sœur Agathe), Léonce Tessonnal, Jules Neviot, Philomène Ardouin, Colombe
Tessonnal (Colombe Brossal, *Colo*), Aimé Brossal, Bastien Tessonnal, Lucie Neviot, Andrin Dalvarin,
Victorin Sarrade, Rémi Neviot, Odette Lamberge, Hugues Brossal, Sabine Orlhac, Isaure Brossal,
Julien Escande, Agnès Neviot, Pierre Sarrade, Gilles Neviot, Brigitte Neviot. Hors arbre : Jadela
Rovin, Toussaint Mallet, Fernand Ollier, Gérard Vallin, Léon Escande, Achille Fauvel, l'abbé Pradeil
(*Father Pradeil*), Teodor Haask.

**Lieux de la carte (22 `PlaceId`)** : Aubrelieu, Moulinvert, Forêt et moulin de la Sorbe, Lac
d'Aulne, Saint-Ormel, Port-Sénane, Bains-de-Mérande, Hautcorvin, Col de Corvenne, Monts Corvins,
Brenzac, Grisenoue, Landes d'Ostrie, Cap et phare de Tennok, Vellaak, Île de Kessaar, Mer Grise,
Golfe d'Ambre, L'Orvelle et la Clairette, Vernezac, Le Pas de l'Ourse, Dalvezac.

**Pays et peuples** : *la Velmarche* → *Velmarche* (sans article en anglais : *in Velmarche*) ;
*l'Ostrie* → *Ostrie* ; *la Thalberie* → *Thalberie*. Gentilés et langues : *velmarchois* →
*Velmarchois* (invariable : *a Velmarchois*, *the Velmarchois*, *Velmarchois paper*) ; *ostrien* →
*Ostrian* (*an Ostrian*, *the Ostrians*, *Ostrian* la langue) ; *thalbère* → *Thalbère* (invariable).
Dans un nom d'institution, on emploie le nom du pays en apposition : *Velmarche Posts*, *Velmarche
Charter*, *the Velmarche Calculating Company*.

---

## 4. Institutions, événements, entreprises, œuvres

### 4.1 L'Office et la loi de 1973

| Français | Anglais | Note |
|---|---|---|
| Office de Réinscription civile (ORC, O.R.C.) | **Civil Re-registration Office (ORC)** | DEVLOG. *the Office*. |
| service des Filiations | Filiations Department | *the Department* |
| Commission de réinscription | Re-registration Commission | *the Commission* |
| rapporteur | **rapporteur** | DEVLOG ; invariable en genre. |
| rapporteur stagiaire | probationary rapporteur | |
| rapporteur titulaire ; titularisé(e) | permanent rapporteur ; given a permanent post | DEVLOG. Jamais *established* (réservé au jeu, §8). |
| chef du service | head of department | |
| greffe | registry | *the Office registry* |
| greffier ; greffier-enquêteur | clerk ; investigating clerk | |
| bureau 12 | office 12 | |
| dossier n° 74-0318 ; dossiers joints | file No. 74-0318 ; joined files | DEVLOG *file*. |
| pièce (d'un dossier) | **item** (*file 74-0318, item 2*) ; *document* en prose | |
| pièce jointe ; bordereau | enclosure ; schedule | |
| requête ; requérant ; requête testamentaire | **petition** ; **claimant** ; testamentary petition | DEVLOG *claimant*. |
| opposition ; partie opposante | objection ; objecting party | *formed an objection* |
| formulaire R-4 ; modèle ORC-3 | Form R-4 ; form ORC-3 | |
| tableau de filiation | **table of descent** | |
| reconnaissance de portrait | **portrait identification** | art. 4, al. 3 |
| signalement | description (police) | |
| audition ; procès-verbal d'audition | **hearing** ; record of hearing | *Record of the Second Hearing of the Claimant* |
| commission rogatoire | letters rogatory | terme juridique anglais réel et générique |
| comparant(e) | the person appearing (+ *he/she*, §9.3) | |
| loi du 14 mai 1973 (loi de réinscription civile) | the Act of 14 May 1973 (the Civil Re-registration Act) | |
| « deux pièces concordantes » | “two concordant documents” | art. 6 : *no identity is admitted unless two concordant documents establish it* |
| loi des deux pièces (formule courante) | the **two-document law** | DEVLOG |
| absent vivant | living absentee | formulaire R-4 |
| fonds restreint ; communication sur demande nominative | restricted collection ; released only on request by name | |
| réinscription ; réinscrire ; réinscrit(e) | re-registration ; re-register ; re-registered | |
| décision de l'Office | the Office's decision | |
| audience | sitting (of the Commission) ; hearing (tribunal) | |

### 4.2 Archives et Lecteur

| Français | Anglais | Note |
|---|---|---|
| Archives nationales | National Archives | |
| palais des Chartes | the Palais des Chartes | nom de bâtiment (§3.1) |
| Lecteur LX-2 ; le Lecteur | **the LX-2 Reader** ; the Reader | |
| Lecteur des Archives (UI) | **the Archive Reader** | DEVLOG |
| Fonds Central Indexé | Central Indexed Collection | |
| fonds (Varenque, Honoré Tessonnal…) | collection (*the Varenque collection*) | |
| vedette (index) | heading | terme de bibliothéconomie |
| cote | reference | |
| salle de lecture ; archiviste de permanence | reading room ; duty archivist | |
| atelier de conservation | conservation workshop | |
| service informatique | computing department | |
| restauratrice (de papier) | (paper) conservator | §7 |
| microfilm de sécurité | security microfilm | |
| touche ENVOI | SEND key | |
| « FONDS RESTREINT — DEMANDE NOMINATIVE REQUISE » | “RESTRICTED COLLECTION — REQUEST BY NAME REQUIRED” | |
| Archives départementales (d'Ostrie, de l'Orvelle) | Departmental Archives (of Ostrie, of the Orvelle) | |
| Archives municipales d'Aubrelieu | Aubrelieu City Archives | |
| Archives communales de Vernezac | Vernezac Municipal Archives | |
| Bibliothèque des Archives nationales, usuels | National Archives Library, reference shelves | |

### 4.3 La Régence et l'histoire

| Français | Anglais | Note |
|---|---|---|
| la Régence ; le Régent | **the Regency** ; the Regent | |
| Conseil d'Ordre | Council of Order | |
| *Bulletin d'Ordre* | ***Bulletin of Order*** | terme de recherche (affaires 1 et 2) |
| Garde d'Ordre ; lieutenance de Hautcorvin | Guard of Order ; Hautcorvin Lieutenancy | |
| BRR, Bureau du Recensement et des Radiations | **Census and Removals Bureau (BRR)** | sigle inchangé |
| commissaire aux Registres | Commissioner of Registers | métier, affaire 1 |
| Service d'identification ; fiche anthropométrique | Identification Service ; anthropometric record card | |
| liste de radiation n° 9 | **Removal List No. 9** | |
| radier ; radié(e) ; les radiés | **strike off (the registers)** ; struck off ; the struck-off | DEVLOG *struck from the registers* ; tampon `RADIÉE` → `STRUCK OFF` |
| déclaré(s) absent(s) ; les absents | **declared absent** ; **the absent** | voir §9.2 (pluriel !) |
| « Destinataire absent » | “Addressee absent” | double sens gardé |
| loi du 2 février 1938, loi sur la pureté des registres | the Act of 2 February 1938, the Purity of the Registers Act | |
| arrêté (de 1916, de 1938) | decree | *Decree on Thalbère Subjects in the Frontier Provinces* ; jamais *order* (réservé à l'Ordre) |
| bagne de Kessaar | **the Kessaar penal colony** | DEVLOG |
| registre d'écrou ; matricule ; cellule 14 ; bon de cantine | committal register ; prisoner number ; cell 14 ; canteen voucher | |
| Œuvre des Pupilles ; pupille(s) ; institution des Pupilles | **the Wards' Charity** ; ward(s) ; the Wards' home | |
| familles d'ordre | families of order | |
| carnets gris | **grey booklets** | |
| florin d'ordre ; sous d'ordre | order florin ; order sous | |
| Imprimerie nationale d'Ordre | National Printing Office of Order | |
| Tribunal spécial | Special Court | |
| Opération Fougère | Operation Fern | |
| réseau Fougère ; *Fougère* (feuille) | **the Fern network** ; *Fern* | §6.2 : *fougère* = *fern* partout |
| « Ce qui brûle repousse » | “What burns grows back” | devise |
| Grand-Duché ; Grand-Duc ; cour grand-ducale | Grand Duchy ; Grand Duke ; Grand-Ducal Court | |
| Chambre des députés ; député ; circonscription | Chamber of Deputies ; Deputy ; constituency | |
| Charte de Velmarche (1811) ; centenaire | the Velmarche Charter ; centenary | |
| République ; Président ; Assemblée nationale | Republic ; President ; National Assembly | |
| Constitution de la République (1953) | Constitution of the Republic | |
| Traité de Vellaak ; paix de Brenzac | Treaty of Vellaak ; Peace of Brenzac | |
| Guerre des Cols | the War of the Passes | |
| Krach Sorbelle | the Sorbelle Crash | |
| Coup d'État du 12 mars 1937 | the coup of 12 March 1937 | |
| Autodafé de Vellaak | the Vellaak burning | |
| Journées d'avril (1952) | the April Days | |
| Procès des Papetiers | **the Papermakers' Trial** | terme de recherche |
| Papiers de la Régence (série d'articles) | *The Regency Papers* | terme de recherche |
| Nuit des affiches | the Night of the Posters | terme de recherche |
| Commission d'enquête sur l'Œuvre des Pupilles ; pièce à conviction | Commission of Inquiry into the Wards' Charity ; exhibit | |
| Contrôle postal aux armées — secteur des Cols | Army Postal Censorship — Passes Sector | |
| Ministère de l'Intérieur ; Sûreté | Ministry of the Interior ; Public Security | pas *Sûreté* (institution réelle) |

### 4.4 Services, entreprises, établissements

Le nom propre reste, le mot générique se traduit.

| Français | Anglais |
|---|---|
| Phares et Balises (service des) ; circonscription de la mer Grise | **Lights and Beacons** (the Lights and Beacons Service) ; Mer Grise District |
| Postes velmarchoises ; recette des postes ; receveuse | Velmarche Posts ; post office ; postmistress |
| Postes et Télégraphes | Posts and Telegraphs |
| état civil ; officier de l'état civil | civil registration (tampon : CIVIL REGISTRY) ; registrar |
| maison commune ; mairie ; maire ; secrétaire de mairie | **Town House** ; town hall ; mayor ; town clerk |
| douanes velmarchoises ; brigade de la Vèze ; douanier | Velmarche Customs ; the Vèze customs post ; customs officer |
| gendarmes | constables |
| tribunal civil d'Aubrelieu ; tribunal de Vellaak ; greffe | Aubrelieu Civil Court ; Vellaak court ; court registry |
| barreau d'Aubrelieu ; avocat à la cour | the Aubrelieu Bar ; barrister |
| étude (de notaire) ; minute ; minutier | (notary's) office ; original deed ; deed archive |
| testament olographe ; légataire ; exécuteur ; libéralités ; ayants droit | holograph will ; legatee ; executor ; bequests ; beneficiaries |
| jugement d'adoption plénière | judgment of full adoption |
| jugement déclaratif de décès | declaratory judgment of death |
| Université d'Aubrelieu ; Institut de médecine légale | University of Aubrelieu ; Institute of Forensic Medicine |
| Opéra d'Aubrelieu | the Aubrelieu Opera |
| Musée des Arts du feu ; galerie des Arts du feu | Museum of the Fire Arts ; Fire Arts Gallery |
| RTV, Radio-Télévision velmarchoise | Velmarche Radio-Television (RTV) |
| Papeteries Varenque ; les Papeteries | **the Varenque Paper Mills** ; the Paper Mills |
| Papeteries de l'Estuaire ; Papeterie Saint-Ormel | Estuary Paper Mills ; Saint-Ormel Paper Mill |
| Moulins de Grisenoue (Mazure et Cie) | Grisenoue Mills (Mazure & Co.) |
| Banque Sorbelle | Sorbelle Bank |
| Savonnerie Mérande | the Mérande Soapworks |
| Compagnie des Paquebots de l'Orvelle | **the Orvelle Packet Company** (jamais *Steam Packet*, nom réel) |
| Grands Magasins Belaube ; pastilles Belaube | the Belaube Department Store ; Belaube Lozenges |
| Studio Lumen, Studio Orlhac | inchangés |
| Aéro-Velmarche | inchangé |
| Compagnie Velmarchoise de Calcul (CVC) | the Velmarche Calculating Company (CVC) |
| Imprimerie lithographique Dumesnil-Corre | Dumesnil-Corre Lithographic Printers |
| Phototypie de l'Orvelle | Orvelle Phototype Works |
| Imprimerie Rosvel ; Imprimerie de la Sentinelle | Rosvel Printing Works ; Sentinel Printing Works |
| Armement Castagne | Castagne Shipping |
| Cabinet Varenque & Desaulnes, avocats à la cour | Varenque & Desaulnes, Barristers |
| Coopérative forestière de Brénica | Brénica Forestry Cooperative |
| L'Égide, compagnie d'assurances contre l'incendie | L'Égide, Fire Insurance Company |
| Verreries de Hautcorvin ; les Verreries | **the Hautcorvin Glassworks** ; the Glassworks (capitale = Hautcorvin) |
| Verrerie de Brénica | the Brénica Glassworks (toujours avec *Brénica*) |
| Compagnie des guides de Vernezac | the Vernezac Guides' Company |
| Maison Corbeval ; Faïences de Saint-Ormel | Corbeval & Co. ; Saint-Ormel Faience |
| Garage de la Vèze | the Vèze Garage |
| Syndicat d'initiative de Vernezac et de la haute Vèze | Tourist Office of Vernezac and the Upper Vèze |
| Œuvre des Lavandières | the Washerwomen's Charity |
| Librairie-éditions Hachard frères | Hachard Brothers, Booksellers and Publishers |
| école des filles ; lycée de jeunes filles | girls' school ; girls' high school |
| hôpital maritime ; hospice (de Hautcorvin) ; hospitalières | seamen's hospital ; (Hautcorvin) hospice ; Hospitaller sisters |

### 4.5 Événements, fêtes, objets nommés

| Français | Anglais | Note |
|---|---|---|
| Grande Exposition d'Aubrelieu (1889) | **the Grand Exhibition** (of Aubrelieu) | pas *Great Exhibition* (1851, réelle) |
| Nuit des Lanternes | the Night of Lanterns | |
| Fête de la neige | the Snow Festival | |
| concours de la Saint-Éloi ; paroisse Saint-Éloi | the St Éloi competition ; St Éloi's parish | termes : *Saint-Éloi*, *St Éloi*, *St-Éloi* |
| incendie de 1937 | the 1937 fire | terme délicat (§9.2) |
| grève de 1936 | the 1936 strike | idem |
| expulsion de 1916 | the 1916 expulsion | |
| avion postal | the mail plane | |
| Coupe du Régent | **the Regent's Cup** | |
| pli cacheté (de 1958) | the sealed envelope (of 1958) | |
| verre gravé « À la fille du souffleur » | engraved glass “To the glassblower's daughter” | inscription identique partout |
| larme (de verre) ; « Ne la casse pas par la queue » | glass tear ; “Don't break it by the tail” | §1.1 |
| la boîte de Lucie | Lucie's box | |
| le carnet des moutons | the sheep notebook | |
| journal de sœur Agathe | Sister Agathe's diary | |
| registre des rondes ; main courante ; gardien de nuit | rounds register ; log ; night watchman | |
| halle des fours ; four n° 2 ; magasin des emballages ; atelier de gravure | **furnace hall** (DEVLOG) ; Furnace No. 2 ; packing store ; engraving workshop | |
| lentille de Tennok | the Tennok lens | |
| registre bleu (« registre à couverture bleue ») | the blue register (“the register with the blue cover”) | |
| herbier ; planche d'herbier | herbarium ; herbarium sheet | |
| filigrane ; papier filigrané « à la fougère » ; « filigrané » (homme honnête) | watermark ; fern-watermarked paper ; “watermarked” (an honest man) | |
| fougère sans date ; fougère sans millésime | **undated fern** ; fern without a year mark | indice (§9.4) |
| acte de reconnaissance (d'enfant naturel) | deed of acknowledgement (of a natural child) | |
| caveau Varenque | the Varenque vault | |

### 4.6 Œuvres

| Français | Anglais |
|---|---|
| *La Lanterne d'Ostrie* (opéra, Aurèle Vasquin, 1929) | *The Lantern of Ostrie* |
| *Visages de la côte* (Nora Ilvess, 1958) | *Faces of the Coast* |
| *La Lavandière* (affiche, 1905) | *The Washerwoman* |
| *Petit lexique ostrien-velmarchois* (Selda Varenque, 1954) | *A Short Ostrian–Velmarchois Lexicon* |
| *Annuaire du commerce et de l'industrie de Velmarche* | *Directory of Commerce and Industry of Velmarche* |
| *Annuaire d'Aubrelieu* | *Aubrelieu Directory* |
| *Annuaire officiel des professions* | *Official Directory of Professions* |
| « Nos côtes » (cartes postales) | “Our Coasts” |
| « Le Revenant de Hautcorvin » (article, PR-10) | “The Revenant of Hautcorvin” |

**Divisions administratives** : *province* → *province* ; *département* → *department* ;
*district* (annuaires) → *district* ; *commune* → *commune* ; *arrondissement* (Aubrelieu) →
*Ward* (« 4e ARRONDISSEMENT (TANNEURS) » → `4TH WARD (TANNEURS)`) ; *quartier des Tanneurs* →
*the Tanneurs quarter*.

**Toponymes à tête générique** (hors `PlaceId`, hors §3.1) : la tête se traduit, le nom reste.
*marais de Grisenoue* → *the Grisenoue marshes* ; *collines de Sorbe* → *the Sorbe hills* ; *route de
Brénica* → *the Brénica road* ; *vallée de la Dalva* → *the Dalva valley* ; *la Vèze* → *the Vèze* ;
*baie d'Orrvik* → *Orrvik Bay* ; *haute vallée de l'Orvelle* → *the upper Orvelle valley* ; *ligne
des Paquebots* → *the Packet line* ; *vedette de Kessaar* → *the Kessaar launch*. Exception : si le nom
est une forme du nom d'un lieu de la carte, il garde la forme française (§3.1, 2).

---

## 5. Pièces récurrentes, tampons, formules, en-têtes

### 5.1 Types de pièces (titres, `KIND_LABELS`)

| `kind` | FR | EN (étiquette UI) | Titres de pièces |
|---|---|---|---|
| `letter` | Lettre | Letter | *Letter from Lucien to Adélaïde, May 1906* ; billet → *note* ; billet clandestin → *clandestine note* |
| `newspaper` | Coupure de presse | Press cutting | *The Aubrelieu Courier — “Storm on the Mer Grise”* ; nécrologie → *obituary* ; avis de décès → *death notice* |
| `photo` | Photographie | Photograph | carte-album → *cabinet card* ; carte-photo → *photo postcard* ; négatifs → *negatives* |
| `register` | Registre | Register | *Births of Tennok, 1874–1903 (extracts)* ; tables des décès → *death indexes* |
| `certificate` | Acte | Certificate | acte de naissance / mariage / décès → *birth / marriage / death certificate* ; acte bilingue → *bilingual certificate* |
| `postcard` | Carte postale | Postcard | |
| `directory` | Annuaire | Directory | |
| `telegram` | Télégramme | Telegram | formulaire de dépôt → *telegram lodging form* |
| `catalog` | Fiche de catalogue | Catalogue | programme de récital → *recital programme* |
| `note` | Note | Note | lettre de mission → *letter of assignment* ; note de clôture → *closing note* ; mode d'emploi → *operating instructions* |
| `object` | Objet | Object | faire-part → *announcement* ; plan de table → *seating plan* |
| `report` | Rapport | Report | procès-verbal → *record* ; expertise → *expert report* ; examen comparatif → *comparative examination* |
| `advert` | Réclame | Advert | affiche → *poster* ; avis → *notice* |

### 5.2 Tampons récurrents (modèles)

| FR | EN |
|---|---|
| RÉPUBLIQUE DE VELMARCHE — OFFICE DE RÉINSCRIPTION CIVILE — SERVICE DES FILIATIONS | REPUBLIC OF VELMARCHE — CIVIL RE-REGISTRATION OFFICE — FILIATIONS DEPARTMENT |
| OFFICE DE RÉINSCRIPTION CIVILE — GREFFE — REÇU LE 12 JANV. 1976 — N° 76-0012 | CIVIL RE-REGISTRATION OFFICE — REGISTRY — RECEIVED 12 JAN. 1976 — No. 76-0012 |
| … — DOSSIER CLOS | … — FILE CLOSED |
| … — PIÈCE PRÊTÉE | … — DOCUMENT ON LOAN |
| SERVICE DES FILIATIONS — INSTRUCTION — 74-0962 | FILIATIONS DEPARTMENT — INQUIRY — 74-0962 |
| MAISON COMMUNE DE MOULINVERT — ÉTAT CIVIL | TOWN HOUSE OF MOULINVERT — CIVIL REGISTRY |
| VILLE D'AUBRELIEU — ÉTAT CIVIL — 1er ARRONDISSEMENT | CITY OF AUBRELIEU — CIVIL REGISTRY — 1ST WARD |
| RÉGENCE DE VELMARCHE — COMMUNE DE VERNEZAC — ÉTAT CIVIL | REGENCY OF VELMARCHE — COMMUNE OF VERNEZAC — CIVIL REGISTRY |
| RÉGENCE DE VELMARCHE — BUREAU DU RECENSEMENT ET DES RADIATIONS (— SCELLÉ) | REGENCY OF VELMARCHE — CENSUS AND REMOVALS BUREAU (— SEALED) |
| RÉGENCE DE VELMARCHE — B.R.R. — SERVICE D'IDENTIFICATION — FICHE N° 41-2207 | REGENCY OF VELMARCHE — B.R.R. — IDENTIFICATION SERVICE — CARD No. 41-2207 |
| RÉGENCE DE VELMARCHE — ORDRE — NATION | REGENCY OF VELMARCHE — ORDER — NATION |
| VISÉ POUR CONFORMITÉ — B.R.R. — 7 FÉVRIER 1938 | ENDORSED AS IN ORDER — B.R.R. — 7 FEBRUARY 1938 |
| VU ET CONFORME | SEEN AND IN ORDER |
| VU ET APPROUVÉ — LE COMMISSAIRE AUX REGISTRES DE LA PROVINCE | SEEN AND APPROVED — THE PROVINCIAL COMMISSIONER OF REGISTERS |
| BAGNE DE KESSAAR — GREFFE / ADMINISTRATION — CANTINE | KESSAAR PENAL COLONY — REGISTRY / ADMINISTRATION — CANTEEN |
| ARCHIVES NATIONALES — FONDS RESTREINT — COMMUNICATION NOMINATIVE (LOI DU 14 MAI 1973, ART. 9) | NATIONAL ARCHIVES — RESTRICTED COLLECTION — RELEASED BY NAME ONLY (ACT OF 14 MAY 1973, ART. 9) |
| ARCHIVES NATIONALES — PALAIS DES CHARTES — ATELIER DE CONSERVATION | NATIONAL ARCHIVES — PALAIS DES CHARTES — CONSERVATION WORKSHOP |
| COPIE CERTIFIÉE CONFORME | CERTIFIED TRUE COPY |
| CLASSÉ SANS SUITE | NO FURTHER ACTION |
| DESTINATAIRE ABSENT — LOI DU 2 FÉVRIER 1938, ART. 6 — RETOUR À L'ENVOYEUR | ADDRESSEE ABSENT — ACT OF 2 FEBRUARY 1938, ART. 6 — RETURN TO SENDER |
| PHOTOGRAPHIE À SOUMETTRE À LA RECONNAISSANCE DE PORTRAIT — ART. 4, AL. 3 | PHOTOGRAPH FOR PORTRAIT IDENTIFICATION — ART. 4, PARA. 3 |
| MAIRIE DE VELLAAK — TRANSMIS À L'O.R.C. LE 19 FÉVR. 1976 | VELLAAK TOWN HALL — FORWARDED TO THE O.R.C. 19 FEB. 1976 |
| COMMUNE DE VERNEZAC — MAIRIE — EXÉCUTION D'UNE COMMISSION ROGATOIRE | COMMUNE OF VERNEZAC — TOWN HALL — EXECUTION OF LETTERS ROGATORY |
| STUDIO ORLHAC — HAUTCORVIN — CLICHÉ N° 7720 | STUDIO ORLHAC — HAUTCORVIN — NEGATIVE No. 7720 |
| POSTES VELMARCHOISES — VELLAAK — 4 X 74 — 16 H | VELMARCHE POSTS — VELLAAK — 4 X 74 — 16 H (date inchangée) |
| … — SERVICE PHOTO — PUBLIÉ LE 23 II 74 | … — PHOTO DESK — PUBLISHED 23 II 74 |
| FOURNISSEUR DE LA COUR GRAND-DUCALE | PURVEYOR TO THE GRAND-DUCAL COURT |
| AFFICHAGE AUTORISÉ | BILLPOSTING AUTHORISED |
| TRIBUNAL DE BRÉNICA — TRADUCTEUR JURÉ — THALBÈRE / VELMARCHOIS | BRÉNICA COURT — SWORN TRANSLATOR — THALBÈRE / VELMARCHOIS |

### 5.3 Formules d'actes et de procès-verbaux

| FR | EN |
|---|---|
| L'an mil neuf cent soixante-seize, le jeudi cinq février, à quatorze heures dix | In the year nineteen hundred and seventy-six, on Thursday the fifth of February, at ten past two in the afternoon |
| par-devant nous, maire de la commune de X, officier de l'état civil, en la maison commune, ont comparu publiquement : | before us, mayor of the commune of X, registrar, at the Town House, there appeared publicly: |
| devant nous, Fernand Ollier, greffier-enquêteur, agissant sur commission rogatoire du rapporteur | before us, Fernand Ollier, investigating clerk, acting under letters rogatory from the rapporteur |
| a comparu le requérant, qui déclare se nommer… | there appeared the claimant, who states that his name is… |
| âgé de vingt-trois ans ; né en cette commune | aged twenty-three ; born in this commune |
| du sexe masculin / féminin | male / female |
| son épouse ; sans profession | his wife ; of no occupation |
| aïeul maternel ; déclarant | maternal grandfather ; informant |
| Mention(s) marginale(s) ; En marge de l'acte n° 2 | Marginal note(s) ; In the margin of entry No. 2 |
| Mention annulée. Réinscrite à sa demande, le 4 juin 1953. Le maire. | Note cancelled. Re-registered at her request, 4 June 1953. The Mayor. |
| transcrit le 2 avril 1925 | entered in the register on 2 April 1925 |
| Pour extraits conformes ; Pour copie conforme | Certified true extracts ; Certified true copy |
| Lecture faite, le témoin persiste et signe avec nous. | Having heard this read over, the witness confirms it and signs with us. |
| Clos à seize heures quarante. | Closed at 16.40. |
| Dont acte. | Duly recorded. |
| Q. / R. | Q. / A. |
| Fait à Aubrelieu, le… ; Fait en un seul original | Done at Aubrelieu on… ; Done in a single original |
| Le requérant certifie sur l'honneur l'exactitude des déclarations qui précèdent. | The claimant certifies on his honour that the foregoing statements are true. |
| Cadre réservé au greffe | For registry use only |
| Taille / Corpulence / Cheveux / Sourcils / Yeux / Signes particuliers / Objets portés / Langues | Height / Build / Hair / Eyebrows / Eyes / Distinguishing marks / Items carried / Languages |
| Observation du greffier | Clerk's observation |
| Pièces examinées / Observations / Conclusions | Documents examined / Observations / Conclusions |
| Objet : / Destinataire : / Pièces jointes : | Subject: / To: / Enclosures: |
| Bordereau des pièces jointes | Schedule of enclosures |

### 5.4 Appels, congés, deuil

| FR | EN |
|---|---|
| Madame, Monsieur le rapporteur, | Dear Rapporteur, |
| Monsieur, (lettre officielle) … Veuillez agréer… | Dear Sir, … Yours faithfully, |
| Cher Monsieur Brunesseau, … sentiments dévoués | Dear Maître Brunesseau, … Yours sincerely, |
| Ma chère Adé, … Je t'embrasse | My dear Adé, … With love, / Your loving… |
| Ma chère Maman, … Embrasse Papa | Dearest Mama, … Give Papa a kiss from me |
| Ma fille, ma petite Agnès, | My girl, my little Agnès, |
| Ta mère | Your mother |
| Je reste à votre disposition | I remain at your disposal |
| a la douleur de vous faire part du décès de | regrets to announce the death of |
| Ni fleurs ni couronnes | No flowers, by request |

### 5.5 En-têtes de section des pièces

*Recto (imprimé)* → *Front (printed)* ; *Verso (au crayon)* → *Back (in pencil)* ; *Suscription*
→ *Address* ; *La lettre* → *The letter* ; *La traduction épinglée* → *The pinned translation* ;
*Extraits des années…* → *Extracts for the years…* ; *Première partie — Par professions* →
*Part One — By Profession* ; *Raison sociale / Localité / Dirigeant / Spécialités* → *Firm /
Locality / Principal / Specialities* ; *Enfant / Né(e) le / Père / Mère / Déclarant* → *Child /
Born / Father / Mother / Informant*.

---

## 6. Mots qui sont des indices

### 6.1 Traits héréditaires et marques (toujours les mêmes mots, toujours le même côté)

| FR | EN | Affaire |
|---|---|---|
| mèche blanche au-dessus du front, côté gauche ; « mèche Aubertot » | white forelock above the forehead, on the left ; “the Aubertot forelock” | 1 |
| strabisme léger de l'œil gauche (dévie vers l'extérieur) ; « l'œil de Lucien » | slight outward squint in the left eye ; “Lucien's eye” | 1 |
| menton fendu | cleft chin | 1 |
| anneau d'or à l'oreille gauche | gold ring in the left ear | 1 |
| cicatrice au sourcil gauche | scar through the left eyebrow | 1 |
| main brûlée | burnt hand | 1 |
| fossette à la joue gauche ; « fossette Tessonnal » | dimple in the left cheek ; “the Tessonnal dimple” | 2 |
| yeux gris très clairs ; « yeux Ravenel » ; iris plus clair que la peau | very pale grey eyes ; “the Ravenel eyes” ; iris paler than the skin | 2 |
| épi (au milieu du front) ; « épi Tessonnal » | cowlick (in the middle of the forehead) ; “the Tessonnal cowlick” | 2 |
| sourcils droits, épais, presque joints | straight, thick, almost joined eyebrows | 2 |
| lobe de l'oreille détaché / adhérent | free / attached earlobe | 2 |
| profil droit (fiches) | right profile | 2 |
| brûlure au dos de la main droite / gauche | burn on the back of the right / left hand | 2 |
| incisive centrale gauche ébréchée | chipped upper left front tooth | 2 |
| main gauche à trois doigts | three-fingered left hand | 2 |
| T à boucle ; barre bouclée sur la hampe ; T barré d'un trait droit | looped T ; crossbar looped back onto the stem ; T crossed with a straight bar | 2 |

### 6.2 Fougère, goéland, faucon

Le réseau de mots *fougère* doit rester un seul mot en anglais : **fern**. Le filigrane (*fern
watermark*), la plante de Clémence (*royal fern*), le réseau (*the Fern network*), la feuille
clandestine (*Fern*), l'opération (*Operation Fern*), la devise, l'ostrien *ilv* (*fern*), et *Nora
Ilvess* « la nouvelle femme-fougère » (*the new fern-woman*). Jamais *bracken*.
Surnoms de la côte : *le Goéland* → **the Gull** (*maask* = *gull*) ; *le Faucon* → *the Falcon*
(*haask*). Les lettres signées « Maask » restent signées *Maask*.

### 6.3 Lexique ostrien (gloses de DV-05, LT-02, RG-02, bible §4)

| Ostrien | EN | Ostrien | EN |
|---|---|---|---|
| *ta* | and | *tenn* | fire, light |
| *-essa* | feminine (names) | *ok* | cape, point |
| *vel* | sea | *laak* | shelter, still water |
| *kess* | stone | *aar* | island |
| *vik* | bay | *orr* | wind |
| *draa* | path | *ilv* | fern |
| *nor* | new | *maask* | gull |
| *haask* | falcon | *taalik* | messenger |
| *daan* | tooth, teeth | *-ess* | reduced feminine (old names, poetry) |
| *mo* | I, me, my | *kaari* | dear (stronger than in Velmarchois) |
| *isa* | father | *ookta* | is dead |
| *ei* | not | *kaamen* | to hold |
| *tule* | come back | *vaard* | keeper |
| *tenn-vaard* | keeper of the light | *tenn-vaardessa* | (woman) keeper of the light |
| *vel-vaard* | seaman, naval officer | *-tiira* | daughter of |
| *-sonn* | native of | *Velmarke* | Velmarche |

Composés : *Tennok* “cape of fire”, *Vellaak* “sea shelter”, *Kessaar* “stone island”, *Orrvik*
“bay of the wind”, *Kessvel* “sea stone”, *Vel Taalik* “the Messenger of the Sea”, *Taalikmaal*
“the Messenger's words”, *Kessdaan* “the stone teeth”. Prénoms (DV-05 § V) : *Maaren* “she of the
calm sea”, *Aldrik* “old path”, *Tenna* “little light”, *Selda* “she who keeps”, *Hessa* “the gentle
one”, *Orrin* “son of the wind”, *Tavik* “little bay”, *Joren* “the watchman”, *Nora* “the new one”.
Thalbère (affaire 2) : *-ica* “inhabited place”, *verna* “ember”, *dalva* “running water, torrent”,
*-in* “of the house of”.

### 6.4 Phrases-clés (même formulation dans toutes les pièces qui les citent)

| FR | EN |
|---|---|
| ceux que nous avons rendus absents | those we made absent |
| à tous les descendants vivants de mon père et de mon oncle | to all the living descendants of my father and my uncle |
| commencez par la cuisine | start with the kitchen |
| l'enfant d'Odile, né là où l'on ne naît pas | Odile's child, born where no one is born |
| à mes enfants vivants | to my living children (DEVLOG) |
| Je suis Bastien Tessonnal. | I am Bastien Tessonnal. (DEVLOG) |
| Mon frère avait les yeux de notre mère. | My brother had our mother's eyes. (DEVLOG) |
| il a les yeux de sa mère | he has his mother's eyes |
| Dis à la petite que son père n'a pas mis le feu. | Tell the little one her father didn't set the fire. |
| Si le Thalbère revient, ouvre-lui. | If the Thalbère comes back, let him in. |
| Pour le Goéland / Pour T. H. / Pour N. / Pour Augustin. | For the Gull / For T. H. / For N. / For Augustin. |
| Absent par choix, 1976 | Absent by choice, 1976 |
| Tous les vivants | All the living |
| Notre Lise | Our Lise |
| la gardienne de l'Ourse | the keeper of the Ourse |
| M. B. au magasin des emballages | M. B. at the packing store (initiales inchangées) |

---

## 7. Métiers des deux affaires (`family.json`)

Règles :
- **Un id = un mot anglais, jamais partagé** dans une même affaire, ni avec un autre mot du même
  champ sémantique qui ferait confusion. Les leurres restent distincts des vrais métiers.
- Libellé : capitale initiale, **neutre** si l'anglais le permet ; genré seulement quand l'anglais
  d'époque l'est naturellement et que **tous** les titulaires ont ce genre (*Postmistress*,
  *Schoolmistress*, *Laundress*, *Hospitaller nun*). Le point médian devient un neutre.
- Dans les pièces, le métier s'écrit avec **le même mot** que le libellé (au genre et au nombre près),
  pour que le joueur reconnaisse l'élément à poser dans l'arbre.
- Colonne « terme » : la forme du terme de recherche (affaire 1, mots-clés `kind: other`) quand il
  existe ; la table de l'affaire (T0-V) fixe la liste complète.

### 7.1 Affaire 1 — Succession Varenque (32 métiers, dont 4 leurres)

| id | FR | EN | Titulaire(s) | Terme EN | Pourquoi ce mot |
|---|---|---|---|---|---|
| `papetier` | Papetier | **Papermaker** | Anselme | papermaker | distinct de *Director of the Paper Mills* et d'*Industrialist* |
| `botaniste` | Botaniste | **Botanist** | Clémence | botanist | |
| `capitaine` | Capitaine au long cours | **Master mariner** | Firmin (1849) | captain / master mariner | terme britannique exact ; *captain* reste le titre |
| `gardien-de-phare` | Gardien·ne de phare | **Lighthouse keeper** | Maaren, Tavik | keeper / light keeper / keeper of the light | neutre (une femme et un homme) |
| `depute` | Député | **Deputy** | Augustin (1872) | Deputy | Chambre des députés |
| `philanthrope` | Philanthrope | **Philanthropist** | Henriette | | |
| `affichiste` | Peintre-affichiste | **Poster artist** | Lucien | poster artist / poster painter | |
| `blanchisseuse` | Blanchisseuse | **Laundress** | Pauline | laundress | ≠ *washerwoman* (affiche, Œuvre) et ≠ *Artist's model* |
| `institutrice` | Institutrice | **Schoolmistress** | Adélaïde | schoolmistress | période |
| `patron-de-canot` | Patron du canot de sauvetage | **Lifeboat coxswain** | Aldrik | coxswain | ≠ *Fishing skipper* |
| `receveuse` | Receveuse des postes | **Postmistress** | Tenna | postmistress | |
| `directeur-papeteries` | Directeur des Papeteries | **Director of the Paper Mills** | Gaspard | | ≠ *Papermaker* |
| `pianiste` | Pianiste | **Pianist** | Irène | pianist | |
| `cantatrice` | Cantatrice | **Opera singer** | Blanche | soprano / operatic artiste | le terme de recherche reste *soprano* ; *operatic artiste* rend « artiste lyrique » ; *opera singer* n'est **pas** un terme (sinon liens en trop, §9.2) |
| `commissaire` | Commissaire aux Registres | **Commissioner of Registers** | Marcel | Commissioner of Registers | |
| `graveuse` | Graveuse de filigranes | **Watermark engraver** | Odile | engraver / watermark engraver | |
| `typographe` | Typographe | **Typesetter** | Orrin | typesetter | *typographer* aujourd'hui = dessinateur de caractères |
| `aviateur` | Aviateur | **Aviator** | Victor | aviator | |
| `costumiere` | Costumière | **Costume maker** | Ninon | costume maker | |
| `patron-pecheur` | Patron pêcheur | **Fishing skipper** | Firmin (1900) | fishing skipper | ≠ *Lifeboat coxswain* |
| `sage-femme` | Sage-femme | **Midwife** | Hessa | midwife / midwives | |
| `journaliste` | Journaliste | **Journalist** | Selda, Paul | journalist | |
| `etudiant` | Étudiant | **Student** | Augustin (1924) | student | |
| `avocat` | Avocat | **Barrister** | Armand | | *Maître* (§2.5) |
| `speakerine` | Speakerine | **Television announcer** | Mathilde | announcer | |
| `medecin` | Médecin | **Doctor** | Hélène | | *Dr* |
| `restauratrice` | Restauratrice de papier | **Paper conservator** | Lise | conservator | |
| `ingenieure` | Ingénieure | **Engineer** | Claude | engineer | genre : §9.3 |
| `comptable` | Comptable *(leurre)* | **Bookkeeper** | — | | |
| `photographe` | Photographe *(leurre)* | **Photographer** | — | photographer | |
| `modele` | Modèle d'artiste *(leurre)* | **Artist's model** | — | | |
| `industriel` | Industriel *(leurre)* | **Industrialist** | — | | |

### 7.2 Affaire 2 — Le Revenant de Hautcorvin (27 métiers, dont 3 leurres)

| id | FR | EN | Titulaire(s) | Pourquoi ce mot |
|---|---|---|---|---|
| `directeur-verreries` | Directeur·rice des Verreries | **Director of the Glassworks** | Évariste, Colombe | neutre |
| `doreuse` | Doreuse sur verre | **Glass gilder** | Clotilde | |
| `charbonnier` | Charbonnier | **Charcoal burner** | Dranko | |
| `carrier` | Carrier | **Quarryman** | Barthélemy | *the quarrymen* de la Combe-aux-Sables |
| `sage-femme` | Sage-femme | **Midwife** | Annette | |
| `maitre-verrier` | Maître verrier | **Master glassmaker** | Honoré | DEVLOG ; ≠ *Glassworker* (leurre) |
| `modiste` | Modiste | **Milliner** | Eugénie | |
| `graveur-sur-verre` | Graveur·se sur verre | **Glass engraver** | Danela, Andrin | neutre ; ≠ *Glass gilder* |
| `religieuse` | Religieuse hospitalière | **Hospitaller nun** | Marguerite | |
| `opticien` | Opticien (lentilles de phare) | **Lens maker (lighthouse lenses)** | Léonce | *optician* = lunetier en anglais britannique |
| `guide-de-montagne` | Guide de montagne | **Mountain guide** | Jules, Rémi, Gilles | |
| `aubergiste` | Aubergiste | **Innkeeper** | Philomène | |
| `fonde-de-pouvoir` | Fondé de pouvoir | **Company secretary** | Aimé | signe et tient les comptes des Verreries |
| `souffleur` | Souffleur de verre | **Glassblower** | Bastien | ≠ *Night foreman* (leurre revendiqué) |
| `gardien-de-refuge` | Gardien·ne de refuge | **Refuge keeper** | Lucie | neutre |
| `douanier` | Douanier | **Customs officer** | Victorin | |
| `institutrice` | Institutrice | **Schoolmistress** | Odette | |
| `ingenieur-verrier` | Ingénieur verrier | **Glass engineer** | Hugues | ≠ *Lens maker* |
| `photographe` | Photographe | **Photographer** | Sabine | |
| `journaliste` | Journaliste | **Journalist** | Isaure | |
| `notaire` | Notaire | **Notary** | Julien | *Maître* |
| `infirmiere` | Infirmière | **Nurse** | Agnès | |
| `moniteur-de-ski` | Moniteur de ski | **Ski instructor** | Pierre | |
| `receveuse` | Receveuse des postes | **Postmistress** | Brigitte | |
| `chef-de-nuit` | Chef de nuit *(leurre)* | **Night foreman** | — (case revendiquée) | ≠ *night watchman* (Mallet) |
| `passeur` | Passeur·se *(leurre)* | **Border runner** | — | ≠ *Mountain guide*, *Refuge keeper* |
| `verrier` | Verrier *(leurre)* | **Glassworker** | — | ≠ *Master glassmaker*, *Glassblower* |

**Contrôle** : dans chaque affaire, les libellés anglais sont deux à deux distincts (vérifié pour les
32 et les 27 ci-dessus). Les mêmes ids d'une affaire à l'autre (`sage-femme`, `institutrice`,
`receveuse`, `photographe`, `journaliste`) ont le même mot anglais.

**Formes genrées dans les pièces** : *keeper* est neutre ; pour Maaren, la première femme gardienne,
le texte dit *a woman keeper* là où le français insiste (*gardienne*, *tenn-vaardessa*). *Receveur*
(homme, affaire 2) → *postmaster*. *Instituteur* → *schoolmaster*. *Graveuse* → *engraver* + pronom.

---

## 8. Vocabulaire de l'interface

Aligné sur le DEVLOG anglais. **« Slot » est réservé à l'arbre** ; les emplacements de sauvegarde
s'appellent *saves*. **« Establish » est réservé à la validation** ; ne jamais l'employer pour autre
chose (d'où *permanent rapporteur*).

| FR | EN | Note |
|---|---|---|
| case (de l'arbre) | **slot** | DEVLOG |
| établir ; établi(e) ; Établi (tampon) | **establish** ; established ; ESTABLISHED | DEVLOG |
| revendiqué(e) ; case revendiquée | **claimed** ; claimed slot | DEVLOG |
| Déclaré (étiquette) ; déclaration ; déclaré par le requérant | **Declared** ; statement ; declared by the claimant | DEVLOG *statement* |
| posé (par vous) | placed (by you) | |
| Retirer / Rétablir la déclaration ; Déclaration contestée | Remove / Restore the statement ; Statement contested | DEVLOG *contest*, *restore* |
| requérant ; requête (Voir la requête) | claimant ; petition (See the petition) | |
| Visé (tampon de décision) | **ENDORSED** | |
| Apposer ce tampon ? | Apply this stamp? | |
| tampon ; coup de tampon | stamp ; *Stamped!* | DEVLOG *rubber stamp* |
| Secours (automatique) ; Secours · <affaire> | **Autosave** ; Autosave · <case> | DEVLOG *autosave* |
| Emplacement(s) ; Emplacement libre | **Save(s)** ; Empty save | jamais *slot* |
| Nouvelle partie ; Continuer ; Charger | New game ; Continue ; Load | DEVLOG |
| affaire | **case** | DEVLOG |
| dossier | **file** | DEVLOG |
| rapporteur ; rapporteur titulaire | rapporteur ; permanent rapporteur | |
| Bureau | Desk | |
| Archives | **Archives** | |
| Lecteur (panneau de lecture) | **Reader** | |
| Lecteur des Archives (machine) | **Archive Reader** | DEVLOG |
| Catalogue ; Consulter ; Requête | **Catalogue** ; Search ; Query | |
| fiche (résultat) ; fiches par lieu | card ; cards per place | |
| Carnet | **Notebook** | DEVLOG |
| Tableau d'épingles ; épingle ; Épingler | **Pinboard** ; pin ; Pin | |
| Galerie des visages ; visage | **Face Gallery** ; face | |
| Journal | **Journal** | |
| Carte | Map | |
| Arbre ; branche ; groupe ; génération ; champ | Tree ; branch ; group ; generation ; field | |
| Soumettre la branche | Submit the branch | |
| Prénom / Nom / Portrait / Métier | Given name / Surname / Portrait / Occupation | |
| Original / Transcription ; Recto / Verso | Original / Transcript ; Front / Back | DEVLOG *transcription* acceptable, préférer *transcript* |
| Surligner ; surlignage ; passage | Highlight ; highlight ; passage | |
| passage caviardé | redacted passage | |
| Termes ; terme épuisé, tout consulté | Terms ; exhausted term, all seen | |
| Où chercher ? | **Where to look?** | |
| Aide ; Comment jouer ; Aides (options) | Help ; How to play ; Hints | |
| indice(s) ; indices progressifs ; palier | hint(s) ; progressive hints ; tier | DEVLOG |
| Niveau d'aide : Archiviste / Enquêteur / Assisté / Guidé / Personnalisé | Hint level: Archivist / Investigator / Assisted / Guided / Custom | |
| Compteur de groupe | Group counter | |
| Notes de service ; Note de service | **Office memos** ; Office memo | tutoriel |
| Nouveautés seulement | New things only | DEVLOG |
| Révélation ; Secret découvert | Revelation ; Secret uncovered | |
| Rapport final ; Remettre le rapport | Final report ; Submit the report | |
| Dénouement ; Fins vues | Ending ; Endings seen | DEVLOG *endings* |
| Classé ; Dernier classement | Filed ; Last filed | |
| Succès | Achievements | |
| Chronométré ; Normal ; Fractionnés (verrouillages) | Timed ; Standard ; Splits (locks) | DEVLOG *timed mode* |
| Rubriques du carnet : Personnes / Lieux / Organisations / Dates et événements / Objets / Divers | People / Places / Organisations / Dates and events / Objects / Other | |
| Types de lieux : Région / Ville / Village / Bâtiment / Lieu-dit / Mer / Montagne / Cours d'eau | Region / Town / Village / Building / Landmark / Sea / Mountain / River | *Town* : la Velmarche n'a qu'une capitale |
| Fonds du lieu ; Ouvrir le fonds du lieu | Place collection ; Open the place's collection | |
| mentionné, pas encore ouvert | mentioned, not yet opened | |
| Dossier O.R.C. 74 (kicker du menu) | O.R.C. file 74 | |
| Le temps s'arrête | Time stands still | |
| Ce que l'arbre ne dit pas | What the tree doesn't say | |

Le titre du jeu **reste** *L'Arbre aux absents* (D3), avec sa majuscule et son apostrophe ; on ne le
traduit ni dans l'UI, ni sur le site, ni en sous-titre. Titres d'affaires : **The Varenque
Succession** (`succession-varenque`) et **The Revenant of Hautcorvin** (`revenant-hautcorvin`) ;
sous-titres : *Civil Re-registration Office — file No. 74-0318* / *No. 76-0012*.

---

## 9. Termes de recherche (`progression.json` → calque `keywords`)

### 9.1 Ce qui ne change pas

- **Les ids** ne changent jamais (ni ceux des mots-clés, ni ceux des secrets, options, groupes).
- **Mot-clé de personne** : les termes égaux à un prénom, un nom ou une variante de `family.json`
  restent **identiques** (règle 12.5 : ils doivent figurer dans les termes anglais). On ne traduit
  que l'élément de civilité ou de parenté : *Me Brunesseau* → *Maître Brunesseau* (+ *Brunesseau*) ;
  *M. Hautfeuille* → *Mr Hautfeuille* ; *Tante Adé* → *Aunt Adé* (+ *Adé*) ; *sœur Agathe* → *Sister
  Agathe* ; *abbé Pradeil* → *Father Pradeil* ; *le Goéland* → *the Gull* (+ *Gull*, *Maask*) ; *le
  Thalbère* → *the Thalbère* ; *La gardienne de l'Ourse* → *the keeper of the Ourse*.
- **Mot-clé de lieu** : nom de la carte, toponyme, rue ou enseigne (§3.1) → **termes identiques**
  (*Moulinvert*, *Tilleuls*, *col de Corvenne*, *monts Corvins*, *Corvins*, *lac d'Aulne*, *moulin de
  la Sorbe*, *rue des Tanneurs*, *Thermes de Mérande*, *Pas de l'Ourse*, *refuge de l'Ourse*,
  *Auberge des Guides*, *Combe-aux-Sables*, *Dalvica / Dalvezac*, *Brénica / Brenzac*, *Kessaar*).
  Seul le libellé peut prendre un article anglais. Lieux décrits par un nom commun → traduits
  (*halle des fours* → *furnace hall* ; *four n° 2* → *Furnace No. 2* ; *magasin des emballages* →
  *packing store* ; *atelier de gravure* → *engraving workshop* ; *cellule 14* → *cell 14* ; *caveau*
  → *vault*).
- **Ostrien, thalbère, sigles, codes, numéros** : identiques (*Vel Taalik*, *Maask*, *Albatros*,
  *Hirondelle*, *RTV*, *CVC*, *LX-2*, *MF-74-112*, *P-4471*, *0214*, *214*, *1171*).
- **Marques et studios** : identiques (*Studio Lumen*, *Studio Orlhac*, *L'Égide*, *Aéro-Velmarche*).

### 9.2 Ce qui se traduit, et comment

Noms communs, institutions, événements, objets et métiers prennent un **libellé anglais** et des
**termes anglais** selon les tables §4 et §7. Le moteur cherche **le mot entier**, sans accents ni
casse, **sans racinisation** (`autolink.ts`, `normalize.ts`). Conséquences :

1. **Parité des liens** (règle 12.3) : dans chaque pièce, l'ensemble des mots-clés liés en anglais
   doit être celui du français. Un terme anglais **trop courant** crée des liens que le français n'a
   pas : *fire* (pour *incendie* ; le français dit souvent *feu*, qui n'est pas un terme), *strike*
   (*grève*), *exile*, *absent*, *keeper*, *captain*, *box*, *sheep*, *opera singer* (*cantatrice*
   n'est pas un terme en français). Remède : un terme **composé** ou **plus précis** (*the 1937 fire*,
   *fire of 1937*, *the 1936 strike*), ou la même rareté que le français ; puis vérifier avec
   `npm run content:i18n -- --case <id>`.
2. **Singulier et pluriel** : le français *absents* ne lie pas *absent* ; l'anglais *absent* couvre
   les deux. Rendre *les absents* par *the absent* (terme) et un *absent* isolé par *absentee* ou
   *absent man* (non-terme). Ajouter le pluriel anglais quand le français a les deux formes
   (*sage-femme / sages-femmes* → *midwife / midwives* ; *carnets gris / carnet gris* → *grey booklets
   / grey booklet* ; *télégramme / télégrammes* → *telegram / telegrams*).
3. **Unicité** : un terme normalisé n'appartient qu'à un mot-clé, dans la langue (règle 12.5). *Fern*
   est le terme de `fougere` ; *undated fern* celui de `fougere-sans-date` (le plus long gagne, comme
   *fougère sans date* contient *fougère*).
4. **Apostrophes** : `’` et `'` deviennent une espace (*Lucie's box* → `lucie s box`). Le joueur qui
   tape le terme tel qu'il est écrit le trouve ; on n'ajoute pas de variante fautive.
5. **Article** : pas d'article dans les termes sauf si le français en a un dans un titre (« Le
   Revenant de Hautcorvin » → *The Revenant of Hautcorvin* ; « La Sentinelle » → *The Sentinel*).
6. **Libellés** : capitale pour les noms propres et les titres (*Bulletin of Order*, *Grand
   Exhibition*, *the Papermakers' Trial*), minuscules pour les noms communs comme en français
   (*watermark*, *herbarium*, *grey booklets*).

### 9.3 Genre grammatical qui identifie quelqu'un

Le français révèle parfois le sexe d'une personne désignée par une initiale ou un prénom épicène ;
l'anglais doit le dire autrement (pronom, *Mrs/Miss*, *woman*). Cas repérés :
- *C. Sauge, ingénieure* (OF-05) et ses mentions : *Claude* est épicène → *she*, *Miss C. Sauge* si
  le français dit *Mlle*, sinon *she* dans la phrase voisine.
- *L. Daubry, restauratrice* (affaire 2, EX-02) : *she*.
- *la scriptrice* de LT-11 (affaire 2, « B. N. ») : *the woman writing it down*, *her hand*.
- *la Thalbère* (Danela) / *le Thalbère* (Andrin) : *the Thalbère woman* / *the Thalbère* (+ *him*).
- *la comparante / le comparant*, *la requérante*, *née*, *Né(e)* des registres : *she/he*, colonne
  *Sex* gardée.
- *gardienne du feu*, *tenn-vaardessa* (Maaren, LT-02, PR-05) : *a woman keeper of the light*.
- *receveuse* vs *receveur* : *postmistress* vs *postmaster*.
Le `level-designer` relit ces passages (lot C2).

### 9.4 Termes sensibles pour la déduction

- **`orrin-kessvel` (affaire 1) est le seul `hiddenTerm`** : *Orrin Kessvel* n'est **jamais écrit en
  entier** dans une pièce. L'anglais garde l'interdit : seulement *Orrin*, *Kessvel*, *O. Kessvel*,
  *KESSVEL Orrin* (fiche, ordre inversé). Le terme anglais reste *Orrin Kessvel*.
- **Fonds restreints** (affaires 1 et 2) : accessibles sur « Prénom Nom » exacts ; les noms ne
  changeant pas, rien à faire, sauf ne **pas** écrire un nom complet que le français n'écrit pas.
- *fougère sans date* → **undated fern**, et nulle part ailleurs que là où le français l'écrit ;
  *fougère sans millésime* → *fern without a year mark*.
- *Maask* ↔ *le Goéland* ↔ *maask* « goéland » (lexique) : *Maask* ↔ *the Gull* ↔ *maask* “gull”.
- Initiales et graphies partielles : *A. Varenque*, *Augustin V.*, *T. Orrvik*, *L. Daubry*, *C. Sauge*,
  *B. Neviot*, *A. Dalvarin*, *M. B.*, *A. B.*, *N.*, *T. H.* : **intactes**.
- Nombres-termes : *0214*, *214*, *1171*, *P-4471* (et le distracteur *P-4472*), *cellule 14* (*cell
  14*), *four n° 2* (*Furnace No. 2*) : chiffres intacts.
- Secrets (titres) : *Le Goéland et l'Albatros* → *The Gull and the Albatros* ; *La fille du
  souffleur* → *The Glassblower's Daughter* ; *Le fils de la Thalbère* → *The Thalbère Woman's Son* ;
  la table de l'affaire fixe les autres.

---

## 10. Carte et monde (`content/world/locales/en.json`)

- Titre de carte : *Velmarche*. Attribution : *Map drawn and engraved by CM Creative Lab* (DEVLOG).
- Les `name` des lieux ne se traduisent pas (pas de champ dans le calque) ; les descriptions suivent
  ce glossaire.
- Cartouche suggéré pour `art/map/locales/en/labels.svg` (lot T2) : *Map of Velmarche and Ostrie,
  drawn up for the Civil Re-registration Office after the map of the Grand Exhibition (1889),
  revised 1974*. Échelle : *Velmarche leagues*. Noms communs des étiquettes : *estuary*, *Grisenoue
  marshes*, *Sorbe hills*, *Brénica road*, *Orvelle Packet line* ; les noms de lieux eux-mêmes restent.

---

## 11. Décisions à valider et écarts connus

1. **DEVLOG « Bear's Pass »** : le devlog anglais déjà écrit traduit *Pas de l'Ourse* par *Bear's
   Pass*. Selon D3 (lieux de la carte jamais traduits), il faudrait *the Pas de l'Ourse trail*. Hors
   de mon périmètre : à corriger dans `assets/social/DEVLOG.md` avant publication, ou à accepter comme
   licence promotionnelle.
2. Civilités traduites (*Mr/Mrs/Miss*) mais **Maître** gardé (§2.5).
3. Titres de presse et d'institutions **traduits** ; sigles **gardés** (*ORC*, *BRR*, *CVC*, *RTV*).
4. *Ostrian* anglicisé, *Velmarchois* et *Thalbère* gardés (§3.2).
5. *Grand Exhibition* plutôt que *Great Exhibition* ; *Orvelle Packet Company* plutôt que *Steam
   Packet* ; *Public Security* plutôt que *Sûreté*.
6. Titre d'affaire 1 : *The Varenque Succession* (avec article, comme *The Revenant of Hautcorvin*).
7. *radiation* → *removal* dans les noms d'institution et de listes, *struck off* pour les personnes.
8. Libellés de métier neutres là où le français genré donnait un indice (*Engineer* pour
   *Ingénieure*) : légère perte d'aide, à arbitrer par le `level-designer` (C2).
