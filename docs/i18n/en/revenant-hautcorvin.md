# Terminologie anglaise — Le Revenant de Hautcorvin (`revenant-hautcorvin`)

> Lot **T0-H** de `docs/i18n/PLAN.md`. Tenu par `scenariste`. Complète `docs/i18n/en/GLOSSAIRE.md`
> (qui prime) pour cette affaire seulement. Calques : `content/cases/revenant-hautcorvin/locales/en/`
> `{progression,family,tree}.json`. Les traducteurs des pièces (lots T1/T2) **écrivent dans les
> documents exactement les termes ci-dessous** là où le français écrit le terme français, et
> **nulle part ailleurs** (parité des liens, règle 12.3).
>
> Vérifié le 15 octobre 2026 : schémas zod du contrat, parité des clés avec le FR, même nombre de
> termes par mot-clé, unicité des termes normalisés, règle 12.5 (variantes de noms), libellés de
> métiers deux à deux distincts. `content:i18n` n'était pas encore implémenté (lot A1).

## 1. Mots-clés (`progression.json` → `keywords`)

Le moteur cherche le **mot entier**, sans casse ni accents, sans racinisation ; l'apostrophe devient
une espace (*Lucie's box* → `lucie s box`) ; le terme le plus long gagne.

### 1.1 Personnes (54 mots-clés) : termes identiques au français

Tous les noms, variantes d'épouse, ordres inversés et initiales restent **à la lettre** (glossaire
§3, §9.1) : `evariste-tessonnal` … `lucie`. Seuls changent :

| id | Libellé FR | Libellé EN | Termes FR | Termes EN |
|---|---|---|---|---|
| `soeur-agathe` | sœur Agathe | Sister Agathe | sœur Agathe | Sister Agathe |
| `pradeil` | abbé Pradeil | Father Pradeil | Pradeil | Pradeil |
| `thalbere` | le Thalbère | the Thalbère | le Thalbère ; la Thalbère | the Thalbère ; the Thalbère woman |
| `gardienne-de-l-ourse` | La gardienne de l'Ourse | The keeper of the Ourse | gardienne de l'Ourse | keeper of the Ourse |

### 1.2 Lieux, organisations, objets, événements

