/**
 * Textes du site vitrine, en anglais britannique (docs/i18n/en/GLOSSAIRE.md fait foi). Même forme
 * que `fr.ts` (`satisfies SiteStrings`). Le titre du jeu reste « L’Arbre aux absents » (D3) et
 * porte `lang="fr"` dans la prose ; les noms propres du monde restent à la lettre.
 */
import type { SiteStrings } from './fr';
import type { Rich } from './rich';

const TITLE = { em: 'L’Arbre aux absents', lang: 'fr' } as const;

export const en = {
  lang: 'en' as const,
  languageName: 'English',

  meta: {
    description:
      'L’Arbre aux absents: a solo genealogical investigation game. Cross-reference archives, registers and photographs to rebuild the family tree of a family from Velmarche. By CM Interactive and CM Creative Lab.',
    ogImageAlt:
      'The investigator’s desk under the lamp at night: files, photographs and a family tree waiting to be filled in, beside the title L’Arbre aux absents.',
    trailerTitle: 'L’Arbre aux absents · Trailer',
    trailerDescription:
      'One minute at the investigator’s desk: the catalogue, the archives, the photographs and the tree filling up, set to the game’s music.',
    keyArtAlt:
      'An investigator’s desk in 1974 under a brass lamp: kraft folders, a draft family tree with empty lockets, photographs, a map of Velmarche, a magnifying glass, a stamp, a cup of tea and a herbarium fern; at the window, dusk over the roofs of Aubrelieu.',
  },

  header: {
    homeSuffix: ', home',
    nav: 'Main navigation',
    menu: 'Menu',
    links: {
      'le-monde/': 'The world',
      'artbook/': 'Artbook',
      'charte/': 'Brand guide',
      'presse/': 'Press',
      'credits/': 'Credits',
    },
    exploreMap: 'Explore the map',
    report: 'Report',
  },

  footer: {
    tagline: 'Velmarche, 1974 — an imaginary world',
    logos: 'A CARDOR Media production',
    nav: 'Footer',
    links: {
      'le-monde/': 'The world',
      'artbook/': 'Artbook',
      'presse/': 'Press',
      'charte/': 'Brand guidelines',
      'credits/': 'Credits',
      'nouveautes/': 'What’s new',
      'signaler/': 'Report a problem',
      'problemes-connus/': 'Known issues',
      'tickets/': 'Open tickets',
      'confidentialite/': 'Privacy',
    },
    legal: [
      '© 2026 CARDOR Media. ',
      TITLE,
      ' is a game by CM Interactive, written and illustrated by CM Creative Lab. Its world, places and characters are imaginary.',
    ] as Rich,
  },

  brand: {
    'cardor-monogram': 'Publishing',
    interactive: 'Development and publishing',
    creative: 'Writing, illustration and map',
  },

  common: {
    backHome: 'Back to the home page',
    exploreMap: 'Explore the map',
    portraitSoon: 'Portrait to come',
    plate: (n: string) => `Pl. ${n}`,
    mapTitle: 'Velmarche',
  },

  error: {
    title: 'Error',
    kicker: 'Error',
    heading: ['This document ', { em: 'won’t open' }] as Rich,
    lede: 'Something went wrong. The rest of the file is waiting for you.',
  },

  notFound: {
    title: 'Page not found',
    stamp: 'Not found',
    kicker: 'Error 404',
    heading: ['This page is ', { em: 'absent from the registers' }] as Rich,
    lede: 'The address you asked for doesn’t exist, or no longer does. The rest of the file is waiting for you.',
  },

  home: {
    heroLabel: 'L’Arbre aux absents',
    kicker: 'A genealogical investigation game',
    tagline:
      'A family erased from the registers. A desk, a lamp, and the whole autumn to give them back their names.',
    play: 'Play in your browser',
    exploreWorld: 'Explore Velmarche',
    seeArtbook: 'See the artbook',
    platformsLine: 'Windows · macOS · Linux · Android',
    free: 'Free · download on itch.io',
    premise: {
      kicker: 'The premise',
      title: ['Velmarche, ', { em: 'October' }, ' 1974'] as Rich,
      lede: 'The Regency fell twenty years ago. A new law at last makes it possible to give “the absent” back their names.',
      office: 'Civil Re-registration Office',
      ref: 'Letter of assignment · Aubrelieu, 7 October 1974',
      body: [
        'For fifteen years, the offices of the Regency struck thousands of citizens off the registers: with no civil status and no rights, they were called “the absent”.',
        'You are a rapporteur at the Office. On your desk: an estate to investigate, an almost empty family tree and boxes of archives.',
        'Rebuild the family, document by document, and understand what the papers erased.',
      ],
      sign: 'The Director of the Office',
    },
    trailer: {
      kicker: 'Trailer',
      title: ['One minute ', { em: 'under the lamp' }] as Rich,
      play: 'Play the trailer',
      duration: '1 min',
      note: 'Video hosted on YouTube: nothing is loaded from YouTube until you press play.',
    },
    game: {
      kicker: 'The game',
      title: ['An ', { em: 'archivist’s' }, ' six moves'] as Rich,
      features: [
        {
          kicker: 'Rebuild',
          title: 'A tree across four generations',
          text: 'Some thirty slots to fill: given name, surname, face and occupation. Every name is earned document by document.',
        },
        {
          kicker: 'Dig',
          title: 'Archives that contradict each other',
          text: 'Letters, registers, press cuttings, directories, uncaptioned photographs: cross-reference them, highlight, pin.',
        },
        {
          kicker: 'Travel',
          title: 'The map of Velmarche',
          text: 'An engraved, watercoloured map of the country: every place opens its archives, from the fishing port to the capital.',
        },
        {
          kicker: 'Query',
          title: 'A catalogue that answers to keywords',
          text: 'The Office’s card cabinet: type a name, a place, a date, and pull out the drawer.',
        },
        {
          kicker: 'Establish',
          title: 'Answers confirmed by groups',
          text: 'No lucky guesses: a branch is only stamped “Established” once all of it holds.',
        },
        {
          kicker: 'Deduce',
          title: 'An investigation without rails',
          text: 'No set order: you pull whichever thread you like. Several endings, depending on the secrets you bring to light.',
        },
      ],
    },
    world: {
      kicker: 'The world',
      title: ['A country that ', { em: 'doesn’t exist' }] as Rich,
      lede: 'The Orvelle valley and its capital Aubrelieu, the fjords of Ostrie, the Golfe d’Ambre, the Monts Corvins. In the game, every place opens its own archives.',
      open: 'Open the interactive map',
      mapLabel:
        'Map of Velmarche, an engraving heightened with watercolour: the Orvelle valley and its capital Aubrelieu in the centre, Ostrie and its fjords to the north, the Golfe d’Ambre to the west, the Monts Corvins to the south-east.',
      credit: 'Drawn and engraved by CM Creative Lab.',
    },
    faces: {
      kicker: 'The faces',
      title: ['Portraits ', { em: 'to recognise' }] as Rich,
      lede: 'Each one has a silhouette, an accessory, a colour. In a group photograph or on the back of a postcard, it’s up to you to find them again.',
      more: 'All the plates in the artbook',
    },
    platforms: {
      label: 'Platforms',
      title: 'Platforms',
      lede: ['On computer, on phone and in the browser. Free, on '] as Rich,
      ledeEnd: '.',
      available: 'Available',
      browser: 'Browser',
      playHere: 'Play here',
      itchTitle: 'L’Arbre aux absents on itch.io',
      note: 'In English and French, single-player, six to ten hours. Free.',
    },
    shots: {
      kicker: 'Screenshots',
      title: ['The ', { em: 'investigator’s' }, ' desk'] as Rich,
      soon: 'Screenshot to come',
      items: ['The tree and the archive reader', 'The map and its places', 'The case notebook'],
    },
  },

  world: {
    seoTitle: 'The world',
    seoDescription:
      'Velmarche, a small imaginary country between the Mer Grise and the Monts Corvins: its engraved and watercoloured map, its history, its languages and its places.',
    kicker: 'The world',
    title: [{ em: 'Velmarche' }] as Rich,
    lede: 'A small country of valley and coast, invented for the game: the Orvelle valley and its capital Aubrelieu in the centre, the plateau and fjords of Ostrie to the north, the Golfe d’Ambre to the west and, to the south-east, the Monts Corvins that divide it from Thalberie.',
    mapHeading: 'Interactive map',
    mapKeys:
      'Arrows: move · + and −: zoom · 0: overview · Tab: go from place to place. By touch: drag, pinch, tap a place.',
    history: {
      kicker: 'History',
      title: ['Seven centuries ', { em: 'in a few dates' }] as Rich,
      lede: 'A Grand Duchy turned Republic, a fifteen-year Regency that erased people from the registers, and a law that, in 1973, promises to re-register them.',
      register: 'Chronological register · Aubrelieu Archives',
      events: [
        { date: '1214', text: 'Aubrelieu is founded, a bridge town on the Orvelle.' },
        { date: '1488', text: 'The lordships of the valley form the Duchy of Velmarche.' },
        { date: '1602', text: 'Treaty of Vellaak: Ostrie, to the north, is joined to Velmarche.' },
        {
          date: '1811',
          text: 'The Velmarche Charter: a constitutional Grand Duchy, and civil registration by commune.',
        },
        {
          date: '1848',
          text: 'Freedom of the press; The Aubrelieu Courier is founded.',
        },
        {
          date: '1889',
          text: 'The Grand Exhibition of Aubrelieu: the country shows itself modern, with glass, paper, soap and ships.',
        },
        {
          date: '1916–1919',
          text: 'The War of the Passes against neighbouring Thalberie, over the Col de Corvenne.',
        },
        { date: '1929', text: 'The Sorbelle Crash: the country’s oldest bank fails.' },
        {
          date: '1937',
          text: 'General Destrade’s coup: the Grand Duke abdicates and the Regency begins.',
        },
        {
          date: '1938',
          text: 'The Purity of the Registers Act: citizens are struck off the civil registers and declared absent.',
        },
        { date: '1952', text: 'The April Days: Aubrelieu rises up and the Regency ends.' },
        { date: '1953', text: 'Constitution of the Republic.' },
        {
          date: '1973',
          text: 'The Civil Re-registration Act: an Office is charged with giving the absent back their names.',
        },
        { date: '1974', text: 'October. An estate lands on your desk.' },
      ],
    },
    languages: {
      kicker: 'Languages',
      title: ['Three languages, ', { em: 'one map' }] as Rich,
      prose: [
        [
          { strong: 'Velmarchois' },
          ', the official language, is rendered in English in the game, with its period turns of phrase: the “common house” of old certificates, the league, the florin.',
        ],
        [
          'In the north, ',
          { strong: 'Ostrian' },
          ' has its doubled vowels and place names that read like landscapes; a woman’s name takes the suffix ',
          { em: '-essa' },
          '. Further off, ',
          { strong: 'Thalberie' },
          ' speaks a foreign tongue, with names ending in ',
          { em: '-in' },
          ' and ',
          { em: '-ko' },
          '.',
        ],
      ] as Rich[],
      lexiconTitle: 'A short Ostrian lexicon',
      lexicon: [
        ['vel', 'sea'],
        ['tenn', 'fire, light'],
        ['ok', 'cape, point'],
        ['laak', 'shelter, still water'],
        ['kess', 'stone'],
        ['aar', 'island'],
        ['vik', 'bay'],
        ['taalik', 'messenger'],
      ] as [string, string][],
      lexiconNote: [
        'Hence ',
        { em: 'Tennok' },
        ', “cape of fire”, and ',
        { em: 'Kessaar' },
        ', “stone island”.',
      ] as Rich,
    },
    places: {
      kicker: 'Places',
      title: ['The places ', { em: 'on the map' }] as Rich,
      lede: 'From west to east. In the game, each one opens its own archives.',
      empty: 'The places on the map will be described here soon.',
    },
  },

  map: {
    label: 'Interactive map of Velmarche',
    failed: 'The map couldn’t be loaded. The list of places, further down, is still available.',
    retry: 'Try again',
    loading: 'Loading the map',
    noscript:
      'The interactive map needs JavaScript. The list of places, further down, replaces it.',
    selected: 'Selected place',
    hint: 'Choose a place on the map with the mouse, by touch or with the keyboard (Tab, then the arrow keys to move from a place to its neighbour).',
    view: {
      instructions:
        'Arrow keys to move, plus and minus to zoom, zero to see the whole map again, Tab to go through the places and Enter to open a place.',
      hint: 'Arrows: move · + / −: zoom · 0: overview · Tab: places',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      overview: 'Overview',
      controls: 'Map zoom',
      states: { mentioned: 'mentioned', open: 'open', exhausted: 'all seen' },
    },
  },

  placeKinds: {
    region: 'Region',
    city: 'Town',
    village: 'Village',
    building: 'Building',
    landmark: 'Landmark',
    sea: 'Sea',
    mountain: 'Mountains',
    river: 'River',
  },

  placeNotes: {
    vellaak:
      'Fishing village at the head of an Ostrian fjord: harbour, fish-drying racks, and the offices of the bilingual paper Vel Taalik.',
    grisenoue: 'Marsh town north of Aubrelieu: reed beds, mists and charred ruins.',
  },

  portraits: {
    I: {
      caption: 'White hair braided in a crown, lace collar, brooch. Carmine wash.',
      alt: 'Engraved portrait of an elderly woman with white hair braided in a crown, a lace collar and a brooch, in a pink dress.',
    },
    II: {
      caption: 'Sailor’s cap, full beard, buttoned pea jacket. Indigo wash.',
      alt: 'Engraved portrait of a bearded man in a sailor’s cap and a blue buttoned pea jacket.',
    },
    III: {
      caption: 'Short bob, pearl necklace, bare shoulders. Lilac wash.',
      alt: 'Engraved portrait of a young woman with chestnut hair cut in a bob, a pearl necklace and a lilac dress.',
    },
    IV: {
      caption: 'Leather helmet and aviator goggles pushed up. Sienna wash.',
      alt: 'Engraved portrait of a smiling man in a leather helmet, aviator goggles pushed up on his forehead.',
    },
    V: {
      caption: 'Feathered hat, lorgnette hanging at the neck. Carmine and indigo wash.',
      alt: 'Engraved portrait of a woman in a black feathered hat, a lorgnette hanging on a chain, a pink blouse.',
    },
    VI: {
      caption: 'Zigzag Ostrian jumper, plaited grey hair. Celadon wash.',
      alt: 'Engraved portrait of an elderly woman with plaited grey hair, in a green jumper with a zigzag pattern.',
    },
    VII: {
      caption: 'Wide-brimmed felt hat, goatee, floppy bow tie. Saffron wash.',
      alt: 'Engraved portrait of a man in a brown felt hat, with a goatee and a floppy bow tie, in a yellow jacket.',
    },
    VIII: {
      caption: 'Knotted turban, earrings, gloves. Sage wash.',
      alt: 'Engraved portrait of a woman in a yellow turban, earrings and brown gloves, in a green dress.',
    },
    IX: {
      caption: 'Red beard, zigzag jumper. Indigo and carmine wash.',
      alt: 'Engraved portrait of a red-haired, bearded man in a blue jumper with a zigzag pattern.',
    },
  },

  artbook: {
    seoTitle: 'Artbook',
    seoDescription:
      'The plates of L’Arbre aux absents: the key art, the watercolour vignettes, the engraved portraits, details of the map of Velmarche, and the game’s artistic intent.',
    kicker: 'Artbook',
    title: ['Engraving ', { em: 'and watercolour' }] as Rich,
    lede: 'An engraved line of blue-black ink, hatching for volume, then a few transparent washes laid down by a colourist. All the game’s illustration follows this old process, inside a clean, contemporary interface.',
    keyArtHeading: 'The key art',
    enlargeKeyArt: 'Enlarge the key art',
    keyArtTitle: '“The desk under the lamp”',
    keyArtCaption: 'Key art, 16:9, and 4:5 recomposed for phones. The game’s title screen.',
    intention: {
      kicker: 'Intent',
      title: ['“The desk ', { em: 'under the lamp' }, '”'] as Rich,
      prose: [
        [
          'It is late. On an investigator’s desk steeped in the blue of night, a brass lamp lights up the archives: letters, registers, photographs, an unfolded map. Everything you read is paper in the light; everything that serves as a tool stays in the shadow, clean and discreet.',
        ],
        [
          'The illustration is an ',
          { strong: 'intaglio print in iron-gall ink' },
          ', heightened with ',
          { strong: 'watercolour' },
          '. The line sets the hierarchy: firm outlines, finer details, shadows and contour lines barely touched in. The washes stay transparent, never more than two layers, and spill a little over the line, like a colourist’s hand.',
        ],
        [
          'The portraits are three-quarter busts, recognisable as a thumbnail or full size: each person has their own hairstyle silhouette, accessory and clothing colour.',
        ],
      ] as Rich[],
    },
    spots: {
      kicker: 'Vignettes',
      title: ['The objects ', { em: 'on the desk' }] as Rich,
      lede: 'Ten vignettes painted for the interface: each one opens one of the game’s moves, on a pool of wash.',
      enlarge: (title: string) => `Enlarge: ${title}`,
      names: {
        tree: 'The tree of lockets',
        archives: 'The archive box',
        lighthouse: 'The Tennok lighthouse',
        catalogue: 'The card cabinet',
        letter: 'The fern letter',
        stamp: 'The wooden stamp',
        magnifier: 'The magnifying glass',
        register: 'The padlocked register',
        'map-pin': 'The pinned map',
        fern: 'The herbarium fern',
      },
    },
    portraits: {
      kicker: 'Portraits',
      title: ['A gallery ', { em: 'of faces' }] as Rich,
      lede: 'A few plates from the game’s thirty or so portraits. The names stay in the archives: it’s up to you to find them there.',
      empty: 'The portraits are coming soon.',
    },
    map: {
      kicker: 'The map',
      title: ['Details ', { em: 'of Velmarche' }] as Rich,
      lede: 'A single large plate, cut into layers: ground, relief, water, places and place names. In the game, each place lights up when you visit it.',
      detailLabel: (title: string) => `Map detail: ${title}`,
      empty: 'The map plates are coming soon.',
      note: 'The illustrations of the documents (photographs, postcards, press cuttings) will join the artbook when the game is released.',
      details: {
        cartouche: {
          title: 'The cartouche',
          text: 'A double rule, a title in capitals, the engraver’s credit: the map presents itself as an official document of 1974.',
        },
        rose: {
          title: 'The compass rose',
          text: 'Pen-drawn circles, a solid needle pointing north: the only ornament in the western margin.',
        },
        tennok: {
          title: 'The Cap de Tennok',
          text: 'A white lighthouse with a red band on the north-western point, and the contour lines of the Mer Grise.',
        },
        aubrelieu: {
          title: 'Aubrelieu',
          text: 'The capital as a vignette: dome, ramparts and roofs in a carmine wash, the Orvelle as a celadon ribbon.',
        },
        moulinvert: {
          title: 'The Clairette and the Lac d’Aulne',
          text: 'Chimneys, water wheels and a lake of clear water: the Clairette valley at the foot of the hills.',
        },
        corvins: {
          title: 'The Monts Corvins',
          text: 'The relief is engraved in hatching, the Thalbère border traced in a carmine wash.',
        },
      },
    },
  },

  charte: {
    seoTitle: 'Brand guidelines',
    seoDescription:
      'The brand guidelines of L’Arbre aux absents for press and partners: the game’s title, palette, typefaces, materials, icons, motion, illustration, usage rules and resources.',
    kicker: 'Brand guidelines',
    title: ['The living ', { em: 'file' }] as Rich,
    lede: [
      'For press and partners: how to present ',
      TITLE,
      '. An investigator’s desk at night, paper under the lamp, an archivist’s moves. Every value on this page is read from the game’s design system.',
    ] as Rich,
    logo: {
      kicker: 'Title',
      title: ['The game’s ', { em: 'title' }] as Rich,
      lede: 'Fraunces black, “absents” in vermilion italics, a fern flourish. Three sizes: poster, title screen, header.',
      posterLabel: 'The game’s title, poster size',
      posterKicker: 'A genealogical investigation game',
      posterCaption: 'Poster, on the night of the desk (main use)',
      titleLabel: 'The game’s title, title-screen size',
      titleCaption: 'Title screen, on paper',
      headerLabel: 'The game’s title, header size, and emblem',
      headerCaption: 'Header and emblem: icon, avatar, favicon',
    },
    palette: {
      kicker: 'Colours',
      title: ['A palette ', { em: 'of ink and paper' }] as Rich,
      lede: 'Values in OKLCH (the source) and their approximate hexadecimal equivalent, for print and for tools that lack OKLCH.',
    },
    type: {
      kicker: 'Typography',
      title: ['Seven ', { em: 'open' }, ' typefaces'] as Rich,
      lede: 'All under the SIL Open Font License, self-hosted. No pixel-art typeface.',
      fonts: {
        '--font-display': {
          role: 'Poster titles, an “old style” face with soft, wobbly axes',
          sample: 'A family erased from the registers.',
        },
        '--font-label': {
          role: 'Labels, tabs, buttons, stamps (capitals)',
          sample: 'ORC 74 · RELEASE · ARCHIVES',
        },
        '--font-read': {
          role: 'Reading: printed documents, long texts',
          sample: 'Rebuild a family’s tree, document by document.',
        },
        '--font-ui': {
          role: 'Interface: panels, navigation, settings',
          sample: 'Archives · Notebook · Map · 12 / 30 identified',
        },
        '--font-type': {
          role: 'Typewriter: reports, telegrams, cards',
          sample: 'CIVIL RE-REGISTRATION OFFICE — FILE No. 74-0112',
        },
        '--font-hand': {
          role: 'Handwriting: letters, backs of photographs (replaceable)',
          sample: 'Love and kisses from Bains-de-Mérande…',
        },
        '--font-legible': {
          role: 'The game’s legibility option',
          sample: 'A typeface designed for easy reading.',
        },
      },
    },
    materials: {
      kicker: 'Materials',
      title: ['The desk, ', { em: 'in materials' }] as Rich,
      lede: 'Nothing is an abstract “card”: every surface is an object on the desk, laid down, pinned, taped.',
      sheet: 'The sheet',
      sheetCaption: 'Paper, with straight, torn or punched edges; tape, paper clip, drawing pin.',
      folder: 'The folder',
      folderNote: 'Kraft or manila, a reference on a label-maker strip, a tab.',
      card: 'The index card',
      cardNote: 'Bristol board, blue ruling, vermilion header line.',
      dymo: 'Label maker',
      dymoRed: 'Notice',
      tape: 'Sticky tape',
      stamp: 'Established',
      stampLabel: '“Established” stamp',
      stampCaption: 'The violet stamp marks what the player has established.',
    },
    icons: {
      kicker: 'Icons',
      title: ['Inked ', { em: 'with a pen' }] as Rich,
      lede: 'An irregular main stroke, a second thin pass of ink, and sometimes a watercolour wash behind. The same shapes, crisp, below 14 pixels.',
      names: {
        tree: 'Tree',
        archives: 'Archives',
        reader: 'Reader',
        catalog: 'Catalogue',
        notebook: 'Notebook',
        map: 'Map',
        pinboard: 'Pinboard',
        faces: 'Faces',
        search: 'Search',
        stamp: 'Stamp',
        lamp: 'Lamp',
        quill: 'Quill',
        envelope: 'Letter',
        photo: 'Photo',
        compass: 'Compass',
        typewriter: 'Typewriter',
        fern: 'Fern',
        lock: 'Lock',
      },
      ornaments: 'Ornaments',
      ornamentNames: {
        corner: 'Corner',
        fern: 'Fern',
        divider: 'Rule',
        seal: 'Seal',
        clip: 'Paper clip',
        pin: 'Drawing pin',
        flourish: 'Flourish',
      },
    },
    motion: {
      kicker: 'Motion',
      title: ['An ', { em: 'archivist’s' }, ' moves'] as Rich,
      lede: 'Everything moves like paper in a hand: dealt, laid down, inked, stamped. Soft curves, a slight bounce, never a cartoon bounce. With reduced motion, everything fades in and the atmosphere stands still.',
      card: (n: number) => `No. ${n}`,
      deal: { name: 'Deal', text: 'The cards cascade in and settle at an angle.' },
      ink: { name: 'Ink', text: 'The line is laid down from left to right, and the ink dries.' },
      stamp: {
        name: 'Stamp',
        text: 'The stamp strikes, the ink spreads, the slot takes the blow.',
      },
      sway: { name: 'Breathe', text: 'A pinned sheet sways, the lamp flickers.' },
    },
    illustration: {
      kicker: 'Illustration',
      title: ['Engraving ', { em: 'heightened with watercolour' }] as Rich,
      text: 'A blue-black line of iron-gall ink, hatching for volume, then transparent washes that spill over a little, like a colourist’s hand. The game’s documents are paper in the light; the interface around them stays dark, clean and discreet.',
    },
    usage: {
      kicker: 'Usage',
      title: ['Do, ', { em: 'don’t' }] as Rich,
      do: 'Do',
      dont: 'Don’t',
      dos: [
        'Set the game’s title on the night of the desk, in vellum and vermilion, or on paper, in ink.',
        'On the key art, only in its quiet zone, on the scrim provided.',
        'Show the illustrations on their paper, with no crop that cuts through a face.',
        'Saffron for a single action per screen; vermilion for the brand.',
      ],
      donts: [
        'Recolour the title, distort it, or add a shadow or an outline.',
        'Set the title over a busy illustration or over the map.',
        'Use a pixel-art typeface or a novelty typeface.',
        'Reveal a name, a secret or an ending of the investigation in any communication.',
      ],
    },
    partners: {
      kicker: 'Signature',
      title: ['The house ', { em: 'logos' }] as Rich,
      lede: 'In this order, on a single baseline: CARDOR Media, CM Interactive, CM Creative Lab. Monochrome on the site and in the game; original colours below, for the press.',
    },
    downloads: {
      kicker: 'Resources',
      title: ['To ', { em: 'download' }] as Rich,
      logo: (name: string) => `${name} logo`,
      logoDetail: 'SVG, original colours',
      titleEmblem: 'Game title and emblem',
      titleEmblemDetail: 'SVG and PNG, four colourways',
      posters: 'Posters and banners',
      postersDetail: 'A3 PDF, PNG, JPEG',
      documents: 'Artbook and press sheet',
      documentsDetail: 'PDF',
      captures: 'Screenshots',
      capturesDetail: 'PNG, 1440 px',
    },
  },

  presse: {
    seoTitle: 'Press',
    seoDescription:
      'Press kit for L’Arbre aux absents: fact sheet, short and long descriptions, contact.',
    kicker: 'Press',
    title: ['Press ', { em: 'kit' }] as Rich,
    lede: [
      'Everything you need to present the game. The visual elements and their usage rules are in the ',
      { link: 'charte/', text: 'brand guidelines' },
      ', the plates in the ',
      { link: 'artbook/', text: 'artbook' },
      '.',
    ] as Rich,
    oneLine: 'In one sentence',
    pitch: [
      'A solo genealogical investigation game: rebuild a family’s tree across four generations by cross-referencing letters, registers, photographs and press cuttings, in an imaginary country, ',
      { em: 'Velmarche' },
      '.',
    ] as Rich,
    factsLabel: 'Fact sheet and description',
    factSheet: 'Fact sheet',
    facts: [
      { term: 'Title', value: 'L’Arbre aux absents' },
      { term: 'Genre', value: 'Genealogical investigation, deduction' },
      { term: 'Development', value: 'CM Interactive' },
      { term: 'Writing and illustration', value: 'CM Creative Lab' },
      { term: 'Publisher', value: 'CARDOR Media' },
      { term: 'Platforms', value: 'Windows, macOS, Linux, Android, browser' },
      { term: 'Languages', value: 'English and French (text and interface)' },
      { term: 'Players', value: 'Single-player' },
      { term: 'Length', value: 'Six to ten hours for the main case' },
      { term: 'Price', value: 'Free' },
      { term: 'Release', value: 'October 2026' },
      { term: 'Website', value: 'arbre.cardormedia.com' },
    ],
    download: 'Download',
    presentation: 'Description',
    long: [
      [
        'Velmarche, October 1974. Twenty years after the fall of the Regency, which struck citizens deemed undesirable off the registers, a law at last makes it possible to re-register those who were called “the absent”. As a rapporteur at the Civil Re-registration Office, the player is handed an estate to investigate: an almost empty family tree and boxes of archives.',
      ],
      [
        'Letters, certificates, group photographs, directories, postcards, newspaper articles and a period card reader that answers to keywords: nothing is imposed in any order. The player pulls whichever thread they like, takes notes, pins and cross-checks, then fills in each slot of the tree (name, face, occupation). Answers are only confirmed by groups: you don’t guess, you deduce.',
      ],
      [
        'An engraved, watercoloured map of the country opens the archives of each place. Side secrets change the ending; achievements and a timed mode invite you to play again.',
      ],
      [
        TITLE,
        ' is developed by CM Interactive, written and illustrated by CM Creative Lab, and published by CARDOR Media.',
      ],
    ] as Rich[],
    contact: 'Press contact',
    contactText:
      'The game is free on itch.io: no key is needed to try it. The press contact will be published here soon.',
    contactStamp: 'Coming soon',
    kitButton: 'Press kit',
    charteButton: 'Brand guidelines',
    kit: {
      kicker: 'To download',
      title: ['The press ', { em: 'kit' }] as Rich,
      lede: [
        'Logos, posters, banners, artbook and press sheet, drawn from the game’s art and its design system. Free to use to talk about the game, in keeping with the ',
        { link: 'charte/', text: 'brand guidelines' },
        ': no name, secret or ending of the investigation.',
      ] as Rich,
      all: 'Download everything',
      zip: (size: string) => `ZIP, ${size}`,
      captures: 'Screenshots',
      capturesIntro: 'The game at 1440 pixels wide, and the cover of the itch.io page.',
      filesNote:
        'The documents in the kit (artbook, press sheet, posters) are currently in French; the titles and logos are the same in every language.',
    },
  },

  credits: {
    seoTitle: 'Credits',
    seoDescription:
      'Credits for L’Arbre aux absents: CARDOR Media, CM Interactive and CM Creative Lab, open typefaces and tools.',
    kicker: 'Credits',
    title: ['A ', { em: 'CARDOR Media' }, ' production'] as Rich,
    lede: [
      'Created by ',
      { strong: 'Nicolas Dessenius' },
      '. ',
      TITLE,
      ' is written, drawn and developed by the divisions of CARDOR Media.',
    ] as Rich,
    houseHeading: 'The house',
    house:
      'CARDOR Media brings together creative studios: games, writing, illustration. Each division signs its share of the work here.',
    divisions: {
      'cardor-monogram': ['Publishing', 'Production'],
      interactive: [
        'Game development',
        'Game design and level design',
        'Interface and design system',
        'Website',
      ],
      creative: [
        'Story and the world of Velmarche',
        'Archive documents',
        'Portraits and illustrations',
        'Engraved and watercoloured map',
      ],
    },
    fonts: {
      kicker: 'Typefaces',
      title: ['Seven ', { em: 'letterforms' }] as Rich,
      lede: 'Under the SIL Open Font License 1.1, with thanks to their designers.',
      roles: {
        Fraunces: 'Titles',
        Oswald: 'Labels and tabs',
        Literata: 'Reading documents',
        'Instrument Sans': 'Interface',
        'Courier Prime': 'Typewriter',
        Caveat: 'Handwriting',
        'Atkinson Hyperlegible Next': 'Legibility option',
      },
    },
    tools: {
      kicker: 'Open-source tools',
      title: ['Made ', { em: 'with' }] as Rich,
      lede: 'The game and this site are built on open-source software.',
      list: ['Svelte and SvelteKit', 'Vite', 'Tauri', 'TypeScript', 'zod', 'svgo'],
    },
    notice: {
      title: 'Notice',
      text: 'Velmarche, its towns, its institutions, its newspapers and its inhabitants are imaginary. Any resemblance to real people or places is coincidental.',
      stamp: 'Fiction',
    },
  },

  reportCategories: {
    bug: 'Something doesn’t work',
    blocked: 'I’m stuck in the investigation',
    text: 'Typo or incorrect text',
    display: 'Display problem',
    audio: 'Sound problem',
    controls: 'Controls, keyboard or gamepad',
    performance: 'Slowness or crash',
    other: 'Something else',
  },

  report: {
    seoTitle: 'Report a problem',
    seoDescription:
      'A bug, a dead end or a typo in L’Arbre aux absents? Report it to the team and follow its progress without an account.',
    kicker: 'Report form',
    title: 'Report a problem',
    lede: 'A bug, a dead end, a typo? Describe it: the team reads every report, and you can follow its progress without an account.',
    noscript:
      'This form needs JavaScript. You can also report the problem on the game’s itch.io forum:',
    forum: 'itch.io forum',
    fromGame:
      'In the game, use “Report a problem” instead (title screen, pause or help): it attaches the version and the current case.',
    categoryLabel: 'Category',
    descriptionLabel: 'Description',
    descriptionHint: 'At least 20 characters. What you were doing, and what you expected.',
    descriptionMissing: '{n} more characters before you can send.',
    contactLabel: 'Contact (optional)',
    contactHint: 'Never published. Only used to reply to you.',
    contactPrivacy: [
      'Email address or itch.io username. Kept on our server, never sent to GitHub, erased 30 days after the ticket is closed. ',
      { link: 'confidentialite/', text: 'Privacy' },
    ] as Rich,
    honeypot: 'Website (leave empty)',
    gameVersionLabel: 'Game version (optional)',
    gameVersionHint:
      'In the game: “Report a problem”, under “Information sent with the report” (the latest is {version}). Leave empty if you are not sure.',
    gameVersionInvalid: 'Expected format: three numbers separated by dots, such as {version}.',
    gamePlatformLabel: 'Game platform (optional)',
    gamePlatforms: {
      unknown: 'Not sure',
      web: 'Browser (itch.io or this site)',
      desktop: 'Computer (Windows, macOS, Linux)',
      android: 'Android',
    },
    sentInfo: {
      title: 'Information sent with the report',
      gameVersion: 'Game version',
      gamePlatform: 'Game platform',
      os: 'System',
      browser: 'Browser',
      language: 'Language',
      screen: 'Window',
      unknown: 'Unknown',
      unset: 'Not specified',
    },
    attachmentsBusy: 'Screenshots are still uploading: please wait a moment.',
    previewSummary: 'See exactly what will be sent',
    previewLine: 'Version {version} · site · {language} · window {w} × {h}',
    previewNote:
      'Nothing else: no IP address, no cookie, no browsing history. elapsedMs is the time spent on this form (anti-bot); website must stay empty.',
    submit: 'Send the report',
    sending: 'Sending…',
    receipt: {
      stamp: 'Received',
      title: 'Report received',
      number: 'Report number',
      keep: 'Keep this number and this link: they are the only way to follow your report, nothing is kept in this browser.',
      followLabel: 'Follow-up link',
      open: 'Open the follow-up',
      copyLink: 'Copy the link',
      linkCopied: 'Follow-up link copied',
      another: 'Report another problem',
      announce: 'Report received, number {ticket}.',
      attachmentsMissingOne:
        '1 screenshot could not be attached (expired or rejected): the report itself was received.',
      attachmentsMissingMany:
        '{n} screenshots could not be attached (expired or rejected): the report itself was received.',
    },
    failure: {
      toast: 'Report not sent',
      lead: 'The service isn’t responding. Nothing is lost:',
      leadRefused: 'The report was not accepted. Nothing is lost:',
      offline: 'Your device seems to be offline, or the service can’t be reached.',
      timeout: 'No response after 10 seconds.',
      unavailable: 'The report service is unavailable at the moment.',
      disabled: 'Reports are paused at the moment.',
      rateLimited: 'Too many reports sent from your connection. Try again in {delay}.',
      rateLimitedLater: 'Too many reports sent from your connection. Try again later.',
      invalid: 'Check the description (20 to 4,000 characters) and the contact (200 at most).',
      tooLarge: 'The report is too long.',
      help: 'Copy the report and paste it on the forum (without your contact, the forum is public), or try again later.',
      copy: 'Copy the report',
      copied: 'Report copied',
      copyFailed: 'Copying failed: select the text below.',
      copyArea: 'Report to copy',
      retry: 'Try again',
    },
    text: {
      heading: 'Report · L’Arbre aux absents (site)',
      category: 'Category:',
      description: 'Description:',
      diagnostics: 'Diagnostics:',
    },
    already: [
      'Already reported? Check the ',
      { link: 'tickets/', text: 'open tickets' },
      ' and the ',
      { link: 'problemes-connus/', text: 'known issues' },
      '.',
    ] as Rich,
    ticketsLink: 'See the open tickets',
  },

  follow: {
    seoTitle: 'Report follow-up',
    seoDescription: 'Where your report stands: status, replies from the team, deletion on request.',
    kicker: 'Follow-up sheet',
    title: 'Report follow-up',
    loading: 'Reading the sheet…',
    noscript:
      'The follow-up needs JavaScript: the follow-up link is never sent to the site’s server, only the page reads it. Without JavaScript, you can ask about your report on the game’s itch.io forum:',
    forum: 'itch.io forum',
    ticketLabel: 'Number',
    created: 'Sent on {date}',
    updated: 'updated on {date}',
    repliesHeading: 'Replies from the team',
    replyDate: 'On {date}',
    noReplies: 'No reply from the team yet.',
    tokenNote:
      'The link has been removed from the address bar so that it doesn’t stay in your history: keep the link you received to come back.',
    delete: 'Delete my report',
    deleting: 'Deleting…',
    confirm: {
      title: 'Delete this report?',
      text: 'The ticket will no longer be readable, your contact is erased and this follow-up link will stop working.',
      keep: 'Keep',
      confirm: 'Delete',
    },
    deleted: {
      title: 'Report deleted',
      text: 'Your contact is erased and the follow-up link no longer works. Any fix carries on without your data.',
    },
    deleteFailed: 'The report can’t be deleted at the moment. Try again later.',
    missing: {
      title: 'No follow-up link',
      text: 'This page opens with the link you received after a report (it ends with # followed by a code). Open it exactly as it is.',
    },
    notFound: {
      title: 'This follow-up no longer exists',
      text: 'The link is incomplete, the report was deleted, or it was closed more than 12 months ago.',
    },
    error: {
      title: 'The sheet can’t be read at the moment',
      text: 'The report service isn’t responding. Your report isn’t lost: try again in a moment.',
      offline:
        'Your device seems to be offline, or the service can’t be reached. Try again once you’re connected.',
      rateLimited: 'Too many look-ups from your connection. Try again in {delay}.',
      retry: 'Try again',
    },
    reportLink: 'Report a problem',
    knownLink: 'Known issues',
    ticketsLink: 'Open tickets',
  },

  known: {
    seoTitle: 'Known issues',
    seoDescription:
      'Problems in L’Arbre aux absents that the team already knows about, their status and the version that fixes them.',
    kicker: 'Incident register',
    title: 'Known issues',
    lede: 'What the team already knows, most recent first. Your problem isn’t listed? Report it.',
    loading: 'Loading the register…',
    empty: 'No known issues for now.',
    error: 'The register can’t be read at the moment.',
    retry: 'Try again',
    noscript:
      'This list needs JavaScript. Known issues are also discussed on the game’s itch.io forum:',
    forum: 'itch.io forum',
    updated: 'Updated on {date}',
    listLabel: 'Known issues',
    reportLink: 'Report a problem',
    ticketsLink: 'Open tickets',
  },

  tickets: {
    seoTitle: 'Open tickets',
    seoDescription:
      'Every report being handled for L’Arbre aux absents: number, category, status and dates, without the players’ own words.',
    kicker: 'Report register',
    title: 'Open tickets',
    lede: 'Every report in progress, most recent first. What you wrote stays private: only the number, category, status and dates are public, with a title once the team has reviewed one.',
    loading: 'Loading the register…',
    empty: 'No open tickets for now.',
    error: 'The register can’t be read at the moment.',
    offline:
      'Your device seems to be offline, or the service can’t be reached. Try again once you’re connected.',
    rateLimited: 'Too many requests from your connection. Try again in {delay}.',
    retry: 'Try again',
    noscript:
      'This list needs JavaScript. You can also ask about a report on the game’s itch.io forum:',
    forum: 'itch.io forum',
    listLabel: 'Open tickets',
    countOne: '1 open ticket',
    countMany: '{n} open tickets',
    countsLabel: 'Breakdown by status',
    capped: 'Only the {n} most recent are shown.',
    ticketLabel: 'Number',
    statusLabel: 'Status: {status}',
    created: 'Sent on {date}',
    updated: 'updated on {date}',
    sources: { game: 'From the game', site: 'From the website' },
    categories: {
      bug: 'Malfunction',
      blocked: 'Stuck in the investigation',
      text: 'Typo or incorrect text',
      display: 'Display',
      audio: 'Sound',
      controls: 'Controls',
      performance: 'Slowness or crash',
      other: 'Other',
    },
    yours: [
      'Sent a report? Its number is in this list; the details and the team’s replies are on your follow-up link. What this register shows: ',
      { link: 'confidentialite/', text: 'Privacy' },
      '.',
    ] as Rich,
    reportLink: 'Report a problem',
    knownLink: 'Known issues',
  },

  privacy: {
    seoTitle: 'Privacy',
    seoDescription:
      'What problem reports collect, why, where and for how long. No IP address stored, no cookies, deletion on request.',
    kicker: 'Personal data',
    title: 'Privacy',
    lede: 'The site sets no cookies and doesn’t measure its audience (the embedded YouTube trailer and itch.io widget follow their own rules). Only problem reports collect data: here is what, and what becomes of it.',
    sections: [
      {
        id: 'collecte',
        heading: 'What is collected',
        body: [
          [
            'When you report a problem: the category, your description and, if you give one, a contact. Technical diagnostics are added: the version, the platform (site, web, desktop or Android), the language, the window size and the operating system family (“Windows”, “Android”), never the browser’s full identification string.',
          ],
          [
            'From the game, also: the edition, the current case and your settings, plus an anonymised save, without your notes or searches, ',
            { strong: 'only if you tick the box' },
            '. Each form shows exactly what will be sent before you send it.',
          ],
          ['No account, no cookies, no audience measurement.'],
        ] as Rich[],
      },
      {
        id: 'pourquoi',
        heading: 'Why',
        body: [
  changelog: {
    seoTitle: 'What’s new',
    seoDescription:
      'New features and fixes in each version of L’Arbre aux absents, for the game and the website, grouped by published release.',
    kicker: 'Release notes',
    title: 'What’s new',
    lede: 'What changes with each published version of the game. Small touch-ups are grouped with the release that brings them.',
    current: 'Current version:',
    versionLabel: 'Version',
    listLabel: 'Releases, newest first',
    kinds: { new: 'New', improved: 'Improved', fixed: 'Fixed' },
    knownLink: 'Known issues',
    reportLink: 'Report a problem',
  },

          [
            'To understand and fix the problem. The contact is only used to reply to you; it is never published.',
          ],
        ] as Rich[],
      },
      {
        id: 'ou',
        heading: 'Where the data goes',
        body: [
          [
            'The description and diagnostics become a ticket in a ',
            { strong: 'private GitHub repository' },
            ', readable by the team only (GitHub is a provider based in the United States). The ticket contains neither your contact, nor the follow-up link, nor your IP address.',
          ],
          [
            'The contact stays on our report server and ',
            { strong: 'is never sent to GitHub' },
            '.',
          ],
        ] as Rich[],
      },
      {
        id: 'duree',
        heading: 'How long',
        body: [
          [
            'The contact is erased ',
            { strong: '30 days after the ticket is closed' },
            '. The follow-up sheet (fingerprint of the link, status, public replies) is deleted ',
            { strong: '12 months after closure' },
            '.',
          ],
        ] as Rich[],
      },
      {
        id: 'ip',
        heading: 'IP addresses',
        body: [
          [
            'The report service ',
            { strong: 'neither stores nor logs any IP address' },
            '. To limit abuse, it derives a one-way fingerprint that stays in memory, changes every day and is never written down.',
          ],
          [
            'The site and the service go through Cloudflare, which sees IP addresses like any network intermediary and handles them under its own policy.',
          ],
        ] as Rich[],
      },
      {
        id: 'suivi',
        heading: 'The follow-up link',
        body: [
          [
            'The secret code in the link comes after the “#”: the browser never sends it to the site’s server, and the service only keeps a fingerprint of it. The follow-up page removes it from the address bar as soon as it has read it. Anyone who has this link can read and delete the report: don’t share it.',
          ],
        ] as Rich[],
      },
      {
        id: 'droits',
        heading: 'Your rights',
        body: [
          [
            'Delete your report at any time with “Delete my report” on the ',
            { link: 'suivi/', text: 'follow-up page' },
            ': the contact is erased, the description is removed from the ticket and the link stops working.',
          ],
          [
            'To be completely open: GitHub keeps the edit history of a ticket. The previous description remains readable there, ',
            { strong: 'by the team only' },
            ' (the repository is private), and the notifications the team already received when you reported also contain it. It is never made public.',
          ],
          [
            'Lost link, question, access or correction: write to us on the game’s itch.io forum with the report number, never your contact. You can also contact the data protection authority in your country.',
          ],
        ] as Rich[],
      },
    ],
    forum: 'itch.io forum',
    reportLink: 'Report a problem',
    updated: 'Last updated: October 2026',
  },

  palette: {
    groups: [
      {
        title: 'Night ink',
        intro:
          'The desk steeped in the blue of night: a deep ink blue that melts into the wall of the key art, and vellum text.',
      },
      {
        title: 'Saffron, vermilion, celadon',
        intro:
          'Three colours, three roles: saffron for action (only one per screen), vermilion for the brand, celadon for the fern. Stamp violet marks what is established.',
      },
      {
        title: 'Papers and inks',
        intro: 'Everything you read is paper under the light, written in iron-gall ink.',
      },
      {
        title: 'The desk’s materials',
        intro:
          'Kraft folders, bristol index cards with blue ruling and a red header line, label-maker tape.',
      },
      {
        title: 'The key art’s setting',
        intro:
          'The wood of the lamp, the velvet of the curtain, the dusk at the window. Setting only: never text.',
      },
      {
        title: 'The colourist’s washes',
        intro:
          'Eight transparent pigments laid over the engraving, plus two waters. They never carry text on their own.',
      },
    ],
    swatches: {
      '--canvas': ['Night ink', 'Desk background'],
      '--surface-1': ['Night', 'Panels'],
      '--surface-2': ['Light night', 'Fields, hover'],
      '--line-strong': ['Slate', 'Control borders'],
      '--text': ['Vellum', 'Text'],
      '--text-muted': ['Faded vellum', 'Secondary text'],
      '--accent': ['Saffron', 'Action, link, focus'],
      '--accent-edge': ['Burnished saffron', 'Button edge'],
      '--brand': ['Vermilion', 'Titles, kickers, rules'],
      '--brand-fill': ['Dark vermilion', 'Red label'],
      '--fern': ['Celadon', 'Fern, ornaments'],
      '--fern-deep': ['Deep celadon', 'Fern on paper'],
      '--established': ['Stamp ink', '“Established” slot'],
      '--paper-new': ['New paper', 'Cards, letters'],
      '--paper': ['Paper', 'Documents, map'],
      '--paper-aged': ['Aged paper', 'Cuttings, directories'],
      '--paper-stain': ['Foxed paper', 'Hollows, stains'],
      '--ink': ['Iron-gall ink', 'Text on paper'],
      '--ink-muted': ['Diluted ink', 'Secondary text'],
      '--ink-hand': ['Pen ink', 'Handwriting'],
      '--paper-accent': ['Burnished brass', 'Action on paper'],
      '--kraft': ['Kraft', 'Folder'],
      '--kraft-shade': ['Shaded kraft', 'Back of the folder'],
      '--manila': ['Manila', 'Labels, inside'],
      '--card': ['Bristol', 'Index card'],
      '--card-rule': ['Ruling', 'Lines of the card'],
      '--card-margin': ['Header line', 'Red rule of the card'],
      '--label-tape': ['Blue tape', 'Label maker'],
      '--label-tape-red': ['Red tape', 'Label maker, notice'],
      '--wood': ['Shaded wood', 'Desk, lamp'],
      '--wood-lit': ['Lit wood', 'In the pool of light'],
      '--velvet': ['Velvet', 'Curtain'],
      '--dusk-rose': ['Rose dusk', 'Sky'],
      '--dusk-lilac': ['Lilac dusk', 'Sky'],
      '--dusk-peach': ['Peach dusk', 'Sky'],
      '--scrim-art': ['Quiet-zone scrim', 'Under a title set on the art'],
      '--art-wash-safran': ['Saffron', 'Squares, civic buildings'],
      '--art-wash-carmin': ['Carmine', 'Houses, roof tiles'],
      '--art-wash-indigo': ['Indigo', 'Administrations, uniforms'],
      '--art-wash-sienne': ['Sienna', 'Workshops, earth'],
      '--art-wash-sauge': ['Sage', 'Forests, gardens'],
      '--art-wash-lilas': ['Lilac', 'Chapels, mourning'],
      '--art-wash-celadon': ['Celadon', 'Marshes, glass'],
      '--art-wash-ardoise': ['Slate', 'Roofs, stone'],
      '--art-water': ['Water', 'Sea, lakes'],
      '--art-water-deep': ['Deep water', 'Channels'],
    },
  },

  presskit: {
    /** Taille lisible : “1.2 MB”, “340 KB”. */
    size: (bytes: number) => {
      if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    },
    groups: {
      documents: { title: 'Documents', intro: 'The artbook and the press sheet, as PDFs.' },
      logos: {
        title: 'Game title and emblem',
        intro:
          'The title in four colourways: colour on a dark background (main use), colour on a light background, black, white. SVG with outlined text, transparent PNGs.',
      },
      affiches: {
        title: 'A3 posters',
        intro: 'Vector PDF for print, PNG for screens.',
      },
      bannieres: {
        title: 'Banners and social visuals',
        intro: 'The title always set in the quiet zone of the key art, with safe areas respected.',
      },
    },
    labels: {
      'Artbook : art clé, carte, vignettes, portraits, intention artistique':
        'Artbook: key art, map, vignettes, portraits, artistic intent',
      'Fiche presse : présentation courte et longue, fiche technique, liens':
        'Press sheet: short and long descriptions, fact sheet, links',
      'Titre empilé (écran titre), couleurs, pour fond sombre':
        'Stacked title (title screen), colour, for dark backgrounds',
      'Titre empilé (écran titre), couleurs, pour fond clair':
        'Stacked title (title screen), colour, for light backgrounds',
      'Titre empilé (écran titre), monochrome noir': 'Stacked title (title screen), black',
      'Titre empilé (écran titre), monochrome blanc': 'Stacked title (title screen), white',
      'Titre en ligne, couleurs, pour fond sombre':
        'Single-line title, colour, for dark backgrounds',
      'Titre en ligne, couleurs, pour fond clair':
        'Single-line title, colour, for light backgrounds',
      'Titre en ligne, monochrome noir': 'Single-line title, black',
      'Titre en ligne, monochrome blanc': 'Single-line title, white',
      'Emblème, icône d’application (coins arrondis)': 'Emblem, app icon (rounded corners)',
      'Emblème, avatar de réseau social (carré plein)': 'Emblem, social media avatar (full square)',
      'Affiche « Le bureau sous la lampe » (art clé)': 'Poster “The desk under the lamp” (key art)',
      'Affiche « La Velmarche » (carte, sur papier)': 'Poster “Velmarche” (map, on paper)',
      'Affiche « Qui sont les absents ? » (portraits)': 'Poster “Who are the absent?” (portraits)',
      'itch.io, bannière de page (affichée en 960 × 300)':
        'itch.io, page banner (displayed at 960 × 300)',
      'X (Twitter), en-tête de profil': 'X (Twitter), profile header',
      'Facebook, photo de couverture (2× 820 × 312)': 'Facebook, cover photo (2× 820 × 312)',
      'YouTube, bannière de chaîne (zone sûre 1546 × 423 au centre)':
        'YouTube, channel banner (1546 × 423 safe area in the centre)',
      'Twitch, bannière de profil': 'Twitch, profile banner',
      'Partage (Open Graph, Discord), aperçu de lien':
        'Sharing (Open Graph, Discord), link preview',
      'Visuel carré (Instagram, Mastodon, Bluesky)': 'Square visual (Instagram, Mastodon, Bluesky)',
      'Story verticale (Instagram, TikTok, Shorts), zones sûres 250 px':
        'Vertical story (Instagram, TikTok, Shorts), 250 px safe areas',
      'Le kit complet : logos, affiches, bannières, artbook et fiche':
        'The complete kit: logos, posters, banners, artbook and press sheet',
      'Capture : écran titre': 'Screenshot: title screen',
      'Capture : l’établi': 'Screenshot: the workbench',
      'Capture : le catalogue': 'Screenshot: the catalogue',
      'Capture : lecture d’une lettre': 'Screenshot: reading a letter',
      'Capture : la carte': 'Screenshot: the map',
      'Capture : l’arbre': 'Screenshot: the tree',
      'Couverture itch.io': 'itch.io cover',
    },
    details: [
      [/^A4 paysage, (\d+) pages$/, 'A4 landscape, $1 pages'],
      [/^A4 portrait, (\d+) pages, imprimable$/, 'A4 portrait, $1 pages, printable'],
      [/^vectoriel, texte vectorisé$/, 'vector, outlined text'],
      [/^vectoriel, halo de lampe en image$/, 'vector, lamp glow as an image'],
      [/fond transparent$/, 'transparent background'],
      [/coins transparents$/, 'transparent corners'],
      [/^A3 portrait, vectoriel, pour l’impression$/, 'A3 portrait, vector, for print'],
      [/\(A3 à 150 dpi, A4 à 300 dpi\)$/, '(A3 at 150 dpi, A4 at 300 dpi)'],
      [/^tout le kit, avec un fichier LISEZMOI$/, 'the whole kit, with a README file (French)'],
    ],
  },
} satisfies SiteStrings;
