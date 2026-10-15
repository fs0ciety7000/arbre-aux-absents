# Terminologie anglaise — La Succession Varenque (`succession-varenque`)

> Lot **T0-V** de `docs/i18n/PLAN.md`. Tenu par `scenariste`. Complète `docs/i18n/en/GLOSSAIRE.md`
> (qui prime) pour cette affaire seulement. Calques : `content/cases/succession-varenque/locales/en/`
> `{progression,family,tree}.json`. Les traducteurs des pièces (lots T1/T2) **écrivent dans les
> documents exactement les termes ci-dessous** là où le français écrit le terme français, et
> **nulle part ailleurs** (parité des liens, règle 12.3).
>
> Vérifié le 15 octobre 2026 : schémas zod du contrat, parité des clés avec le FR, même nombre de
> termes par mot-clé (165 mots-clés), unicité des termes normalisés, règle 12.5 (variantes de noms et
> noms de lieux), 32 libellés de métiers deux à deux distincts. `content:i18n` n'était pas encore
> implémenté (lot A1) : à relancer quand il le sera.

## 1. Mots-clés (`progression.json` → `keywords`)

Le moteur cherche le **mot entier**, sans casse ni accents, sans racinisation ; toute ponctuation
(apostrophe, trait d'union, point, virgule) devient une espace ; le terme le plus long gagne. Les
pluriels ne sont donc **pas** couverts par le singulier (*fern* ne lie pas *ferns*).

### 1.1 Inchangés (99 mots-clés) : libellé et termes identiques au français

Noms propres, initiales, ordres inversés des registres, graphies ostriennes en *-essa*, toponymes,
marques, sigles et cotes restent à la lettre (glossaire §3, §9.1) :

- **person** (77) : `anselme-varenque`, `clemence-aubertot`, `firmin-varenque`, `maaren-tennok`, `maaren-tennokessa`, `joren-tennok`, `augustin-varenque`, `augustin-v`, `henriette-sorbelle`, `lucien-varenque`, `pauline-sauge`, `adelaide-varenque`, `aldrik-varenque`, `a-varenque`, `tenna-orrvik`, `orrvik`, `gaspard-varenque`, `irene-castagne`, `castagne`, `blanche-varenque`, `blanche-daubry`, `blanche-aubertine`, `marcel-daubry`, `daubry`, `odile-varenque`, `orrin-kessvel`, `kessvel`, `victor-sauge`, `ninon-brial`, `selda-varenque`, `hessa-draavik`, `hessa-draavikessa`, `tavik-varenque`, `armand-varenque`, `mathilde-rouviere`, `helene-varenque`, `helene-marsal`, `paul-marsal`, `lise-daubry`, `l-daubry`, `claude-sauge`, `c-sauge`, `nora-ilvess`, `marc-dobrin`, `teodor-haask`, `jorre-haask`, `haask`, `desaulnes`, `anselme`, `clemence`, `augustin`, `lucien`, `adelaide`, `gaspard`, `irene`, `odile`, `firmin`, `maaren`, `aldrik`, `tenna`, `henriette`, `victor`, `pauline`, `hessa`, `selda`, `tavik`, `lise`, `elise`, `ninon`, `claude`, `orrin`, `mathilde`, `armand`, `helene`, `paul`, `marcel`, `maask`.
- **other** (1) : `varenque`.
- **place** (13) : `moulinvert`, `tilleuls`, `tennok`, `vellaak`, `aubrelieu`, `port-senane`, `saint-ormel`, `grisenoue`, `kessaar`, `bains-de-merande`, `thermes-de-merande`, `brenzac`, `rue-des-tanneurs`.
- **organization** (4) : `studio-lumen`, `vel-taalik`, `aero-velmarche`, `rtv`.
- **object** (4) : `albatros`, `mf-74-112`, `p-4471`, `hirondelle`.

### 1.2 Traduits ou adaptés (66 mots-clés)

| id | kind | Libellé FR | Termes FR | Libellé EN | Termes EN |
|---|---|---|---|---|---|
| `sorbelle` | person | Sorbelle | *Sorbelle* / *Banque Sorbelle* | **Sorbelle** | *Sorbelle* / *Sorbelle Bank* |
| `tante-ade` | person | Tante Adé | *Tante Adé* | **Aunt Adé** | *Aunt Adé* |
| `brunesseau` | person | Me Brunesseau | *Brunesseau* | **Maître Brunesseau** | *Brunesseau* |
| `hautfeuille` | person | M. Hautfeuille | *Hautfeuille* | **Mr Hautfeuille** | *Hautfeuille* |
| `le-goeland` | person | le Goéland | *le Goéland* / *Goéland* | **the Gull** | *the Gull* / *Gull* |
| `col-de-corvenne` | place | col de Corvenne | *col de Corvenne* | **Col de Corvenne** | *col de Corvenne* |
| `monts-corvins` | place | monts Corvins | *monts Corvins* / *Corvins* | **Monts Corvins** | *monts Corvins* / *Corvins* |
| `lac-d-aulne` | place | lac d'Aulne | *lac d'Aulne* | **Lac d'Aulne** | *lac d'Aulne* |
| `moulin-de-la-sorbe` | place | moulin de la Sorbe | *moulin de la Sorbe* | **Moulin de la Sorbe** | *moulin de la Sorbe* |
| `papeteries-varenque` | organization | Papeteries Varenque | *Papeteries Varenque* / *Papeteries* | **Varenque Paper Mills** | *Varenque Paper Mills* / *Paper Mills* |
| `lecteur` | organization | Lecteur LX-2 | *Lecteur LX-2* / *LX-2* | **LX-2 Reader** | *LX-2 Reader* / *LX-2* |
| `cvc` | organization | Compagnie Velmarchoise de Calcul | *Compagnie Velmarchoise de Calcul* / *CVC* | **Velmarche Calculating Company** | *Velmarche Calculating Company* / *CVC* |
| `bulletin-d-ordre` | organization | Bulletin d'Ordre | *Bulletin d'Ordre* | **Bulletin of Order** | *Bulletin of Order* |
| `oeuvre-des-lavandieres` | organization | Œuvre des Lavandières | *Œuvre des Lavandières* | **Washerwomen's Charity** | *Washerwomen's Charity* |
| `pupilles` | organization | Œuvre des Pupilles | *Œuvre des Pupilles* / *Pupilles* | **Wards' Charity** | *Wards' Charity* / *Wards* |
| `savonnerie-merande` | organization | Savonnerie Mérande | *Savonnerie Mérande* | **Mérande Soapworks** | *Mérande Soapworks* |
| `paquebots` | organization | Compagnie des Paquebots de l'Orvelle | *Compagnie des Paquebots de l'Orvelle* | **Orvelle Packet Company** | *Orvelle Packet Company* |
| `phares-et-balises` | organization | Phares et Balises | *Phares et Balises* | **Lights and Beacons** | *Lights and Beacons* |
| `opera` | organization | Opéra d'Aubrelieu | *Opéra d'Aubrelieu* | **Aubrelieu Opera** | *Aubrelieu Opera* |
| `grande-exposition` | event | Grande Exposition | *Grande Exposition* | **Grand Exhibition** | *Grand Exhibition* |
| `proces-des-papetiers` | event | Procès des Papetiers | *Procès des Papetiers* | **Papermakers' Trial** | *Papermakers' Trial* |
| `papiers-de-la-regence` | event | Papiers de la Régence | *Papiers de la Régence* | **The Regency Papers** | *Regency Papers* |
| `nuit-des-affiches` | event | Nuit des affiches | *Nuit des affiches* | **Night of the Posters** | *Night of the Posters* |
| `absents` | event | absents | *absents* / *déclarés absents* | **the absent** | *the absent* / *declared absent* |
| `adoption` | event | adoption | *adoption* / *adoption plénière* | **adoption** | *adoption* / *full adoption* |
| `exil` | event | exil | *exil* | **exile** | *exile* |
| `fougere` | object | fougère | *fougère* / *réseau Fougère* | **fern** | *fern* / *Fern network* |
| `fougere-sans-date` | object | fougère sans date | *fougère sans date* / *fougère sans millésime* | **undated fern** | *undated fern* / *fern without a year mark* |
| `filigrane` | object | filigrane | *filigrane* | **watermark** | *watermark* |
| `herbier` | object | herbier | *herbier* | **herbarium** | *herbarium* |
| `meche` | object | mèche | *mèche* | **forelock** | *forelock* |
| `registre-bleu` | object | registre bleu | *registre bleu* | **blue register** | *blue register* |
| `carnets-gris` | object | carnets gris | *carnets gris* / *carnet gris* | **grey booklets** | *grey booklets* / *grey booklet* |
| `caveau` | place | caveau Varenque | *caveau* | **Varenque vault** | *vault* |
| `visages-de-la-cote` | object | Visages de la côte | *Visages de la côte* | **Faces of the Coast** | *Faces of the Coast* |
| `la-lavandiere` | object | La Lavandière | *La Lavandière* | **The Washerwoman** | *The Washerwoman* |
| `lavandiere` | other | lavandière | *lavandière* | **washerwoman** | *washerwoman* |
| `lanterne-d-ostrie` | object | La Lanterne d'Ostrie | *Lanterne d'Ostrie* | **The Lantern of Ostrie** | *Lantern of Ostrie* |
| `acte-de-reconnaissance` | object | acte de reconnaissance | *acte de reconnaissance* | **deed of acknowledgement** | *deed of acknowledgement* |
| `automatisation` | event | automatisation du feu | *automatisation* / *automatisé* | **automation of the light** | *automation* / *automated* |
| `papetier` | other | papetier | *papetier* | **papermaker** | *papermaker* |
| `botaniste` | other | botaniste | *botaniste* | **botanist** | *botanist* |
| `capitaine` | other | capitaine | *capitaine* / *capitaine au long cours* | **captain** | *captain* / *master mariner* |
| `gardien` | other | gardien du feu | *gardien* / *gardienne* / *gardien du feu* | **keeper of the light** | *keeper* / *light keeper* / *keeper of the light* |
| `phare` | object | phare | *phare* | **lighthouse** | *lighthouse* |
| `canot-de-sauvetage` | object | canot de sauvetage | *canot de sauvetage* / *canot* | **lifeboat** | *lifeboat* / *life-boat* |
| `depute` | other | député | *député* | **Deputy** | *Deputy* |
| `blanchisseuse` | other | blanchisseuse | *blanchisseuse* | **laundress** | *laundress* |
| `affichiste` | other | affichiste | *affichiste* / *peintre-affichiste* | **poster artist** | *poster artist* / *poster painter* |
| `institutrice` | other | institutrice | *institutrice* | **schoolmistress** | *schoolmistress* |
| `receveuse` | other | receveuse des postes | *receveuse* / *receveuse des postes* | **postmistress** | *postmistress* / *post-mistress* |
| `pianiste` | other | pianiste | *pianiste* | **pianist** | *pianist* |
| `soprano` | other | soprano | *soprano* / *artiste lyrique* | **soprano** | *soprano* / *operatic artiste* |
| `commissaire-aux-registres` | other | commissaire aux Registres | *commissaire aux Registres* | **Commissioner of Registers** | *Commissioner of Registers* |
| `graveuse` | other | graveuse | *graveuse* / *graveuse de filigranes* | **engraver** | *engraver* / *watermark engraver* |
| `typographe` | other | typographe | *typographe* | **typesetter** | *typesetter* |
| `aviateur` | other | aviateur | *aviateur* | **aviator** | *aviator* |
| `costumiere` | other | costumière | *costumière* | **costume maker** | *costume maker* |
| `patron-pecheur` | other | patron pêcheur | *patron pêcheur* | **fishing skipper** | *fishing skipper* |
| `sage-femme` | other | sage-femme | *sage-femme* / *sages-femmes* | **midwife** | *midwife* / *midwives* |
| `etudiant` | other | étudiant | *étudiant* | **student** | *student* |
| `speakerine` | other | speakerine | *speakerine* | **announcer** | *announcer* |
| `photographe` | other | photographe | *photographe* | **photographer** | *photographer* |
| `restauratrice` | other | restauratrice | *restauratrice* | **conservator** | *conservator* |
| `ingenieure` | other | ingénieure | *ingénieure* | **woman engineer** | *woman engineer* |
| `journaliste` | other | journaliste | *journaliste* | **journalist** | *journalist* |

Les quatre lieux de la carte (`col-de-corvenne`, `monts-corvins`, `lac-d-aulne`,
`moulin-de-la-sorbe`) ne changent que la capitale du libellé, comme dans la prose anglaise (*the Col
de Corvenne*, glossaire §3.1) ; leurs termes sont identiques.

## 2. `hiddenTerm` : `orrin-kessvel`

Seul terme caché de l'affaire (glossaire §9.4). Le terme anglais reste *Orrin Kessvel*, et **aucune
pièce anglaise ne doit contenir la suite normalisée `orrin kessvel`**. Attention à un piège propre à
l'anglais : la ponctuation devient une espace, donc *Orrin, Kessvel's son*, *Orrin. Kessvel…* ou un
saut de ligne entre *Orrin* et *Kessvel* recréent le terme et le donnent au joueur (le contrôle 5 ne
lève qu'un avertissement). Formes permises, comme en français : *Orrin*, *Kessvel*, *O. Kessvel*,
*KESSVEL Orrin* (fiche, ordre inversé). Les mots-clés `orrin`, `kessvel` (+ *O. Kessvel*) restent
identiques.

## 3. Consignes de parité pour les traducteurs des pièces

Relevé par grep sur `documents/` et `endings/` (118 pièces). Chaque ligne est un endroit où un mot
anglais naturel créerait un lien que le français n'a pas, ou en perdrait un.

| Terme | Consigne |
|---|---|
| *woman engineer* (`ingenieure`) | Le français ne lie que **ingénieure** (7 emplois : of-05, lt-18 ×3, pr-15, ph-28 ×2), jamais *ingénieur* (12 emplois : an-03, rg-07, rg-09, rp-01, dv-02, lt-12, lt-17, pr-17). D'où le terme composé : chaque *ingénieure* → *woman engineer* (*C. Sauge, woman engineer, CVC* ; *addressed “to the woman engineer on the Reader”* ; *I am a woman engineer*), chaque *ingénieur* → *engineer* (non lié). an-03 garde *Sauge C., engineer* : le masculin de l'annuaire est voulu, il ne trahit pas le sexe. |
| *engraver* (`graveuse`) | Le français ne lie que **graveuse** (19 emplois). Les 4 *graveur* masculins ne doivent **pas** devenir *engraver* : ph-06 « vieux graveur de la maison » → *the firm's old mould-cutter* ; rp-02 « graveur de formes de métier » → *a trained mould-maker* ; lt-01 « ton graveur » → *your mould-cutter* ; f1 « le graveur de Vellaak » (plaque) → *the Vellaak letter-cutter*. |
| *the absent*, *declared absent* (`absents`) | Le français lie *absents* et *déclarés absents* (pluriels), pas *absent(e)* au singulier. Toujours *the absent* pour *les absents* / *des absents* ; au singulier, *absentee* ou une tournure : rg-03 « absent en mer » → *away at sea* ; rg-12 « avec un absent » → *with an absentee* ; ct-02 « Le retour de l'absent » → *The Absentee's Return* (pas *the Absent One*) ; lt-15 « qu'on me laisse absente » → *let them leave me absent* (pas de *the* devant). Jamais *declared absent* pour un singulier. |
| *papermaker* (`papetier`) | « ingénieur papetier » (rg-07, rg-09) est lié en français : → *engineer and papermaker* (le mot doit apparaître). *papetiers* (pluriel) → *papermakers*, non lié comme en français. |
| *captain*, *master mariner* (`capitaine`) | Chaque *capitaine* garde *captain* ou *master mariner* ; rg-03 « second capitaine au long cours » → *second master mariner* ou *first mate, master mariner* (un des deux termes doit y être). |
| *keeper* (`gardien`) | Chaque *gardien* (52) et *gardienne* (5) → *keeper* (*lighthouse keeper*, *assistant keeper* pour « gardien adjoint », *a woman keeper* pour Maaren). Aucun autre *keeper* (pas de *keeper of the archives* ; *bookkeeper* en un seul mot ne lie pas). *gardiens* (pluriel, non lié) → *keepers*. |
| *lifeboat* (`canot-de-sauvetage`) | Les 36 *canot* de l'affaire désignent tous le canot de sauvetage : → *lifeboat* partout (« patron du canot » → *lifeboat coxswain*, « abri du canot » → *lifeboat house*, « la plaque du canot » → *the lifeboat plaque*). Jamais *boat* seul pour *canot*. *life-boat* n'est qu'une variante de recherche. |
| *forelock* (`meche`) | Chaque *mèche* du texte (27) → *forelock*, y compris « mèche décolorée » (ph-16 → *bleached forelock*) et lt-15 « Une mèche, c'est une preuve » → *A forelock is proof…*. La « mèche de cheveux » de Augustin (1924) n'apparaît que dans des textes alternatifs (non liés) : *a lock of hair*. |
| *Deputy* (`depute`) | Réservé à *député*. « adjoint au maire » (rg-04, rg-06, rg-11, rg-17) → *assistant to the mayor*, jamais *deputy mayor*. *Chamber of Deputies* (pluriel) reste non lié. |
| *Wards*, *Wards' Charity* (`pupilles`) | *pupilles* (pluriel) est lié en français, *pupille* non : *wards* / *ward*. Ne jamais écrire *wards* pour autre chose (salles d'hôpital → *the hospital rooms*, *the sickbay* ; *arrondissements* au pluriel → *districts*). Le singulier *Ward* des tampons (« 1st Ward ») ne pose pas de problème. |
| *vault* (`caveau`) | Réservé au caveau Varenque ; une voûte → *arch*, *ceiling* ; pas de *bank vault*. |
| *exile* (`exil`) | Seulement là où le français dit *exil* (ph-20, lt-13, lt-17) ; *exilée* → *exiled* (non lié, comme en français). |
| *automation*, *automated* (`automatisation`) | an-04 « Feu automatisé » → *Light automated* ; ep-02 → *automated since 1972* ; ph-29 → *automation*. Nulle part ailleurs. |
| *student* (`etudiant`) | Le français n'a que *étudiant* (5). *élève* → *pupil* ; « élève du Conservatoire » → *pupil at the Conservatoire*, jamais *student*. |
| *announcer* (`speakerine`) | Réservé à *speakerine* ; pas de *radio announcer* ailleurs. |
| *conservator* (`restauratrice`) | Réservé à *restauratrice* ; « atelier de conservation » → *conservation workshop* (non lié) ; « Conservatoire » reste *Conservatoire*. |
| *washerwoman*, *The Washerwoman* (`lavandiere`, `la-lavandiere`) | Comme en français, *the washerwoman* (avec article) lie l'affiche (« la lavandière » le fait aussi) ; « une lavandière » → *a washerwoman* (lie `lavandiere`). *Washerwomen's Charity* ne lie que l'Œuvre. *laundress* reste réservé à *blanchisseuse*. |
| *Paper Mills* (`papeteries-varenque`) | *Papeteries* lie partout en français (y compris *Papeteries de l'Estuaire* → *Estuary Paper Mills*, lien identique) ; *Papeterie* singulier → *Paper Mill*, non lié. |
| *Aubrelieu Opera* (`opera`) | Seulement là où le français écrit *Opéra d'Aubrelieu* ; *l'Opéra* seul → *the Opera*. |
| *fern* (`fougere`) | Toujours *fern*, jamais *bracken* (glossaire §6.2) ; *undated fern* et *fern without a year mark* seulement là où le français écrit *fougère sans date* / *sans millésime*. |
| *watermark* (`filigrane`) | *filigranes* / *filigranés* → *watermarks* / *watermarked* (non liés des deux côtés). **Attention** : *filigrané* au masculin singulier **lie** `filigrane` en français (la normalisation retire l'accent : *filigrane*) ; dans le texte courant, il se rend donc par une tournure qui contient *watermark* (RP-03 : *paper bearing a watermark*). Dans un `alt` ou une cote (`archive:`), rien n'est lié : *watermarked* convient (DV-02, LT-15). |

Ajouts de la relecture C2 :

| Terme | Consigne |
|---|---|
| *keeper* hors phare | Le français lie aussi *gardien* quand il désigne le gardien de prison de Kessaar (RG-14, *gardien T. Haask*), CT-02 et les fins f3, f5 : l'anglais garde *keeper* à ces endroits (parité). Ce sont les seuls *keeper* hors phare permis. |
| *lise* (verbe) | Faux positif de la source (subjonctif de *lire*, qui liait `lise` dans OF-02 et DV-01) : **corrigé dans le français** en C2 (*qu'il aille au bout du dossier* ; *que cela se voie à travers le papier*) ; l'anglais n'a plus de lien explicite (*he reads the file*, *it must show through the paper*). Ne jamais réintroduire *lise* minuscule dans une pièce. |
| *Registers Bureau* | *Bureau des Registres* → *Registers Bureau* partout (pas *Registers Office* ni *Bureau of Registers*), glossaire §4.3. |
| *the Citadel* | *la Citadelle* → *the Citadel*, y compris dans les cellules de tableau. |

Glossaire (mis à jour, commit 561f7dc) : *incendie* = *blaze*, *feu* = *fire*, *grève* = *walkout*.
Cette affaire n'a pas de mot-clé *incendie* ni *grève* ; *feu* au sens du phare se rend par *the
light* (`gardien` → *keeper of the light*, `automatisation` → *automation of the light*).

## 4. Genre grammatical comme indice (glossaire §9.3)

- **Claude Sauge / C. Sauge** : prénom épicène et initiale ; le français ne dit le sexe que par
  *ingénieure* et *Mlle*. Le terme *woman engineer* le dit en anglais à chaque emploi lié ;
  *Mlle* → *Miss*. Le libellé de métier reste neutre (*Engineer*, glossaire §7.1).
- **L. Daubry, restauratrice** (of-06, rp-06) : *conservator* est neutre → *she* dans la phrase
  voisine, *Miss Lise Daubry* là où le français dit *Mlle*.
- **graveuse** (Odile) : *engraver* est neutre ; lt-08 « la seule graveuse » → *the only woman
  engraver* (lie *engraver*, garde le genre).
- **gardienne**, *tenn-vaardessa* (Maaren) : *a woman keeper (of the light)*.
- **receveuse** (Tenna) : *postmistress* (genré, comme le français).
- **La photographe de Vellaak** (titre du secret s1) : *The Photographer of Vellaak*. **Tranché en
  C2 : gardé.** Le titre ne s'affiche qu'une fois le secret trouvé, et OF-07 dit le sexe à la ligne
  suivante (*Sh  is not who you think*), comme PR-13 et LT-17.
- **Le délateur** (s5) : *The Informer* (neutre). **Tranché en C2 : gardé** (même raison).
  *informer* ≠ *informant* (déclarant des actes, glossaire §5.3).
- **Opératrice : L. D.** (DV-03) : *Operator: Miss L. D.* (C2).

## 5. Secrets, groupes, rapport, métiers, portraits

**Secrets** : `s1-photographe-de-vellaak` *The Photographer of Vellaak* · `s2-registre-bleu` *The Blue
Register* · `s3-reconnaissance-de-1917` *The Acknowledgement of 1917* (cf. *deed of acknowledgement*)
· `s4-goeland-et-albatros` *The Gull and the Albatros* · `s5-delateur` *The Informer* ·
`s6-secret-d-adelaide` *Adélaïde's Secret*.

**Groupes** (`tree.json`) : `g-fondateurs` *Prologue — The founders of Les Tilleuls* · `g-atelier`
*The Studio — the washerwoman and the poster* · `g-cap` *The Lighthouse — the people of the cape* ·
`g-heritiers` *Les Tilleuls — the heirs* · `g-tilleuls` *Les Tilleuls — the Deputy's house* ·
`g-vellaak` *The Lighthouse — the people of Vellaak* · `g-absents` *The Absent*.

**Rapport** : *Not established* pour `non-etabli`, comme le Revenant (sens de la loi des deux pièces,
compatible avec la réserve du glossaire §8). Questions : *Who denounced the Fern network?* · *Did
Odile Varenque die on Kessaar?* · *What did Gaspard Varenque do after 1944?* · *Was Victor Sauge
acknowledged by his father?* · *Who was the Albatros carrying?* · *Who organised Odile Varenque's
faked death?* · choix final *Nora Ilvess is Odile Varenque. What does the public report say?* →
*Enter her under her own name, Odile Varenque* / *Leave her absent and tell no one but Lise*. Aucun
`unavailableReason` en français, donc aucun en anglais.

**Métiers** : glossaire §7.1, à la lettre (32 libellés distincts, dont 4 leurres).

**Portraits** : 30 textes alternatifs, sans légende (le FR n'en a pas). Traits héréditaires selon le
glossaire §6.1 : *a white forelock above the forehead, on the left* ; *a slight outward squint in
his/her left eye* ; *a cleft chin* ; *a gold ring in his left ear* ; *a pale scar runs through his left
eyebrow* ; *a burn scar* au dos de la main droite. « fossette au menton » (Henriette) → *a dimple in
her chin*, distinct de *cleft chin* (comme en français). La « mèche de cheveux » d'Augustin (1924) →
*a lock of hair* (pas *forelock* : ce n'est pas la mèche Aubertot). Le goéland tatoué → *a gull*.

## 6. Écarts au glossaire et points à valider

1. **`ingenieure` → *woman engineer*** au lieu de *engineer* (§7.1, colonne « Terme EN ») : *engineer*
   seul lierait les 12 *ingénieur* masculins. Alternative écartée : garder *engineer* et réécrire
   les 12 masculins (dont *M. l'ingénieur en chef*, sans équivalent naturel).
2. **`receveuse` : *postmistress* + *post-mistress*** et **`canot-de-sauvetage` : *lifeboat* +
   *life-boat*** : le français a deux termes (forme courte et forme longue) que l'anglais rend par un
   seul mot ; la seconde est la graphie d'époque à trait d'union, pour garder le même nombre de termes
   sans ajouter de mot courant.
3. **`tante-ade` : *Aunt Adé* seul**, sans *Adé* (le glossaire §9.1 suggère « + *Adé* ») : le français
   n'a pas *Adé* comme terme, l'ajouter lierait toutes les *Ma chère Adé* des lettres. Idem
   `le-goeland` : *the Gull* + *Gull*, sans *Maask* (mot-clé distinct).
4. **`gardien`** : termes du glossaire §7.1 (*keeper*, *light keeper*, *keeper of the light*) ; le
   glossaire §9.2 cite *keeper* parmi les mots trop courants, mais le français lie déjà *gardien*
   seul : même rareté, à condition de suivre la consigne du §3.
5. **`capitaine` → *captain*** : même raisonnement (le français lie *capitaine* seul).
6. **`caveau` → *vault*** et **`pupilles` → *Wards*** : mots anglais polysémiques, sûrs seulement si
   les traducteurs suivent le §3.