| id | Libellé FR | Libellé EN | Termes FR | Termes EN |
|---|---|---|---|---|
| `verreries` | Verreries de Hautcorvin | Hautcorvin Glassworks | Verreries de Hautcorvin | Hautcorvin Glassworks |
| `poste-de-vernezac` | Poste de Vernezac | Vernezac post office | poste de Vernezac | Vernezac post office |
| `telegramme` | Télégramme | Telegram | télégramme ; télégrammes | telegram ; telegrams |
| `guides-de-vernezac` | Compagnie des guides de Vernezac | Vernezac Guides' Company | Compagnie des guides de Vernezac ; guides de Vernezac | Vernezac Guides' Company ; Vernezac guides |
| `refuge-de-l-ourse` | Refuge de l'Ourse | Refuge de l'Ourse | refuge de l'Ourse | refuge de l'Ourse |
| `pas-de-l-ourse` | Pas de l'Ourse | Pas de l'Ourse | Pas de l'Ourse | Pas de l'Ourse |
| `douanes-de-la-veze` | Douanes de la Vèze | Vèze customs | douanes de la Vèze | Vèze customs |
| `combe-aux-sables` | Combe-aux-Sables | Combe-aux-Sables | Combe-aux-Sables | Combe-aux-Sables |
| `grande-exposition` | Grande Exposition | Grand Exhibition | Grande Exposition | Grand Exhibition |
| `lentille-de-tennok` | Lentille de Tennok | Tennok lens | lentille de Tennok | Tennok lens |
| `studio-orlhac` | Studio Orlhac | Studio Orlhac | Studio Orlhac | Studio Orlhac |
| `incendie` | Incendie de 1937 | The 1937 blaze | incendie | **blaze** (§3.1) |
| `halle-des-fours` | Halle des fours | Furnace hall | halle des fours | furnace hall |
| `four-n-2` | Four n° 2 | Furnace No. 2 | four n° 2 | Furnace No. 2 |
| `greve` | Grève de 1936 | The 1936 walkout | grève | **walkout** (§3.2) |
| `magasin-des-emballages` | Magasin des emballages | Packing store | magasin des emballages | packing store |
| `l-egide` | L'Égide | L'Égide | L'Égide | L'Égide |
| `registre-des-rondes` | Registre des rondes | Rounds register | registre des rondes | rounds register |
| `pli-cachete` | Pli cacheté de 1958 | Sealed envelope of 1958 | pli cacheté | sealed envelope |
| `bulletin-d-ordre` | Bulletin d'Ordre | Bulletin of Order | Bulletin d'Ordre | Bulletin of Order |
| `coupe-du-regent` | Coupe du Régent | Regent's Cup | Coupe du Régent | Regent's Cup |
| `saint-eloi` | Concours de la Saint-Éloi | St Éloi competition | Saint-Éloi ; St-Éloi | Saint-Éloi ; St Éloi |
| `atelier-de-gravure` | Atelier de gravure | Engraving workshop | atelier de gravure | engraving workshop |
| `parrain` | Parrain | Godfather | parrain | godfather |
| `marraine` | Marraine | Godmother | marraine | godmother |
| `expulsion` | Expulsion de 1916 | The 1916 expulsion | expulsion | expulsion |
| `dalvica` | Dalvica (Dalvezac) | Dalvica (Dalvezac) | Dalvica ; Dalvezac | Dalvica ; Dalvezac |
| `brenica` | Brénica (Brenzac) | Brénica (Brenzac) | Brénica ; Brenzac | Brénica ; Brenzac |
| `verrerie-de-brenica` | Verrerie de Brénica | Brénica Glassworks | Verrerie de Brénica | Brénica Glassworks |
| `messager-de-brenzac` | Le Messager de Brenzac | The Brenzac Messenger | Messager de Brenzac | Brenzac Messenger |
| `kessaar` | Kessaar | Kessaar | Kessaar | Kessaar |
| `matricule-214` | Matricule 214 | Prisoner number 214 | 0214 ; 214 | 0214 ; 214 |
| `matricule-1171` | Matricule 1171 | Prisoner number 1171 | 1171 | 1171 |
| `cellule-14` | Cellule 14 | Cell 14 | cellule 14 | cell 14 |
| `revenant` | « Le Revenant de Hautcorvin » | “The Revenant of Hautcorvin” | Le Revenant de Hautcorvin | The Revenant of Hautcorvin |
| `la-sentinelle` | La Sentinelle des Corvins | The Corvins Sentinel | La Sentinelle des Corvins ; La Sentinelle | The Corvins Sentinel ; The Sentinel |
| `fete-de-la-neige` | Fête de la neige | Snow Festival | fête de la neige | Snow Festival |
| `ecole-de-ski` | École de ski | Ski school | école de ski | ski school |
| `ecole-de-vernezac` | École de Vernezac | Vernezac school | école de Vernezac | Vernezac school |
| `avion-postal` | Avion postal | Mail plane | avion postal | mail plane |
| `auberge-des-guides` | Auberge des Guides | Auberge des Guides | Auberge des Guides | Auberge des Guides |
| `hospice-de-hautcorvin` | Hospice de Hautcorvin | Hautcorvin hospice | hospice de Hautcorvin | Hautcorvin hospice |
| `verre-grave` | Verre gravé | Engraved glass | verre gravé ; À la fille du souffleur | engraved glass ; To the glassblower's daughter |
| `boite-de-lucie` | Boîte de Lucie | Lucie's box | boîte de Lucie | Lucie's box |
| `carnet-des-moutons` | Carnet des moutons | Sheep notebook | carnet des moutons ; moutons | sheep notebook ; sheep |
| `journal-de-soeur-agathe` | Journal de sœur Agathe | Sister Agathe's diary | journal de sœur Agathe | Sister Agathe's diary |
| `tables-des-deces` | Tables des décès | Death indexes | tables des décès | death indexes |

## 2. Secrets, groupes, rapport, métiers

**Secrets** : `s1-le-feu-de-1937` *The Fire of 1937* · `s2-le-pas-de-l-ourse` *The Pas de l'Ourse* ·
`s3-le-fils-de-la-thalbere` *The Thalbère Woman's Son* · `s4-la-coupe-du-regent` *The Regent's Cup*
· `s5-la-fille-du-souffleur` *The Glassblower's Daughter*. (Titres non liés : *fire* y rend *feu*.)

