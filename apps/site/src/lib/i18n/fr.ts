/**
 * Textes du site vitrine, en français (langue source). `en.ts` doit avoir **exactement** la même
 * forme (`satisfies SiteStrings`) : une clé manquante ou en trop est une erreur de typage.
 *
 * Règles : aucun nom de personnage ni secret de l'affaire ; le titre du jeu ne se traduit pas (D3) ;
 * noms propres du monde à la lettre (docs/i18n/en/GLOSSAIRE.md §3).
 */
import type { Locale, PlaceKind } from '@arbre/contract';
import type { Rich } from './rich';

const NB = ' ';

export const fr = {
  /** `<html lang>`, `hreflang`, `inLanguage`. */
  lang: 'fr' as Locale,
  /** Nom de la langue dans sa langue (sélecteur). */
  languageName: 'Français',

  meta: {
    description:
      'L’Arbre aux absents : un jeu d’enquête généalogique en solo. Croisez archives, registres et photographies pour reconstituer l’arbre d’une famille de la Velmarche. Par CM Interactive et CM Creative Lab.',
    ogImageAlt:
      'Le bureau de l’enquêteur sous la lampe, la nuit : dossiers, photographies et un arbre généalogique à compléter, à côté du titre L’Arbre aux absents.',
    trailerTitle: 'L’Arbre aux absents · Bande-annonce',
    trailerDescription:
      'Une minute dans le bureau de l’enquêteur : le catalogue, les archives, les photographies et l’arbre qui se remplit, sur la musique du jeu.',
    /** Description de l'art clé (texte alternatif du héros et de l'artbook). */
    keyArtAlt: null as string | null,
  },

  header: {
    homeSuffix: ', accueil',
    nav: 'Navigation principale',
    menu: 'Menu',
    links: {
      'le-monde/': 'Le monde',
      'artbook/': 'Artbook',
      'charte/': 'Charte',
      'presse/': 'Presse',
      'credits/': 'Crédits',
    },
    exploreMap: 'Explorer la carte',
    /** Lien court vers `signaler/` (en-tête). */
    report: 'Signaler',
  },

  footer: {
    tagline: 'Velmarche, 1974 — un monde imaginaire',
    logos: 'Une production CARDOR Media',
    nav: 'Pied de page',
    links: {
      'le-monde/': 'Le monde',
      'artbook/': 'Artbook',
      'presse/': 'Presse',
      'charte/': 'Charte graphique',
      'credits/': 'Crédits',
      'nouveautes/': 'Nouveautés',
      'signaler/': 'Signaler un problème',
      'problemes-connus/': 'Problèmes connus',
      'tickets/': 'Tickets ouverts',
      'confidentialite/': 'Confidentialité',
    },
    legal: [
      '© 2026 CARDOR Media. « L’Arbre aux absents » est un jeu de CM Interactive, écrit et illustré par CM Creative Lab. Monde, lieux et personnages sont imaginaires.',
    ] as Rich,
  },

  brand: {
    'cardor-monogram': 'Édition',
    interactive: 'Développement et édition',
    creative: 'Écriture, illustration et carte',
  },

  common: {
    backHome: 'Retour à l’accueil',
    exploreMap: 'Explorer la carte',
    portraitSoon: 'Portrait à venir',
    plate: (n: string) => `Pl. ${n}`,
    mapTitle: 'La Velmarche',
  },

  error: {
    title: 'Erreur',
    kicker: 'Erreur',
    heading: ['Ce document ', { em: 'ne s’ouvre pas' }] as Rich,
    lede: 'Une erreur est survenue. Le reste du dossier vous attend.',
  },

  notFound: {
    title: 'Page introuvable',
    stamp: 'Introuvable',
    kicker: 'Erreur 404',
    heading: ['Cette page est ', { em: 'absente des registres' }] as Rich,
    lede: 'L’adresse demandée n’existe pas, ou plus. Le reste du dossier vous attend.',
  },

  home: {
    heroLabel: 'L’Arbre aux absents',
    kicker: 'Un jeu d’enquête généalogique',
    tagline:
      'Une famille effacée des registres. Un bureau, une lampe, et tout l’automne pour lui rendre ses noms.',
    play: 'Jouer dans le navigateur',
    exploreWorld: 'Explorer la Velmarche',
    seeArtbook: 'Voir l’artbook',
    platformsLine: 'Windows · macOS · Linux · Android',
    free: 'Gratuit · à télécharger sur itch.io',
    premise: {
      kicker: 'Le principe',
      title: ['Velmarche, ', { em: 'octobre' }, ' 1974'] as Rich,
      lede: `La Régence est tombée depuis vingt ans. Une loi nouvelle permet enfin de rendre leur nom aux «${NB}absents${NB}».`,
      office: 'Office de Réinscription civile',
      ref: 'Ordre de mission · Aubrelieu, le 7 octobre 1974',
      body: [
        `Pendant quinze ans, les bureaux de la Régence ont rayé des registres des milliers de citoyens : sans état civil, sans droits, on les appelait les «${NB}absents${NB}».`,
        'Vous êtes rapporteur à l’Office. Sur votre bureau : une succession à instruire, un arbre généalogique presque vide et des cartons d’archives.',
        'Reconstituez la famille, pièce par pièce, et comprenez ce que les papiers ont effacé.',
      ],
      sign: 'Le Directeur de l’Office',
    },
    trailer: {
      kicker: 'Bande-annonce',
      title: ['Une minute ', { em: 'sous la lampe' }] as Rich,
      play: 'Lire la bande-annonce',
      duration: '1 min',
      note: 'Vidéo hébergée sur YouTube : rien n’est chargé depuis YouTube avant que vous lanciez la lecture.',
    },
    game: {
      kicker: 'Le jeu',
      title: ['Six gestes ', { em: 'd’archiviste' }] as Rich,
      features: [
        {
          kicker: 'Reconstituer',
          title: 'Un arbre sur quatre générations',
          text: 'Une trentaine de cases à remplir : prénom, nom, visage et métier. Chaque nom se gagne pièce par pièce.',
        },
        {
          kicker: 'Fouiller',
          title: 'Des archives qui se contredisent',
          text: 'Lettres, registres, coupures de presse, annuaires, photographies sans légende : croisez-les, surlignez, épinglez.',
        },
        {
          kicker: 'Voyager',
          title: 'La carte de la Velmarche',
          text: 'Une carte gravée et aquarellée du pays : chaque lieu ouvre ses archives, du port de pêche à la capitale.',
        },
        {
          kicker: 'Interroger',
          title: 'Un catalogue qui répond aux mots-clés',
          text: 'Le meuble à fiches de l’Office : tapez un nom, un lieu, une date, et tirez le tiroir.',
        },
        {
          kicker: 'Établir',
          title: 'Des réponses validées par groupes',
          text: `Impossible de deviner au hasard : une branche ne se tamponne «${NB}Établi${NB}» que lorsqu’elle tient entière.`,
        },
        {
          kicker: 'Déduire',
          title: 'Une enquête sans rail',
          text: 'Aucun ordre imposé : vous tirez le fil que vous voulez. Plusieurs fins selon les secrets mis au jour.',
        },
      ],
    },
    world: {
      kicker: 'Le monde',
      title: ['Un pays qui ', { em: 'n’existe pas' }] as Rich,
      lede: 'La vallée de l’Orvelle et sa capitale Aubrelieu, les fjords de l’Ostrie, le golfe d’Ambre, les monts Corvins. Chaque lieu, dans le jeu, ouvre ses propres archives.',
      open: 'Ouvrir la carte interactive',
      mapLabel:
        'Carte de la Velmarche, gravure rehaussée d’aquarelle : la vallée de l’Orvelle et sa capitale Aubrelieu au centre, l’Ostrie et ses fjords au nord, le golfe d’Ambre à l’ouest, les monts Corvins au sud-est.',
      credit: 'Dressée et gravée par CM Creative Lab.',
    },
    faces: {
      kicker: 'Les visages',
      title: ['Des portraits ', { em: 'à reconnaître' }] as Rich,
      lede: 'Chacun a sa silhouette, son accessoire, sa couleur. Sur une photo de groupe ou au dos d’une carte postale, à vous de le retrouver.',
      more: 'Toutes les planches de l’artbook',
    },
    platforms: {
      label: 'Plateformes',
      title: 'Plateformes',
      lede: ['Sur ordinateur, sur téléphone et dans le navigateur. Gratuit, sur '] as Rich,
      ledeEnd: '.',
      available: 'Disponible',
      browser: 'Navigateur',
      playHere: 'Jouer ici',
      itchTitle: 'L’Arbre aux absents sur itch.io',
      note: 'Jeu en français et en anglais, en solo : trois affaires de quatre à dix heures chacune. Gratuit.',
    },
    shots: {
      kicker: 'Captures',
      title: ['Le bureau ', { em: 'de l’enquêteur' }] as Rich,
      soon: 'Capture à venir',
      items: ['L’arbre et le lecteur d’archives', 'La carte et ses lieux', 'Le carnet d’enquête'],
    },
  },

  /** Les affaires (accueil, presse) : situation de départ seulement, même ordre que `SITE_CASES`. */
  cases: {
    kicker: 'Les affaires',
    title: ['Trois dossiers ', { em: 'sur le bureau' }] as Rich,
    lede: 'Trois affaires indépendantes, chacune avec son arbre, ses archives et ses fins. Elles se jouent seules, dans l’ordre que vous voulez.',
    listLabel: 'Les affaires du jeu',
    tab: (n: number) => `Affaire ${n}`,
    file: (n: string) => `Dossier ${n}`,
    newLabel: (version: string) => `Nouveau · ${version}`,
    stats: (slots: number, documents: number, endings: number) =>
      `${slots}${NB}cases · ${documents}${NB}pièces · ${endings}${NB}fins`,
    items: [
      {
        title: 'Succession Varenque',
        when: 'Moulinvert, octobre 1974',
        text: `Une vieille institutrice lègue tout aux descendants de son père et de son oncle, et demande à l’État de réinscrire «${NB}ceux que nous avons rendus absents${NB}». Une famille de papetiers à reconstituer sur quatre générations.`,
        duration: 'De six à dix heures',
      },
      {
        title: 'Le Revenant de Hautcorvin',
        when: 'Hautcorvin, février 1976',
        text: 'Un vieil homme se présente au guichet de l’Office : il dit être le fils du maître verrier, radié des registres en 1938 et déclaré mort au bagne. Sa case de l’arbre est déjà remplie, d’après sa propre déclaration. À vous de dire ce qui tient.',
        duration: 'De cinq à sept heures et demie',
      },
      {
        title: 'Les Marques de Longuegrève',
        when: 'Golfe d’Ambre, octobre 1977',
        text: `Une île de pêcheurs évacuée en 1908, ses maisons brûlées «${NB}par mesure sanitaire${NB}» avec le registre de la chapelle. Personne n’y savait signer : chacun taillait sa marque au couteau. Pour ces insulaires, la case de l’arbre retient la marque au lieu du visage.`,
        duration: 'De quatre à sept heures',
      },
    ],
  },

  world: {
    seoTitle: 'Le monde',
    seoDescription:
      'La Velmarche, petit pays imaginaire entre mer Grise et monts Corvins : sa carte gravée et aquarellée, son histoire, ses langues et ses lieux.',
    kicker: 'Le monde',
    title: ['La ', { em: 'Velmarche' }] as Rich,
    lede: 'Un petit pays de vallée et de côtes, inventé pour le jeu : la vallée de l’Orvelle et sa capitale Aubrelieu au centre, le plateau et les fjords de l’Ostrie au nord, le golfe d’Ambre à l’ouest et, au sud-est, les monts Corvins qui le séparent de la Thalberie.',
    mapHeading: 'Carte interactive',
    mapKeys:
      'Flèches : se déplacer · + et − : zoomer · 0 : vue d’ensemble · Tab : passer de lieu en lieu. Au doigt : glisser, pincer, toucher un lieu.',
    history: {
      kicker: 'Histoire',
      title: ['Sept siècles ', { em: 'en quelques dates' }] as Rich,
      lede: 'Un Grand-Duché devenu République, une Régence de quinze ans qui effaçait les gens des registres, et une loi qui, en 1973, promet de les y réinscrire.',
      register: 'Registre chronologique · Archives d’Aubrelieu',
      events: [
        { date: '1214', text: 'Fondation d’Aubrelieu, ville-pont sur l’Orvelle.' },
        { date: '1488', text: 'Les seigneuries de la vallée forment le duché de Velmarche.' },
        {
          date: '1602',
          text: 'Traité de Vellaak : l’Ostrie, au nord, est rattachée à la Velmarche.',
        },
        {
          date: '1811',
          text: 'Charte de Velmarche : Grand-Duché constitutionnel et création de l’état civil communal.',
        },
        { date: '1848', text: 'Liberté de la presse ; fondation du Courrier d’Aubrelieu.' },
        {
          date: '1889',
          text: 'Grande Exposition d’Aubrelieu : le pays se montre moderne, verre, papier, savon et navires.',
        },
        {
          date: '1916–1919',
          text: 'Guerre des Cols contre la Thalberie voisine, pour le col de Corvenne.',
        },
        { date: '1929', text: 'Krach de la banque Sorbelle, la plus vieille du pays.' },
        {
          date: '1937',
          text: 'Coup d’État du général Destrade : le Grand-Duc abdique, la Régence commence.',
        },
        {
          date: '1938',
          text: `Loi sur la pureté des registres : des citoyens sont radiés de l’état civil et déclarés «${NB}absents${NB}».`,
        },
        { date: '1952', text: 'Journées d’avril : soulèvement d’Aubrelieu et fin de la Régence.' },
        { date: '1953', text: 'Constitution de la République.' },
        {
          date: '1973',
          text: 'Loi de réinscription civile : un Office est chargé de rendre leur nom aux absents.',
        },
        { date: '1974', text: 'Octobre. Une succession arrive sur votre bureau.' },
      ],
    },
    languages: {
      kicker: 'Langues',
      title: ['Trois langues, ', { em: 'une carte' }] as Rich,
      prose: [
        [
          'Le ',
          { strong: 'velmarchois' },
          `, langue officielle, est rendu en français dans le jeu, avec ses tournures d’époque : la «${NB}maison commune${NB}» des vieux actes, la lieue, le florin.`,
        ],
        [
          'Au nord, l’',
          { strong: 'ostrien' },
          ' a ses voyelles doublées et ses noms de lieux qui se lisent comme des paysages ; le nom d’une femme y prend le suffixe ',
          { em: '-essa' },
          '. Plus loin, la ',
          { strong: 'Thalberie' },
          ' parle une langue étrangère, aux noms en ',
          { em: '-in' },
          ' et ',
          { em: '-ko' },
          '.',
        ],
      ] as Rich[],
      lexiconTitle: 'Petit lexique ostrien',
      lexicon: [
        ['vel', 'mer'],
        ['tenn', 'feu, lumière'],
        ['ok', 'cap, pointe'],
        ['laak', 'abri, eau calme'],
        ['kess', 'pierre'],
        ['aar', 'île'],
        ['vik', 'baie'],
        ['taalik', 'messager'],
      ] as [string, string][],
      lexiconNote: [
        'D’où ',
        { em: 'Tennok' },
        `, «${NB}cap du feu${NB}», et `,
        { em: 'Kessaar' },
        `, «${NB}île de pierre${NB}».`,
      ] as Rich,
    },
    places: {
      kicker: 'Lieux',
      title: ['Les lieux ', { em: 'de la carte' }] as Rich,
      lede: 'D’ouest en est. Chacun, dans le jeu, ouvre ses propres archives.',
      empty: 'Les lieux de la carte seront bientôt décrits ici.',
    },
  },

  /** Carte interactive (page « Le monde », hydratée). */
  map: {
    label: 'Carte interactive de la Velmarche',
    failed: 'La carte n’a pas pu se charger. La liste des lieux, plus bas, reste disponible.',
    retry: 'Réessayer',
    loading: 'Chargement de la carte',
    noscript: 'La carte interactive demande JavaScript. La liste des lieux, plus bas, la remplace.',
    selected: 'Lieu choisi',
    hint: 'Choisissez un lieu sur la carte, à la souris, au doigt ou au clavier (Tab, puis les flèches pour passer d’un lieu à son voisin).',
    /** Textes de `MapView` (@arbre/map, `MapStrings`) : ceux du paquet en français. */
    view: {
      instructions:
        'Flèches pour vous déplacer, plus et moins pour zoomer, zéro pour revoir toute la carte, Tab pour parcourir les lieux et Entrée pour ouvrir un lieu.',
      hint: 'Flèches : se déplacer · + / − : zoomer · 0 : vue d’ensemble · Tab : lieux',
      zoomIn: 'Zoomer',
      zoomOut: 'Dézoomer',
      overview: 'Vue d’ensemble',
      controls: 'Zoom de la carte',
      states: { mentioned: 'mentionné', open: 'ouvert', exhausted: 'tout consulté' },
    },
  },

  /** Types de lieux (glossaire §8). */
  placeKinds: {
    region: 'Région',
    city: 'Ville',
    village: 'Village',
    building: 'Édifice',
    landmark: 'Lieu-dit',
    sea: 'Mer',
    mountain: 'Montagnes',
    river: 'Cours d’eau',
  } satisfies Record<PlaceKind, string>,

  /** Descriptions du site qui remplacent celles du contenu (aucun indice sur l'affaire). */
  placeNotes: {
    vellaak:
      'Village de pêcheurs au fond d’un fjord ostrien : port, séchoirs à poisson, et la rédaction du journal bilingue Vel Taalik.',
    grisenoue: 'Bourg des marais, au nord d’Aubrelieu : roselières, brumes et ruines calcinées.',
  } as Record<string, string>,

  /** Planches de portraits : légende et texte alternatif, par numéro de planche. */
  portraits: null as Record<string, { caption: string; alt: string }> | null,

  artbook: {
    seoTitle: 'Artbook',
    seoDescription:
      'Les planches de L’Arbre aux absents : l’art clé, les vignettes d’aquarelle, les portraits gravés, les détails de la carte de la Velmarche, et l’intention artistique du jeu.',
    kicker: 'Artbook',
    title: ['Gravure ', { em: 'et aquarelle' }] as Rich,
    lede: 'Un trait d’encre bleu-noir gravé, des hachures pour le volume, puis quelques lavis transparents posés par un coloriste. Toute l’illustration du jeu suit ce procédé ancien, dans une interface nette et contemporaine.',
    keyArtHeading: 'L’art clé',
    enlargeKeyArt: 'Agrandir l’art clé',
    keyArtTitle: '« Le bureau sous la lampe »',
    keyArtCaption: 'Art clé, 16:9 et 4:5 recomposé pour le téléphone. Écran titre du jeu.',
    intention: {
      kicker: 'Intention',
      title: [`«${NB}Le bureau `, { em: 'sous la lampe' }, `${NB}»`] as Rich,
      prose: [
        [
          'Il est tard. Sur un bureau d’enquêteur plongé dans le bleu de la nuit, une lampe de laiton éclaire des archives : lettres, registres, photographies, une carte dépliée. Tout ce qui se lit est du papier dans la lumière ; tout ce qui sert d’outil reste dans l’ombre, net et discret.',
        ],
        [
          'L’illustration est une ',
          { strong: 'taille-douce à l’encre ferro-gallique' },
          ', rehaussée d’',
          { strong: 'aquarelle' },
          '. Le trait hiérarchise : contours appuyés, détails plus fins, ombres et courbes de niveau à peine posées. Les lavis restent transparents, jamais plus de deux couches, et débordent un peu du trait, comme la main d’un coloriste.',
        ],
        [
          'Les portraits sont des bustes de trois-quarts, reconnaissables en vignette comme en grand : chaque personne a sa silhouette de coiffure, son accessoire et sa couleur de vêtement.',
        ],
      ] as Rich[],
    },
    spots: {
      kicker: 'Vignettes',
      title: ['Les objets ', { em: 'du bureau' }] as Rich,
      lede: 'Dix vignettes peintes pour l’interface : chacune ouvre un geste du jeu, sur une tache de lavis.',
      enlarge: (title: string) => `Agrandir : ${title}`,
      names: {
        tree: 'L’arbre aux médaillons',
        archives: 'Le carton d’archives',
        lighthouse: 'Le phare de Tennok',
        catalogue: 'Le meuble à fiches',
        letter: 'La lettre à la fougère',
        stamp: 'Le tampon de bois',
        magnifier: 'La loupe',
        register: 'Le registre cadenassé',
        'map-pin': 'La carte épinglée',
        fern: 'La fougère d’herbier',
      },
    },
    portraits: {
      kicker: 'Portraits',
      title: ['Galerie ', { em: 'des visages' }] as Rich,
      lede: 'Quelques planches parmi la centaine de portraits du jeu. Les noms restent dans les archives : à vous de les y retrouver.',
      empty: 'Les portraits arrivent bientôt.',
    },
    longuegreve: {
      kicker: 'Affaire 3',
      title: ['Les Marques ', { em: 'de Longuegrève' }] as Rich,
      lede: 'Une île longue et basse du golfe d’Ambre, vide depuis 1908. Ses habitants ne savaient pas signer : sur les registres, les avirons, les linteaux et les croix, chacun taillait sa marque. Pour eux, l’arbre retient la marque au lieu du visage.',
      island: {
        title: 'L’île sur la carte',
        text: 'Au large du golfe d’Ambre, à quatre lieues et demie des Cabanes : la Longue Grève, plage de l’ambre, et quelques ruines sous les sternes.',
        label: 'Détail de la carte : l’île de Longuegrève dans le golfe d’Ambre',
      },
      marks: {
        title: 'La planche des marques',
        text: 'Les marques des quatre chefs de maison, telles que la matrice cadastrale de 1868 les a reçues, relevées au carnet comme le fait l’enquêtrice de 1964. Toutes les autres se déduisent de leur grammaire, en jeu.',
        listLabel: 'Les quatre marques des chefs de maison',
        /** Description verbale normalisée (AFFAIRE-3 §1.6), même gabarit que le jeu. */
        alts: [
          'Fourche ; pied lisse',
          'Œil ; pied lisse',
          'Flèche ; pied lisse',
          'Potence ; pied lisse',
        ],
        cote: (n: number) => `Lanière ${n}`,
      },
      pieces: {
        title: 'Quelques pièces',
        text: 'Des illustrations des archives de l’affaire : objets, imprimés et photographies, sans rien dévoiler de l’enquête.',
        items: {
          'cp-01': {
            title: 'La grève aux ambres',
            caption: 'Carte postale, phototypie, 1906.',
          },
          'ob-03': {
            title: 'La cloche de l’île',
            caption: 'Bronze fondu en 1868, quatre signes en relief.',
          },
          'pb-01': {
            title: 'L’Ambre de Longuegrève',
            caption: 'Affiche lithographiée, 1910.',
          },
          'ph-11': {
            title: 'Baguage de sternes',
            caption: 'Photographie, été 1961.',
          },
        },
      },
    },
    map: {
      kicker: 'La carte',
      title: ['Détails ', { em: 'de la Velmarche' }] as Rich,
      lede: 'Une seule grande planche, découpée en couches : fond, relief, eaux, lieux et toponymes. Dans le jeu, chaque lieu s’éclaire quand on le visite.',
      detailLabel: (title: string) => `Détail de la carte : ${title}`,
      empty: 'Les planches de la carte arrivent bientôt.',
      note: 'Les autres illustrations des documents (photographies, cartes postales, coupures de presse) restent dans les archives du jeu.',
      details: {
        cartouche: {
          title: 'Le cartouche',
          text: 'Double filet, titre en capitales, mention du graveur : la carte se présente comme un document officiel de 1974.',
        },
        rose: {
          title: 'La rose des vents',
          text: 'Cercles à la plume, aiguille pleine au nord : le seul ornement de la marge ouest.',
        },
        tennok: {
          title: 'Le cap de Tennok',
          text: 'Un phare blanc à bande rouge sur la pointe nord-ouest, et les courbes de niveau de la mer Grise.',
        },
        aubrelieu: {
          title: 'Aubrelieu',
          text: 'La capitale en vignette : dôme, remparts et toits au lavis carmin, l’Orvelle en ruban céladon.',
        },
        moulinvert: {
          title: 'La Clairette et le lac d’Aulne',
          text: 'Cheminées, roues à aubes et un lac aux eaux claires : la vallée de la Clairette au pied des collines.',
        },
        corvins: {
          title: 'Les monts Corvins',
          text: 'Le relief est gravé à la hachure, la frontière thalbère tracée en lavis carmin.',
        },
      },
    },
  },

  charte: {
    seoTitle: 'Charte graphique',
    seoDescription:
      'La charte graphique de L’Arbre aux absents pour la presse et les partenaires : titre du jeu, palette, typographies, matières, icônes, mouvement, illustration, règles d’usage et ressources.',
    kicker: 'Charte graphique',
    title: ['Le dossier ', { em: 'vivant' }] as Rich,
    lede: [
      'Pour la presse et les partenaires : comment présenter ',
      { em: 'L’Arbre aux absents' },
      '. Un bureau d’enquêteur la nuit, du papier sous la lampe, des gestes d’archiviste. Toutes les valeurs de cette page sont lues dans le système de design du jeu.',
    ] as Rich,
    logo: {
      kicker: 'Titre',
      title: ['Le titre ', { em: 'du jeu' }] as Rich,
      lede: `Fraunces noir, «${NB}absents${NB}» en italique vermillon, une volute de fougère. Trois tailles : affiche, écran titre, en-tête.`,
      posterLabel: 'Titre du jeu, taille affiche',
      posterKicker: 'Un jeu d’enquête généalogique',
      posterCaption: 'Affiche, sur la nuit du bureau (usage principal)',
      titleLabel: 'Titre du jeu, taille écran titre',
      titleCaption: 'Écran titre, sur papier',
      headerLabel: 'Titre du jeu, taille en-tête, et emblème',
      headerCaption: 'En-tête et emblème : icône, avatar, favicon',
    },
    palette: {
      kicker: 'Couleurs',
      title: ['Palette ', { em: 'd’encre et de papier' }] as Rich,
      lede: 'Valeurs en OKLCH (source) et leur équivalent hexadécimal approché, pour l’impression et les outils qui n’en ont pas.',
    },
    type: {
      kicker: 'Typographie',
      title: ['Sept polices ', { em: 'libres' }] as Rich,
      lede: 'Toutes sous licence SIL Open Font License, auto-hébergées. Aucune police pixel art.',
      fonts: {
        '--font-display': {
          role: 'Titrage d’affiche, « old style » aux axes doux et bancals',
          sample: 'Une famille effacée des registres.',
        },
        '--font-label': {
          role: 'Étiquettes, onglets, boutons, tampons (capitales)',
          sample: 'ORC 74 · DIFFUSION · ARCHIVES',
        },
        '--font-read': {
          role: 'Lecture : documents imprimés, textes longs',
          sample: 'Reconstituez l’arbre d’une famille, pièce par pièce.',
        },
        '--font-ui': {
          role: 'Interface : panneaux, navigation, réglages',
          sample: 'Archives · Carnet · Carte · 12 / 30 identifiés',
        },
        '--font-type': {
          role: 'Machine à écrire : rapports, télégrammes, fiches',
          sample: 'OFFICE DE RÉINSCRIPTION CIVILE — DOSSIER N° 74-0112',
        },
        '--font-hand': {
          role: 'Manuscrit : lettres, dos de photographies (remplaçable)',
          sample: 'Bons baisers des Bains-de-Mérande…',
        },
        '--font-legible': {
          role: 'Option de lisibilité du jeu',
          sample: 'Une police pensée pour la lecture facile.',
        },
      },
    },
    materials: {
      kicker: 'Matières',
      title: ['Le bureau ', { em: 'en matières' }] as Rich,
      lede: `Rien n’est une «${NB}carte${NB}» abstraite : chaque surface est un objet du bureau, posé, épinglé, scotché.`,
      sheet: 'La feuille',
      sheetCaption: 'Papier, bords droits, déchirés ou perforés ; ruban, trombone, punaise.',
      folder: 'La chemise',
      folderNote: 'Kraft ou manille, une cote à l’étiqueteuse, un onglet.',
      card: 'La fiche',
      cardNote: 'Bristol, réglure bleue, ligne de tête vermillon.',
      dymo: 'Étiqueteuse',
      dymoRed: 'Annonce',
      tape: 'Ruban adhésif',
      stamp: 'Établi',
      stampLabel: `Tampon «${NB}Établi${NB}»`,
      stampCaption: 'Le tampon violet marque ce que le joueur a établi.',
    },
    icons: {
      kicker: 'Icônes',
      title: ['Encrées ', { em: 'à la plume' }] as Rich,
      lede: 'Un tracé principal irrégulier, un second passage d’encre fin, et parfois un lavis d’aquarelle derrière. Les mêmes formes, nettes, sous 14 pixels.',
      names: {
        tree: 'Arbre',
        archives: 'Archives',
        reader: 'Lecteur',
        catalog: 'Catalogue',
        notebook: 'Carnet',
        map: 'Carte',
        pinboard: 'Tableau',
        faces: 'Visages',
        search: 'Chercher',
        stamp: 'Tampon',
        lamp: 'Lampe',
        quill: 'Plume',
        envelope: 'Lettre',
        photo: 'Photo',
        compass: 'Boussole',
        typewriter: 'Machine',
        fern: 'Fougère',
        lock: 'Verrou',
      },
      ornaments: 'Ornements',
      ornamentNames: {
        corner: 'Coin',
        fern: 'Fougère',
        divider: 'Filet',
        seal: 'Sceau',
        clip: 'Trombone',
        pin: 'Punaise',
        flourish: 'Volute',
      } as Record<string, string>,
    },
    motion: {
      kicker: 'Mouvement',
      title: ['Des gestes ', { em: 'd’archiviste' }] as Rich,
      lede: 'Tout bouge comme du papier dans une main : on distribue, on pose, on encre, on tamponne. Courbes douces, rebond léger, jamais de rebond de dessin animé. En mouvement réduit, tout apparaît en fondu, et l’ambiance se fige.',
      card: (n: number) => `N° ${n}`,
      deal: { name: 'Distribuer', text: 'Les fiches arrivent en cascade et se calent de biais.' },
      ink: { name: 'Encrer', text: 'Le trait se dépose de gauche à droite, l’encre sèche.' },
      stamp: { name: 'Tamponner', text: 'Le tampon frappe, l’encre s’étale, la case encaisse.' },
      sway: { name: 'Respirer', text: 'Une feuille épinglée se balance, la lampe vacille.' },
    },
    illustration: {
      kicker: 'Illustration',
      title: ['Gravure ', { em: 'rehaussée d’aquarelle' }] as Rich,
      text: 'Un trait d’encre ferro-gallique bleu-noir, des hachures pour le volume, puis des lavis transparents qui débordent un peu, comme la main d’un coloriste. Les documents du jeu sont du papier dans la lumière ; l’interface autour reste sombre, nette et discrète.',
    },
    usage: {
      kicker: 'Usage',
      title: ['À faire, ', { em: 'à éviter' }] as Rich,
      do: 'À faire',
      dont: 'À éviter',
      dos: [
        'Le titre du jeu sur la nuit du bureau, en vélin et vermillon, ou sur papier, à l’encre.',
        'Sur l’art clé, seulement dans sa zone calme, sur le voile prévu.',
        'Les illustrations sur leur papier, sans recadrage qui coupe un visage.',
        'Le safran pour une seule action par écran ; le vermillon pour la marque.',
      ],
      donts: [
        'Recolorer le titre, le déformer ou lui ajouter une ombre ou un contour.',
        'Poser le titre sur une illustration chargée ou sur la carte.',
        'Employer une police pixel art ou une typographie de fantaisie.',
        'Révéler un nom, un secret ou une fin de l’enquête dans une communication.',
      ],
    },
    partners: {
      kicker: 'Signature',
      title: ['Logos ', { em: 'de la maison' }] as Rich,
      lede: 'Dans cet ordre, sur une même ligne de base : CARDOR Media, CM Interactive, CM Creative Lab. Monochromes sur le site et dans le jeu ; couleurs d’origine ci-dessous, pour la presse.',
    },
    downloads: {
      kicker: 'Ressources',
      title: ['À ', { em: 'télécharger' }] as Rich,
      logo: (name: string) => `Logo ${name}`,
      logoDetail: 'SVG, couleurs d’origine',
      titleEmblem: 'Titre du jeu et emblème',
      titleEmblemDetail: 'SVG et PNG, quatre teintes',
      posters: 'Affiches et bannières',
      postersDetail: 'PDF A3, PNG, JPEG',
      documents: 'Artbook et fiche presse',
      documentsDetail: 'PDF',
      captures: 'Captures d’écran',
      capturesDetail: 'PNG, 1440 px',
    },
  },

  presse: {
    seoTitle: 'Presse',
    seoDescription:
      'Dossier de presse de L’Arbre aux absents : fiche technique, présentation courte et longue, contact.',
    kicker: 'Presse',
    title: ['Dossier ', { em: 'de presse' }] as Rich,
    lede: [
      'Tout ce qu’il faut pour présenter le jeu. Les éléments visuels et leurs règles d’usage sont sur la ',
      { link: 'charte/', text: 'charte graphique' },
      ', les planches dans l’',
      { link: 'artbook/', text: 'artbook' },
      '.',
    ] as Rich,
    oneLine: 'En une phrase',
    pitch: [
      'Un jeu d’enquête généalogique en solo : reconstituez l’arbre d’une famille sur quatre générations en croisant lettres, registres, photographies et coupures de presse, dans un pays imaginaire, ',
      { em: 'la Velmarche' },
      '.',
    ] as Rich,
    factsLabel: 'Fiche et présentation',
    factSheet: 'Fiche technique',
    /** `null` : `PRESS_FACTS` de lib/content/press.ts (source du kit presse). */
    facts: null as { term: string; value: string }[] | null,
    download: 'Téléchargement',
    presentation: 'Présentation',
    long: [
      [
        `Velmarche, octobre 1974. Vingt ans après la chute de la Régence, qui rayait des registres les citoyens jugés indésirables, une loi permet enfin de réinscrire ceux qu’on appelait les «${NB}absents${NB}». Rapporteur à l’Office de Réinscription civile, le joueur reçoit une succession à instruire : un arbre généalogique presque vide et des cartons d’archives.`,
      ],
      [
        'Lettres, actes, photographies de groupe, annuaires, cartes postales, articles de presse et un lecteur de fiches d’époque qui répond aux mots-clés : rien n’est imposé dans l’ordre. Le joueur tire le fil qu’il veut, note, épingle et recoupe, puis remplit chaque case de l’arbre (nom, visage, métier). Les réponses ne se valident que par groupes : on ne devine pas, on déduit.',
      ],
      [
        'Une carte gravée et aquarellée du pays ouvre les archives de chaque lieu. Des secrets annexes changent le dénouement ; succès et mode chronométré invitent à rejouer.',
      ],
      [
        'Trois affaires indépendantes se jouent dans l’ordre qu’on veut : une succession de papetiers en 1974, un revenant chez les verriers en 1976 et, depuis la version 1.5, une île de pêcheurs évacuée en 1908, où personne ne savait signer et où l’arbre retient les marques taillées au couteau au lieu des visages.',
      ],
      [
        { em: 'L’Arbre aux absents' },
        ' est développé par CM Interactive, écrit et illustré par CM Creative Lab, et édité par CARDOR Media.',
      ],
    ] as Rich[],
    contact: 'Contact presse',
    contactText:
      'Le jeu est gratuit sur itch.io : aucune clé n’est nécessaire pour le tester. Le contact presse sera publié ici prochainement.',
    contactStamp: 'À venir',
    kitButton: 'Kit presse',
    charteButton: 'Charte graphique',
    kit: {
      kicker: 'À télécharger',
      title: ['Le kit ', { em: 'presse' }] as Rich,
      lede: [
        'Logos, affiches, bannières, artbook et fiche, tirés de l’art du jeu et de son système de design. Libres d’usage pour parler du jeu, dans le respect de la ',
        { link: 'charte/', text: 'charte' },
        ' : aucun nom, secret ni dénouement de l’enquête.',
      ] as Rich,
      all: 'Tout télécharger',
      zip: (size: string) => `ZIP, ${size}`,
      captures: 'Captures d’écran',
      capturesIntro: 'Le jeu en 1440 pixels de large, et la couverture de la page itch.io.',
      /** Note sous le kit dans les autres langues (fichiers en français). */
      filesNote: null as string | null,
    },
  },

  credits: {
    seoTitle: 'Crédits',
    seoDescription:
      'Crédits de L’Arbre aux absents : CARDOR Media, CM Interactive et CM Creative Lab, polices et outils libres.',
    kicker: 'Crédits',
    title: ['Une production ', { em: 'CARDOR Media' }] as Rich,
    lede: [
      'Une conception de ',
      { strong: 'Nicolas Dessenius' },
      '. ',
      { em: 'L’Arbre aux absents' },
      ' est écrit, dessiné et développé par les divisions de CARDOR Media.',
    ] as Rich,
    houseHeading: 'La maison',
    house:
      'CARDOR Media réunit des studios de création : jeux, écriture, illustration. Chaque division signe ici sa part du travail.',
    divisions: {
      'cardor-monogram': ['Édition', 'Production'],
      interactive: [
        'Développement du jeu',
        'Game design et level design',
        'Interface et système de design',
        'Site vitrine',
      ],
      creative: [
        'Scénario et monde de la Velmarche',
        'Documents d’archives',
        'Portraits et illustrations',
        'Carte gravée et aquarellée',
      ],
    },
    fonts: {
      kicker: 'Polices',
      title: ['Sept dessins ', { em: 'de lettres' }] as Rich,
      lede: 'Sous licence SIL Open Font License 1.1, merci à leurs auteurs.',
      roles: {
        Fraunces: 'Titrage',
        Oswald: 'Étiquettes et onglets',
        Literata: 'Lecture des documents',
        'Instrument Sans': 'Interface',
        'Courier Prime': 'Machine à écrire',
        Caveat: 'Écriture à la main',
        'Atkinson Hyperlegible Next': 'Option de lisibilité',
      },
    },
    tools: {
      kicker: 'Outils libres',
      title: ['Faits ', { em: 'avec' }] as Rich,
      lede: 'Le jeu et ce site reposent sur des logiciels libres.',
      list: ['Svelte et SvelteKit', 'Vite', 'Tauri', 'TypeScript', 'zod', 'svgo'],
    },
    notice: {
      title: 'Avertissement',
      text: 'La Velmarche, ses villes, ses institutions, ses journaux et ses habitants sont imaginaires. Toute ressemblance avec des personnes ou des lieux existants serait fortuite.',
      stamp: 'Fiction',
    },
  },

  /** Palette de la charte : familles et nuanciers (DESIGN §3 et §10.3), par token. */
  /**
   * Signalement (lot B4, ARCHITECTURE §8, DESIGN §13.8 et §14.6). Les pages hydratées reçoivent
   * ces sections par leur `load` : textes seulement (gabarits `{n}`, aucune fonction).
   */
  reportCategories: {
    bug: 'Quelque chose ne marche pas',
    blocked: 'Je suis bloqué dans l’enquête',
    text: 'Faute ou texte incorrect',
    display: 'Problème d’affichage',
    audio: 'Problème de son',
    controls: 'Commandes, clavier ou manette',
    performance: 'Lenteur ou plantage',
    other: 'Autre chose',
  },

  report: {
    seoTitle: 'Signaler un problème',
    seoDescription:
      'Un bug, un blocage, une faute dans L’Arbre aux absents ? Signalez-le à l’équipe et suivez son traitement sans créer de compte.',
    kicker: 'Formulaire de signalement',
    title: 'Signaler un problème',
    lede: 'Un bug, un blocage, une faute ? Décrivez-le : l’équipe le lit, et vous suivez son traitement sans compte.',
    noscript:
      'Ce formulaire a besoin de JavaScript. Vous pouvez aussi signaler le problème sur le forum itch.io du jeu :',
    forum: 'Forum itch.io',
    fromGame:
      'Depuis le jeu, passez plutôt par « Signaler un problème » (écran titre, pause ou aide) : il joint la version et l’affaire en cours.',
    categoryLabel: 'Catégorie',
    descriptionLabel: 'Description',
    descriptionHint: 'Au moins 20 caractères. Ce que vous faisiez, ce que vous attendiez.',
    descriptionMissing: 'Encore {n} caractères avant de pouvoir envoyer.',
    contactLabel: 'Contact (facultatif)',
    contactHint: 'Jamais publié. Seulement pour vous répondre.',
    contactPrivacy: [
      'Adresse e-mail ou pseudo itch.io. Gardé sur notre serveur, jamais envoyé à GitHub, effacé 30 jours après la clôture du ticket. ',
      { link: 'confidentialite/', text: 'Confidentialité' },
    ] as Rich,
    honeypot: 'Site web (laisser vide)',
    gameVersionLabel: 'Version du jeu (facultatif)',
    gameVersionHint:
      'Dans le jeu : « Signaler un problème », rubrique « Informations envoyées avec le signalement » (la dernière est {version}). Laissez vide si vous ne savez pas.',
    gameVersionInvalid: 'Format attendu : trois nombres séparés par des points, comme {version}.',
    gamePlatformLabel: 'Plateforme du jeu (facultatif)',
    gamePlatforms: {
      unknown: 'Je ne sais pas',
      web: 'Navigateur (itch.io ou ce site)',
      desktop: 'Ordinateur (Windows, macOS, Linux)',
      android: 'Android',
    },
    sentInfo: {
      title: 'Informations envoyées avec le signalement',
      gameVersion: 'Version du jeu',
      gamePlatform: 'Plateforme du jeu',
      os: 'Système',
      browser: 'Navigateur',
      language: 'Langue',
      screen: 'Fenêtre',
      unknown: 'Inconnu',
      unset: 'Non précisée',
    },
    attachmentsBusy: 'Envoi des captures en cours : patientez un instant.',
    previewSummary: 'Voir exactement ce qui sera envoyé',
    previewLine: 'Version {version} · site · {language} · fenêtre {w} × {h}',
    previewNote:
      'Rien d’autre : ni adresse IP, ni cookie, ni historique de navigation. elapsedMs est le temps passé sur ce formulaire (anti-robot) ; website doit rester vide.',
    submit: 'Envoyer le signalement',
    sending: 'Envoi en cours…',
    receipt: {
      stamp: 'Reçu',
      title: 'Signalement reçu',
      number: 'Numéro du signalement',
      keep: 'Gardez ce numéro et ce lien : c’est le seul moyen de suivre votre signalement, rien n’est gardé dans ce navigateur.',
      followLabel: 'Lien de suivi',
      open: 'Ouvrir le suivi',
      copyLink: 'Copier le lien',
      linkCopied: 'Lien de suivi copié',
      another: 'Signaler un autre problème',
      announce: 'Signalement reçu, numéro {ticket}.',
      attachmentsMissingOne:
        '1 capture n’a pas pu être jointe (expirée ou refusée) : le signalement est bien reçu.',
      attachmentsMissingMany:
        '{n} captures n’ont pas pu être jointes (expirées ou refusées) : le signalement est bien reçu.',
    },
    failure: {
      toast: 'Signalement non envoyé',
      lead: 'Le service ne répond pas. Rien n’est perdu :',
      leadRefused: 'Le signalement n’a pas été accepté. Rien n’est perdu :',
      offline: 'Votre appareil semble hors ligne, ou le service est injoignable.',
      timeout: 'Pas de réponse au bout de 10 secondes.',
      unavailable: 'Le service de signalement est indisponible pour le moment.',
      disabled: 'Les signalements sont suspendus pour le moment.',
      rateLimited: 'Trop de signalements envoyés depuis votre connexion. Réessayez dans {delay}.',
      rateLimitedLater: 'Trop de signalements envoyés depuis votre connexion. Réessayez plus tard.',
      invalid: 'Vérifiez la description (20 à 4 000 caractères) et le contact (200 au plus).',
      tooLarge: 'Le signalement est trop long.',
      help: 'Copiez le rapport pour le coller sur le forum (sans votre contact, le forum est public), ou réessayez plus tard.',
      copy: 'Copier le rapport',
      copied: 'Rapport copié',
      copyFailed: 'Copie impossible : sélectionnez le texte ci-dessous.',
      copyArea: 'Rapport à copier',
      retry: 'Réessayer',
    },
    text: {
      heading: 'Signalement · L’Arbre aux absents (site)',
      category: 'Catégorie :',
      description: 'Description :',
      diagnostics: 'Diagnostics :',
    },
    /** Avant d'écrire : le problème est peut-être déjà signalé. */
    already: [
      'Déjà signalé ? Consultez les ',
      { link: 'tickets/', text: 'tickets ouverts' },
      ' et les ',
      { link: 'problemes-connus/', text: 'problèmes connus' },
      '.',
    ] as Rich,
    ticketsLink: 'Voir les tickets ouverts',
  },

  follow: {
    seoTitle: 'Suivi d’un signalement',
    seoDescription:
      'Où en est votre signalement : statut, réponses de l’équipe, suppression à la demande.',
    kicker: 'Fiche de suivi',
    title: 'Suivi du signalement',
    loading: 'Lecture de la fiche…',
    noscript:
      'Le suivi a besoin de JavaScript : le lien de suivi n’est jamais envoyé au serveur du site, seule la page le lit. Sans JavaScript, vous pouvez demander où en est votre signalement sur le forum itch.io du jeu :',
    forum: 'Forum itch.io',
    ticketLabel: 'Numéro',
    created: 'Envoyé le {date}',
    updated: 'mis à jour le {date}',
    repliesHeading: 'Réponses de l’équipe',
    replyDate: 'Le {date}',
    noReplies: 'Pas encore de réponse de l’équipe.',
    tokenNote:
      'Le lien a été retiré de la barre d’adresse pour qu’il ne reste pas dans l’historique : gardez le lien reçu pour revenir.',
    delete: 'Supprimer mon signalement',
    deleting: 'Suppression…',
    confirm: {
      title: 'Supprimer ce signalement ?',
      text: 'Le ticket ne sera plus lisible, votre contact est effacé et ce lien de suivi cessera de fonctionner.',
      keep: 'Garder',
      confirm: 'Supprimer',
    },
    deleted: {
      title: 'Signalement supprimé',
      text: 'Le contact est effacé et le lien de suivi ne fonctionne plus. La correction éventuelle se poursuit sans vos données.',
    },
    deleteFailed: 'Suppression impossible pour le moment. Réessayez plus tard.',
    missing: {
      title: 'Aucun lien de suivi',
      text: 'Cette page s’ouvre avec le lien reçu après un signalement (il se termine par #… suivi d’un code). Ouvrez-le tel quel.',
    },
    notFound: {
      title: 'Ce suivi n’existe plus',
      text: 'Le lien est incomplet, le signalement a été supprimé, ou il est clos depuis plus de 12 mois.',
    },
    error: {
      title: 'Fiche illisible pour le moment',
      text: 'Le service de signalement ne répond pas. Votre signalement n’est pas perdu : réessayez dans un moment.',
      offline:
        'Votre appareil semble hors ligne, ou le service est injoignable. Réessayez une fois connecté.',
      rateLimited: 'Trop de consultations depuis votre connexion. Réessayez dans {delay}.',
      retry: 'Réessayer',
    },
    reportLink: 'Signaler un problème',
    knownLink: 'Problèmes connus',
    ticketsLink: 'Tickets ouverts',
  },

  known: {
    seoTitle: 'Problèmes connus',
    seoDescription:
      'Les problèmes de L’Arbre aux absents déjà connus de l’équipe, leur statut et la version qui les corrige.',
    kicker: 'Registre des incidents',
    title: 'Problèmes connus',
    lede: 'Ce que l’équipe sait déjà, du plus récent au plus ancien. Votre problème n’y est pas ? Signalez-le.',
    loading: 'Chargement du registre…',
    empty: 'Aucun problème connu pour l’instant.',
    error: 'Le registre est illisible pour le moment.',
    retry: 'Réessayer',
    noscript:
      'Cette liste a besoin de JavaScript. Les problèmes connus sont aussi discutés sur le forum itch.io du jeu :',
    forum: 'Forum itch.io',
    updated: 'Mis à jour le {date}',
    listLabel: 'Problèmes connus',
    reportLink: 'Signaler un problème',
    ticketsLink: 'Tickets ouverts',
  },

  tickets: {
    seoTitle: 'Tickets ouverts',
    seoDescription:
      'Tous les signalements en cours de traitement pour L’Arbre aux absents : numéro, catégorie, statut et dates, sans le texte des joueurs.',
    kicker: 'Registre des signalements',
    title: 'Tickets ouverts',
    lede: 'Tous les signalements en cours, du plus récent au plus ancien. Ce que vous avez écrit reste privé : seuls le numéro, la catégorie, le statut et les dates sont publics, avec un titre quand l’équipe en a relu un.',
    loading: 'Chargement du registre…',
    empty: 'Aucun ticket ouvert pour l’instant.',
    error: 'Le registre est illisible pour le moment.',
    offline:
      'Votre appareil semble hors ligne, ou le service est injoignable. Réessayez une fois connecté.',
    rateLimited: 'Trop de consultations depuis votre connexion. Réessayez dans {delay}.',
    retry: 'Réessayer',
    noscript:
      'Cette liste a besoin de JavaScript. Vous pouvez aussi demander où en est un signalement sur le forum itch.io du jeu :',
    forum: 'Forum itch.io',
    listLabel: 'Tickets ouverts',
    countOne: '1 ticket ouvert',
    countMany: '{n} tickets ouverts',
    countsLabel: 'Répartition par statut',
    capped: 'Seuls les {n} plus récents sont affichés.',
    ticketLabel: 'Numéro',
    statusLabel: 'Statut : {status}',
    created: 'Envoyé le {date}',
    updated: 'mis à jour le {date}',
    sources: { game: 'Depuis le jeu', site: 'Depuis le site' },
    /** Libellés courts des catégories (registre public), sans la première personne du formulaire. */
    categories: {
      bug: 'Dysfonctionnement',
      blocked: 'Blocage dans l’enquête',
      text: 'Faute ou texte incorrect',
      display: 'Affichage',
      audio: 'Son',
      controls: 'Commandes',
      performance: 'Lenteur ou plantage',
      other: 'Autre',
    },
    yours: [
      'Vous avez signalé un problème ? Votre numéro figure dans la liste ; le détail et les réponses de l’équipe sont sur votre lien de suivi. Ce que montre ce registre : ',
      { link: 'confidentialite/', text: 'Confidentialité' },
      '.',
    ] as Rich,
    reportLink: 'Signaler un problème',
    knownLink: 'Problèmes connus',
  },

  changelog: {
    seoTitle: 'Nouveautés',
    seoDescription:
      'Les nouveautés et corrections de chaque version de L’Arbre aux absents, du jeu comme du site, regroupées par version publiée.',
    kicker: 'Journal des versions',
    title: 'Nouveautés',
    lede: 'Ce qui change à chaque version publiée du jeu. Les petites retouches sont regroupées avec la version qui les apporte.',
    /** Avant le numéro : « Version actuelle : 1.3.1 ». */
    current: `Version actuelle${NB}:`,
    versionLabel: 'Version',
    listLabel: 'Versions, de la plus récente à la plus ancienne',
    kinds: { new: 'Nouveauté', improved: 'Amélioration', fixed: 'Correction' },
    knownLink: 'Problèmes connus',
    reportLink: 'Signaler un problème',
  },

  privacy: {
    seoTitle: 'Confidentialité',
    seoDescription:
      'Ce que le signalement de problèmes collecte, pourquoi, où et pour combien de temps. Aucune IP stockée, aucun cookie, suppression à la demande.',
    kicker: 'Données personnelles',
    title: 'Confidentialité',
    lede: 'Le site ne pose aucun cookie et ne mesure pas l’audience (la bande-annonce YouTube et le widget itch.io intégrés suivent leurs propres règles). Seul le signalement de problèmes recueille des données : voici lesquelles, et ce qu’elles deviennent.',
    sections: [
      {
        id: 'collecte',
        heading: 'Ce qui est collecté',
        body: [
          [
            'Quand vous signalez un problème : la catégorie, votre description et, si vous le donnez, un contact. S’y ajoutent des diagnostics techniques : la version, la plateforme (site, web, ordinateur ou Android), la langue, la taille de la fenêtre et la famille du système (« Windows », « Android »), jamais la chaîne complète du navigateur.',
          ],
          [
            'Depuis le jeu, aussi : l’édition, l’affaire en cours et vos réglages, plus une sauvegarde anonymisée, sans vos notes ni vos recherches, ',
            { strong: 'seulement si vous cochez la case' },
            '. Chaque formulaire montre exactement ce qui part avant l’envoi.',
          ],
          ['Pas de compte, pas de cookie, pas de mesure d’audience.'],
        ] as Rich[],
      },
      {
        id: 'pourquoi',
        heading: 'Pourquoi',
        body: [
          [
            'Comprendre et corriger le problème. Le contact sert uniquement à vous répondre ; il n’est jamais publié.',
          ],
        ] as Rich[],
      },
      {
        id: 'ou',
        heading: 'Où vont les données',
        body: [
          [
            'La description et les diagnostics deviennent un ticket dans un ',
            { strong: 'dépôt GitHub privé' },
            ', lisible par l’équipe seulement (GitHub est un prestataire établi aux États-Unis). Le ticket ne contient ni votre contact, ni le lien de suivi, ni votre adresse IP.',
          ],
          [
            'Le contact reste sur notre serveur de signalement et ',
            { strong: 'n’est jamais envoyé à GitHub' },
            '.',
          ],
        ] as Rich[],
      },
      {
        id: 'duree',
        heading: 'Combien de temps',
        body: [
          [
            'Le contact est effacé ',
            { strong: '30 jours après la clôture' },
            ' du ticket. La fiche de suivi (empreinte du lien, statut, réponses publiques) est supprimée ',
            { strong: '12 mois après la clôture' },
            '.',
          ],
        ] as Rich[],
      },
      {
        id: 'ip',
        heading: 'Adresses IP',
        body: [
          [
            'Le service de signalement ',
            { strong: 'ne stocke ni ne journalise aucune adresse IP' },
            '. Pour limiter les abus, il en dérive une empreinte à sens unique qui reste en mémoire, change chaque jour et n’est jamais écrite.',
          ],
          [
            'Le site et le service passent par Cloudflare, qui voit les adresses IP comme tout intermédiaire réseau et les traite selon sa propre politique.',
          ],
        ] as Rich[],
      },
      {
        id: 'suivi',
        heading: 'Le lien de suivi',
        body: [
          [
            'Le code secret du lien se trouve après le « # » : le navigateur ne l’envoie jamais au serveur du site, et le service n’en garde qu’une empreinte. La page de suivi le retire de la barre d’adresse dès la lecture. Quiconque possède ce lien peut lire et supprimer le signalement : ne le partagez pas.',
          ],
        ] as Rich[],
      },
      {
        id: 'droits',
        heading: 'Vos droits',
        body: [
          [
            'Supprimez votre signalement à tout moment avec « Supprimer mon signalement » sur la ',
            { link: 'suivi/', text: 'page de suivi' },
            ' : le contact est effacé, la description retirée du ticket et le lien cesse de fonctionner.',
          ],
          [
            'Une précision honnête : GitHub garde l’historique des modifications d’un ticket. L’ancienne description y reste lisible, ',
            { strong: 'par l’équipe seulement' },
            ' (le dépôt est privé), et les notifications déjà reçues par l’équipe au moment du signalement la contiennent aussi. Elle n’est jamais rendue publique.',
          ],
          [
            'Lien perdu, question, accès ou rectification : écrivez-nous sur le forum itch.io du jeu en donnant le numéro du signalement, jamais votre contact. Vous pouvez aussi saisir l’autorité de protection des données de votre pays.',
          ],
        ] as Rich[],
      },
    ],
    forum: 'Forum itch.io',
    reportLink: 'Signaler un problème',
    updated: 'Mise à jour : octobre 2026',
  },

  palette: {
    groups: [
      {
        title: 'L’encre de nuit',
        intro:
          'Le bureau plongé dans le bleu de la nuit : un bleu d’encre profond qui se fond dans le mur de l’art clé, et le texte vélin.',
      },
      {
        title: 'Safran, vermillon, céladon',
        intro:
          'Trois couleurs, trois rôles : le safran pour l’action (une seule par écran), le vermillon pour la marque, le céladon pour la fougère. Le violet de tampon marque ce qui est établi.',
      },
      {
        title: 'Papiers et encres',
        intro: 'Tout ce qui se lit est du papier sous la lumière, écrit à l’encre ferro-gallique.',
      },
      {
        title: 'Les matières du bureau',
        intro:
          'Chemises de kraft, fiches bristol à réglure bleue et ligne de tête rouge, bandes d’étiqueteuse.',
      },
      {
        title: 'Le décor de l’art clé',
        intro:
          'Le bois de la lampe, le velours du rideau, le crépuscule à la fenêtre. Décor seulement : jamais un texte.',
      },
      {
        title: 'Les lavis du coloriste',
        intro:
          'Huit pigments transparents posés sur la gravure, plus deux eaux. Ils ne portent jamais de texte seuls.',
      },
    ],
    swatches: {
      '--canvas': ['Encre de nuit', 'Fond du bureau'],
      '--surface-1': ['Nuit', 'Panneaux'],
      '--surface-2': ['Nuit claire', 'Champs, survols'],
      '--line-strong': ['Ardoise', 'Bordures de contrôles'],
      '--text': ['Vélin', 'Texte'],
      '--text-muted': ['Vélin passé', 'Texte secondaire'],
      '--accent': ['Safran', 'Action, lien, focus'],
      '--accent-edge': ['Safran bruni', 'Tranche du bouton'],
      '--brand': ['Vermillon', 'Titres, surtitres, filets'],
      '--brand-fill': ['Vermillon foncé', 'Étiquette rouge'],
      '--fern': ['Céladon', 'Fougère, ornements'],
      '--fern-deep': ['Céladon profond', 'Fougère sur papier'],
      '--established': ['Encre de tampon', 'Case « Établi »'],
      '--paper-new': ['Papier neuf', 'Fiches, lettres'],
      '--paper': ['Papier', 'Documents, carte'],
      '--paper-aged': ['Papier vieilli', 'Coupures, annuaires'],
      '--paper-stain': ['Papier piqué', 'Creux, taches'],
      '--ink': ['Encre ferro-gallique', 'Texte sur papier'],
      '--ink-muted': ['Encre diluée', 'Texte secondaire'],
      '--ink-hand': ['Encre de plume', 'Manuscrit'],
      '--paper-accent': ['Laiton bruni', 'Action sur papier'],
      '--kraft': ['Kraft', 'Chemise'],
      '--kraft-shade': ['Kraft ombré', 'Dos de chemise'],
      '--manila': ['Manille', 'Étiquettes, intérieur'],
      '--card': ['Bristol', 'Fiche'],
      '--card-rule': ['Réglure', 'Lignes de la fiche'],
      '--card-margin': ['Ligne de tête', 'Filet rouge de la fiche'],
      '--label-tape': ['Bande bleue', 'Étiqueteuse'],
      '--label-tape-red': ['Bande rouge', 'Étiqueteuse, annonce'],
      '--wood': ['Bois ombré', 'Bureau, lampe'],
      '--wood-lit': ['Bois éclairé', 'Dans la flaque de lumière'],
      '--velvet': ['Velours', 'Rideau'],
      '--dusk-rose': ['Crépuscule rose', 'Ciel'],
      '--dusk-lilac': ['Crépuscule lilas', 'Ciel'],
      '--dusk-peach': ['Crépuscule pêche', 'Ciel'],
      '--scrim-art': ['Voile de zone calme', 'Sous un titre posé sur l’art'],
      '--art-wash-safran': ['Safran', 'Places, édifices civiques'],
      '--art-wash-carmin': ['Carmin', 'Demeures, tuiles'],
      '--art-wash-indigo': ['Indigo', 'Administrations, uniformes'],
      '--art-wash-sienne': ['Sienne', 'Ateliers, terres'],
      '--art-wash-sauge': ['Sauge', 'Forêts, jardins'],
      '--art-wash-lilas': ['Lilas', 'Chapelles, deuil'],
      '--art-wash-celadon': ['Céladon', 'Marais, verre'],
      '--art-wash-ardoise': ['Ardoise', 'Toits, pierre'],
      '--art-water': ['Eau', 'Mer, lacs'],
      '--art-water-deep': ['Eau profonde', 'Chenaux'],
    } as Record<string, [name: string, usage: string]>,
  },

  /** Kit presse (fichiers en français, générés par scripts/presskit) : libellés traduits. */
  presskit: {
    /** Taille lisible : « 1,2 Mo », « 340 Ko ». */
    size: (bytes: number) => {
      const n = (v: number, d: number) => v.toFixed(d).replace('.', ',');
      if (bytes >= 1024 * 1024) return `${n(bytes / 1024 / 1024, 1)} Mo`;
      return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
    },
    groups: {
      documents: { title: 'Documents', intro: 'L’artbook et la fiche presse, en PDF.' },
      logos: {
        title: 'Titre du jeu et emblème',
        intro:
          'Le titre en quatre teintes : couleurs sur fond sombre (usage principal), couleurs sur fond clair, noir, blanc. SVG au texte vectorisé, PNG transparents.',
      },
      affiches: {
        title: 'Affiches A3',
        intro: 'PDF vectoriel pour l’impression, PNG pour l’écran.',
      },
      bannieres: {
        title: 'Bannières et visuels sociaux',
        intro: 'Le titre toujours posé dans la zone calme de l’art clé, zones sûres respectées.',
      },
    } as Record<string, { title: string; intro: string }>,
    /** Libellés et précisions du manifeste traduits (`null` : tels quels). */
    labels: null as Record<string, string> | null,
    details: null as [RegExp, string][] | null,
  },
};

export type SiteStrings = typeof fr;