**Groupes** (`tree.json`) : `g-prologue` *Prologue — the petition and the objection* · `g-revenant`
*The revenant* · `g-verriers` *The master glassmakers* · `g-bapteme` *The Vernezac christening* ·
`g-brossal` *The Brossal household* · `g-combe` *The people of the Combe* · `g-ourse` *The Pas de
l'Ourse* · `g-vernezac` *The Vernezac guides*.

**Rapport** : *Not established* pour `non-etabli` (sens de la loi des deux pièces, compatible avec la
réserve du glossaire §8 sur *establish*). `decision` : *Reject the petition and report the
impersonation.* / *Re-register Bastien Tessonnal posthumously…* (motif d'indisponibilité : *Agnès's
parentage is not established by two documents.*, 55 caractères) / *Grant the petition: register the
claimant under the name of Bastien Tessonnal.*

**Métiers** : glossaire §7.2, à la lettre (27 libellés distincts). **Portraits** : 36 textes
alternatifs, sans légende (le FR n'en a pas). Traits héréditaires selon le glossaire §6.1 : *a dimple
in the left cheek*, *very pale grey eyes* (≠ *light grey eyes* de `hc-portrait-e57af4`, comme
« très clairs » ≠ « clair »), *straight, thick eyebrows*, *a cowlick in the middle of the forehead*,
*an even hairline* (absence d'épi : indice), *a chipped front tooth*, *three-fingered left hand*,
*burnt hands*. La loupe de Léonce est *a lens maker's loupe* pour faire écho au métier.

## 3. Termes de déduction et pièges de parité

### 3.1 `incendie` → *blaze* (écart au glossaire §4.5)

Le glossaire propose *the 1937 fire*. Impossible ici : *fire* rend aussi **feu** (« mis le feu », « depuis le
feu », « le feu a pris », et surtout *Museum of the Fire Arts*, fixé au §4.4, dans ex-04, ob-01, ob-02,
ph-01, pr-01 ; *feu M. X* se rend par *the late Mr X*), et un terme composé daté ne rentre pas dans les emplois réels de
*incendie* : « police incendie n° 18-447 » (lt-09), « incendie criminel » (of-02, ph-09, rg-11),
« la nuit de l'incendie » (pv-01, pv-02, pv-07), « L'INCENDIE DE VERNEZAC » (pr-04). D'où une
équivalence stricte pour les traducteurs : **incendie = blaze, feu = fire**, sans exception.
Rendus imposés : *the night of the blaze* ; *criminal blaze* (pas *arson*) ; pr-04 *THE VERNEZAC
BLAZE* ; lt-09 *Rider No. 3 to L'Égide blaze policy No. 18-447* (formulation un peu raide, voulue
pour garder le lien) ; le tampon de rp-02 (non lié) garde *FIRE INSURANCE COMPANY*. Q1 du rapport :
*Who set fire to…* (traduit « mis le feu »).

### 3.2 `greve` → *walkout*

*strike* est trop courant et entre en collision avec *strike off* (radier, glossaire §4.3). *walkout*
(attesté dès la fin du XIXᵉ siècle) couvre les six emplois de *grève* (pr-03, pr-04, pv-01, rp-01) :
titre de pr-03 *“Walkout at the Vernezac furnaces”*. Ne jamais écrire *strike* pour *grève*.

### 3.3 Autres consignes

- **`fougère sans date` → *undated fern*** : terme de l'affaire 1, absent de cette affaire ; ne pas
  l'employer ici. *fern* n'est pas un terme du Revenant.
- *expulsion*, *godfather*, *godmother*, *telegram(s)*, *sheep* : traduits par le mot exact ; *filleul*
  (non terme, lt-01) → *godson*, jamais *godfather's…* ailleurs que pour *parrain*. *sheep* : le
  français n'a que *moutons* (jamais *mouton*), l'anglais *sheep* couvre les deux ; n'écrire *sheep*
  que là où le français dit *moutons* (cp-02, dv-02, ob-03).
- *sealed envelope* : réservé à *pli cacheté*. L'enveloppe « restée close » de lt-05 → *unopened*,
  pas *sealed*.
- *Vèze customs* : « brigade des douanes de la Vèze » → *the Vèze customs post* (lien attendu) ;
  « préposé à la brigade de la Vèze » (rg-10) → *posted to the Vèze post*, sans *customs*.
- *Vernezac school* et *ski school* : ne pas écrire *Vernezac ski school* (ph-16 : *the ski school
  (Mr Pierre Sarrade…)*).
- *The Sentinel* / *The Corvins Sentinel* : avec l'article, comme le français ; les tampons
  *SENTINEL PRINTING WORKS* (ct-01, pb-01) ne sont pas liés.
- *the Thalbère* : ne pas faire suivre d'un nom quand le français dit *thalbère* adjectif (*a Thalbère
  name*, sans article défini) ; *the Thalbère* + nom crée un lien que le français n'a pas.
- *To the glassblower's daughter* : inscription du verre, toujours précédée de *To the*.
- Nombres : *0214*, *214*, *1171*, *cell 14*, *Furnace No. 2* : chiffres intacts.

## 4. Genre grammatical comme indice (glossaire §9.3)

- **la Thalbère / le Thalbère** (Danela / Andrin) : *the Thalbère woman* / *the Thalbère* (+ *him*),
  les deux termes du même mot-clé.
- **La gardienne de l'Ourse** (Lucie) : le terme *keeper of the Ourse* est neutre ; chaque pièce qui
  l'emploie doit dire le sexe dans la même phrase ou la suivante (*she*, *her*, *a woman*).
- **la scriptrice** de LT-11 (« B. N. ») : *the woman writing it down*, *her hand*.
- **L. Daubry, restauratrice** (EX-02) : *she*.
- **Métiers** : *Doreuse sur verre* → *Glass gilder* perd le féminin (seule perte : *Midwife*,
  *Hospitaller nun*, *Schoolmistress*, *Nurse*, *Postmistress* le gardent ou le suggèrent ; les
  masculins du français sont génériques). **Tranché en C2 : gardé.** Un seul métier de doreur dans
  la liste, et les pièces disent le sexe (*gilded by Mrs Tessonnal herself*) ; *gilder* + *she*.
- **receveuse / receveur** : *postmistress* / *postmaster*.

## 5. Points à valider

1. `incendie` → *blaze* au lieu de *the 1937 fire* (glossaire §4.5) ; mettre le glossaire à jour.
2. `greve` → *walkout* au lieu de *the 1936 strike* (glossaire §4.5).
3. *Not established* dans le rapport malgré la réserve de *establish* (§8).
4. ~~*Glass gilder* sans marque de genre~~ : tranché en C2, gardé (§4 ci-dessus).
5. lt-09 : *blaze policy*, tournure inhabituelle pour un anglophone, gardée pour la parité.

## 6. Relecture C2 (`level-designer`)

- **Citations des aides de niveau 3** : les 25 citations anglaises se retrouvent mot pour mot dans
  les pièces désignées (contrôle par script, à la casse et à l'emphase près). Aucune retouche.
- **Barre du T** (EX-02) : LT-04 ouvre bien deux phrases par *Tell…*, RG-15 porte *The whole of the
  foregoing is true*, TG-02 *the Ts*, RP-04 décrit le T de *Tessonnal* : la comparaison se refait en
  anglais. *a woman who mends paper* (EX-02) validé : il porte le genre de *restauratrice*.
- **EX-01, « quarante-neuf ans »** : voulu. La brûlure de Bastien à la main droite date de 1927
  (bible `hautcorvin/04-personnages.md`, marques individuelles) : 1976 − 1927 = 49. Rien à corriger.
- **OF-08** : le texte (*coupée aux ciseaux, bien droit*) prime ; l'`alt` disait *coupée de travers*.
  Corrigé en C2 dans le français et l'anglais (*coupée aux ciseaux* / *cut with scissors*). Rien ne
  repose sur la coupe : EX-02 ne dit que *cut with scissors*.
- **Broche à la colombe** : liens explicites `[[dove|colombe]]` gardés (glossaire §9.5).
- **Harmonisation** : *Bureau des Registres* → *Registers Bureau* (RP-05 corrigé : *Provincial
  Registers Bureau*), comme l'affaire 1.
