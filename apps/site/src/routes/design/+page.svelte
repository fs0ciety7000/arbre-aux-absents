<!--
  /design : démonstration du design system (DESIGN §12), non indexée. Même ordre que DESIGN.md :
  réglages, couleurs, typographie et titre du jeu, matières, boutons, onglets, fiches, tampons et
  pastilles, champs, retours, mouvement (catalogue rejouable, transitions, actions), art clé,
  maquette du Bureau, illustration (papier et nuit), icônes et ornements, curseurs, logos.
  v2 « Le dossier vivant » (DESIGN §12).
  Les réglages posent les attributs `data-*` sur <html>, comme le jeu (§4.2).
-->
<script lang="ts">
  import {
    Badge,
    Button,
    Card,
    Celebrate,
    Combobox,
    Dialog,
    DymoLabel,
    FlipCard,
    Folder,
    Icon,
    IconButton,
    ICON_NAMES,
    IndexCard,
    InkReveal,
    KeyHint,
    Loader,
    Ornament,
    ORNAMENT_NAMES,
    Panel,
    PaperSheet,
    Select,
    Slider,
    Stamp,
    Tabs,
    Tape,
    TextField,
    Toggle,
    Tooltip,
    ToastRegion,
    Wordmark,
    pushToast,
    type Candidate,
    type TabItem,
  } from '@arbre/ui';
  import {
    deal,
    inkIn,
    paperIn,
    reveal,
    rustle,
    screenIn,
    sheetPull,
    stampIn,
    tilt,
  } from '@arbre/ui/motion';
  import HeroArt from '#lib/components/HeroArt.svelte';
  import { onDestroy } from 'svelte';
  import { HOUSE_LOGOS } from '#lib/art/brand';
  import BrandLogo from '#lib/components/BrandLogo.svelte';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';
  import SvgTree from '#lib/svg/SvgTree.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // ── Réglages (DESIGN §4.2) ─────────────────────────────────────────
  let textScale = $state('1');
  let readingFont = $state('');
  let lineSpacing = $state('');
  let colorVision = $state('');
  let motion = $state('');
  let letterSpacing = $state(false);
  let highContrast = $state(false);
  let replaceHand = $state(false);
  let textureOff = $state(false);
  let inkCursors = $state(false);

  const settings = $derived<Record<string, string | null>>({
    'data-text-scale': textScale === '1' ? null : textScale,
    'data-reading-font': readingFont || null,
    'data-line-spacing': lineSpacing || null,
    'data-letter-spacing': letterSpacing ? 'wide' : null,
    'data-contrast': highContrast ? 'high' : null,
    'data-handwriting': replaceHand ? 'replace' : null,
    'data-texture': textureOff ? 'off' : null,
    'data-color-vision': colorVision || null,
    'data-motion': motion || null,
    'data-cursors': inkCursors ? 'ink' : null,
  });

  $effect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(settings)) {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
  });
  onDestroy(() => {
    if (typeof document === 'undefined') return;
    for (const name of Object.keys(settings)) document.documentElement.removeAttribute(name);
  });

  // ── Couleurs ──────────────────────────────────────────────────────
  const semantic = [
    '--canvas',
    '--surface-1',
    '--surface-2',
    '--surface-3',
    '--line',
    '--line-strong',
    '--text',
    '--text-muted',
    '--text-faint',
    '--accent',
    '--accent-strong',
    '--accent-edge',
    '--brand',
    '--brand-strong',
    '--fern',
    '--established',
    '--danger',
    '--warning',
    '--success',
    '--info',
  ];
  /** v2 : matières et décor de l'art clé (globaux, jamais remappés en texte). */
  const materials = [
    '--desk',
    '--kraft',
    '--kraft-shade',
    '--manila',
    '--card',
    '--card-rule',
    '--card-margin',
    '--tape',
    '--label-tape',
    '--label-tape-red',
    '--string',
    '--metal',
    '--wood',
    '--wood-lit',
    '--velvet',
    '--dusk-rose',
    '--dusk-lilac',
    '--dusk-peach',
    '--lamp-glow',
    '--scrim-art',
  ];
  const pigments = [
    'wash-safran',
    'wash-carmin',
    'wash-indigo',
    'wash-sienne',
    'wash-sauge',
    'wash-lilas',
    'wash-celadon',
    'wash-ardoise',
    'water',
    'water-deep',
  ];
  const steps = [
    '--step-5',
    '--step-4',
    '--step-3',
    '--step-2',
    '--step-1',
    '--step-read',
    '--step-0',
    '--step--1',
  ];

  // ── Onglets ───────────────────────────────────────────────────────
  const sideTabs: TabItem[] = [
    { id: 'reader', label: 'Lecteur', icon: 'reader' },
    { id: 'archives', label: 'Archives', icon: 'archives', badge: 3, badgeLabel: '3 non lus' },
    { id: 'catalog', label: 'Catalogue', icon: 'catalog' },
    { id: 'notebook', label: 'Carnet', icon: 'notebook' },
    { id: 'journal', label: 'Journal', icon: 'journal' },
    { id: 'help', label: 'Aide', icon: 'help' },
  ];
  const plainTabs: TabItem[] = sideTabs.map(({ id, label }) => ({ id, label }));
  const barTabs: TabItem[] = [
    { id: 'tree', label: 'Arbre', icon: 'tree' },
    { id: 'archives', label: 'Archives', icon: 'archives' },
    { id: 'catalog', label: 'Catalogue', icon: 'catalog' },
    { id: 'notebook', label: 'Carnet', icon: 'notebook' },
    { id: 'map', label: 'Carte', icon: 'map' },
  ];
  const railTabs: TabItem[] = [
    { id: 'tree', label: 'Arbre', icon: 'tree' },
    { id: 'map', label: 'Carte', icon: 'map' },
    { id: 'pinboard', label: 'Tableau', icon: 'pinboard' },
    { id: 'faces', label: 'Visages', icon: 'faces' },
  ];
  let lineValue = $state('reader');
  let compactValue = $state('archives');
  let scrollValue = $state('journal');
  // Valeur hors barre (ex. « Journal » ouvert depuis un menu) : aucun onglet actif.
  let barValue = $state('journal');
  let railValue = $state('tree');

  let folderValue = $state('archives');
  const folderTabs: TabItem[] = [
    { id: 'archives', label: 'Archives', icon: 'archives' },
    { id: 'catalog', label: 'Catalogue', icon: 'catalog' },
    { id: 'notebook', label: 'Carnet', icon: 'notebook' },
  ];

  // ── Tampons ───────────────────────────────────────────────────────
  let replay = $state(0);

  // ── Titre, mouvement, scène (v2) ──────────────────────────────────
  let titleKey = $state(0);
  let iconWash = $state(true);
  let iconClean = $state(false);
  /** Catalogue CSS (§8.3) : chaque démo rejoue sa classe quand sa clé change. */
  const catalogue = [
    { cls: 'mv-deal', label: 'Distribuer', note: 'fiche, chemise' },
    { cls: 'mv-settle', label: 'Poser', note: 'feuille, note' },
    { cls: 'mv-sheet', label: 'Tirer', note: 'document ouvert' },
    { cls: 'mv-rise', label: 'Monter', note: 'texte, liste' },
    { cls: 'mv-ink', label: 'Encrer', note: 'titre, mot' },
    { cls: 'mv-stamp', label: 'Tamponner', note: 'case établie' },
    { cls: 'mv-thud', label: 'Encaisser', note: 'cible du tampon' },
    { cls: 'mv-lock', label: 'Verrouiller', note: 'cadenas' },
    { cls: 'mv-ripple', label: 'Onde', note: 'dépôt réussi' },
    { cls: 'mv-pop', label: 'Compter', note: 'compteur' },
  ];
  let catalogueKeys = $state(catalogue.map(() => 0));
  const transitions = { deal, paperIn, sheetPull, stampIn, inkIn, screenIn };
  type TransitionId = keyof typeof transitions;
  const transitionIds = Object.keys(transitions) as TransitionId[];
  /** Joue la transition de motion.ts nommée (une directive Svelte veut un identifiant). */
  function play(node: Element, p: { id: TransitionId; index: number }) {
    return transitions[p.id](node, { index: p.index });
  }
  let shown = $state(true);
  let inkKey = $state(0);
  let rustleKey = $state(0);
  let flipped = $state(false);
  let celebrateKey = $state(0);

  // ── Champs ────────────────────────────────────────────────────────
  let name = $state('');
  let note = $state('');
  let job = $state('papetier');
  let comboValue: string | null = $state(null);
  let notify = $state(true);
  let volume = $state(60);
  const jobs = [
    { value: 'papetier', label: 'Papetier' },
    { value: 'gardienne', label: 'Gardienne de phare' },
    { value: 'institutrice', label: 'Institutrice' },
    { value: 'photographe', label: 'Photographe' },
  ];
  const candidates: Candidate[] = [
    { id: 'c1', label: 'Aurèle Vasquin', detail: 'vu dans : Programme de l’Opéra, 1929' },
    { id: 'c2', label: 'Ambroise Destrade', detail: 'vu dans : Bulletin d’Ordre, 1938' },
    {
      id: 'c3',
      label: 'Joren Haask',
      detail: 'vu dans : Registre de Vellaak',
      note: 'déjà utilisé dans 1 case',
    },
    { id: 'c4', label: 'Mirela Vasko', detail: 'vu dans : Messager de Brenzac' },
  ];

  // ── Retours ───────────────────────────────────────────────────────
  let dialogOpen = $state(false);

  const verbs = [
    { verb: 'look', label: 'Regarder' },
    { verb: 'take', label: 'Prendre' },
    { verb: 'hold', label: 'Déplacer' },
    { verb: 'write', label: 'Écrire' },
    { verb: 'pin', label: 'Épingler' },
    { verb: 'use', label: 'Utiliser dans l’arbre' },
  ];

  const states: { id: string; state: 'open' | 'mentioned' }[] = [
    { id: 'saint-ormel', state: 'mentioned' },
    { id: 'aubrelieu', state: 'open' },
    { id: 'foret-de-sorbe', state: 'mentioned' },
    { id: 'moulinvert', state: 'open' },
  ];
  const stateOf = (id: string | undefined) =>
    states.find((s) => `place-${s.id}` === id)?.state ?? 'open';
</script>

<svelte:head>
  <title>Design system · L’Arbre aux absents</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="Démonstration du système de design de L’Arbre aux absents." />
</svelte:head>

<ToastRegion />

<div class="container page-head">
  <p class="kicker">Design system · v2</p>
  <h1>Le dossier <em>vivant</em></h1>
  <p class="lede">
    Tokens, primitives et réglages du jeu, dans l’ordre de <code>docs/DESIGN.md</code>. Page de
    travail, non indexée.
  </p>
</div>

<div class="container sections">
  <!-- 1. Réglages -->
  <section aria-labelledby="d-settings" class="demo settings">
    <h2 id="d-settings">Réglages du joueur</h2>
    <p class="hint">
      Posent les attributs <code>data-*</code> sur <code>&lt;html&gt;</code> (§4.2), combinables.
    </p>
    <div class="settings-grid">
      <Select
        label="Taille du texte"
        bind:value={textScale}
        options={[
          { value: '0.875', label: '87,5 %' },
          { value: '1', label: '100 %' },
          { value: '1.25', label: '125 %' },
          { value: '1.5', label: '150 %' },
          { value: '2', label: '200 %' },
        ]}
      />
      <Select
        label="Police de lecture"
        bind:value={readingFont}
        options={[
          { value: '', label: 'Par défaut (Literata)' },
          { value: 'hyperlegible', label: 'Lisibilité (Atkinson)' },
          { value: 'dyslexic', label: 'Dyslexie' },
        ]}
      />
      <Select
        label="Interlignage"
        bind:value={lineSpacing}
        options={[
          { value: '', label: 'Normal' },
          { value: 'wide', label: 'Large' },
          { value: 'wider', label: 'Très large' },
        ]}
      />
      <Select
        label="Vision des couleurs"
        bind:value={colorVision}
        options={[
          { value: '', label: 'Par défaut' },
          { value: 'protanopia', label: 'Protanopie' },
          { value: 'deuteranopia', label: 'Deutéranopie' },
          { value: 'tritanopia', label: 'Tritanopie' },
        ]}
      />
      <Select
        label="Mouvement"
        bind:value={motion}
        options={[
          { value: '', label: 'Selon le système' },
          { value: 'reduced', label: 'Réduit' },
          { value: 'full', label: 'Complet' },
        ]}
      />
      <Toggle label="Espacement des lettres et des mots" bind:checked={letterSpacing} />
      <Toggle label="Contraste élevé" bind:checked={highContrast} />
      <Toggle label="Remplacer l’écriture manuscrite" bind:checked={replaceHand} />
      <Toggle label="Réduire la texture du papier" bind:checked={textureOff} />
      <Toggle label="Curseurs encrés (data-cursors)" bind:checked={inkCursors} />
    </div>
  </section>

  <!-- 2. Couleurs -->
  <section aria-labelledby="d-colors" class="demo">
    <h2 id="d-colors">Couleurs</h2>
    <div class="two">
      {#each ['Lampe', 'Papier', 'Kraft'] as ctx (ctx)}
        <div
          class="ctx"
          data-surface={ctx === 'Papier' ? 'paper' : ctx === 'Kraft' ? 'kraft' : undefined}
        >
          <h3>{ctx}</h3>
          <ul class="tokens">
            {#each semantic as t (t)}
              <li>
                <span class="chip" style:background="var({t})" aria-hidden="true"></span>
                <code>{t}</code>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    <h3>Matières et décor (§3.3, globaux)</h3>
    <ul class="tokens">
      {#each materials as t (t)}
        <li>
          <span class="chip" style:background="var({t})" aria-hidden="true"></span>
          <code>{t}</code>
        </li>
      {/each}
    </ul>
    <h3>États sur bureau et sur papier (palettes de vision, §3.7)</h3>
    <div class="two">
      {#each ['Lampe', 'Papier'] as ctx (ctx)}
        <div class="ctx state-row" data-surface={ctx === 'Papier' ? 'paper' : undefined}>
          <Badge tone="danger" iconName="danger">Erreur</Badge>
          <Badge tone="warning" iconName="warning">Attention</Badge>
          <Badge tone="success" iconName="check">Tout consulté</Badge>
          <Badge tone="info" iconName="info">Mentionné</Badge>
          <Badge tone="established" iconName="lock">Établi</Badge>
          <Badge tone="danger" variant="solid">Plein</Badge>
          <Badge tone="success" variant="solid">Plein</Badge>
          <Badge tone="info" variant="solid">Plein</Badge>
          <Stamp text="Établi" size="s" label="Tampon Établi" />
          <Stamp text="Refusé" tone="danger" size="s" label="Tampon Refusé" />
        </div>
      {/each}
    </div>
  </section>

  <!-- 3. Typographie -->
  <section aria-labelledby="d-type" class="demo">
    <h2 id="d-type">Typographie</h2>
    <h3>Le titre du jeu (Wordmark, §4.3) : affiche, écran titre, en-tête</h3>
    <div class="title-stage desk-surface" role="img" aria-label="Titre du jeu, taille affiche">
      {#key titleKey}
        <span class="wm" aria-hidden="true"
          ><Wordmark
            size="hero"
            as="span"
            animate
            glow
            kicker="Un jeu d’enquête généalogique"
            tagline="Une famille effacée des registres."
          /></span
        >
      {/key}
    </div>
    <div class="row">
      <Button variant="ghost" iconName="sparkle" onclick={() => titleKey++}>Rejouer le titre</Button
      >
    </div>
    <div class="two">
      <div
        class="ctx mat-paper"
        data-surface="paper"
        role="img"
        aria-label="Titre du jeu, taille écran titre"
      >
        <span class="wm" aria-hidden="true"><Wordmark size="title" as="span" /></span>
      </div>
      <div class="ctx header-ctx" role="img" aria-label="Titre du jeu, taille en-tête">
        <span class="wm" aria-hidden="true"><Wordmark size="header" as="span" /></span>
      </div>
    </div>
    <h3>Fraunces (titrage), Oswald (étiquettes)</h3>
    <p class="display-sample">Sept siècles <em>en quelques dates</em></p>
    <p class="kicker">Surtitre Oswald à tiret vermillon</p>
    <ul class="steps">
      {#each steps as s (s)}
        <li><code>{s}</code><span style:font-size="var({s})">L’Arbre aux absents</span></li>
      {/each}
    </ul>
    <div class="paper-sheet grain" data-surface="paper">
      <p class="reading">
        Aubrelieu, le 3 mai 1929. La lettre mentionne
        <span class="kw" data-state="new" role="button" tabindex="0">le phare de Tennok</span>, puis
        <span class="kw" data-state="known" role="button" tabindex="0">les Papeteries</span> et
        enfin <span class="kw" data-state="searched" role="button" tabindex="0">Port-Sénane</span>.
        Surlignages : <mark class="hl-1">jaune</mark>, <mark class="hl-2">vert</mark>,
        <mark class="hl-3">bleu</mark>, <mark class="hl-4">rose</mark>,
        <mark class="hl-5">orange</mark>.
      </p>
      <p class="ink-type">OFFICE DE RÉINSCRIPTION CIVILE — RAPPORT N° 74-0112</p>
      <p class="ink-hand hand">Bons baisers des Bains-de-Mérande, à bientôt !</p>
    </div>
  </section>

  <!-- 4. Boutons -->
  <section aria-labelledby="d-buttons" class="demo">
    <h2 id="d-buttons">Boutons</h2>
    {#each ['desk', 'paper'] as ctx (ctx)}
      <div class="row ctx" data-surface={ctx === 'paper' ? 'paper' : undefined}>
        <Button variant="primary" iconName="use">Utiliser</Button>
        <Button>Secondaire</Button>
        <Button variant="ghost" iconName="pin">Épingler</Button>
        <Button variant="danger" iconName="trash">Supprimer</Button>
        <Button loading>Chargement</Button>
        <Button disabled>Désactivé</Button>
        <Button size="l" variant="secondary">Taille l</Button>
        <IconButton label="Rechercher" icon="search" />
        <IconButton label="Carnet" icon="notebook" variant="ghost" badge={2} badgeLabel="2 notes" />
        <IconButton label="Surligner" icon="highlight" pressed />
      </div>
    {/each}
  </section>

  <!-- 5. Onglets -->
  <section aria-labelledby="d-tabs" class="demo">
    <h2 id="d-tabs">Onglets</h2>
    <h3>Line</h3>
    <Tabs items={sideTabs} bind:value={lineValue} label="Volet (large)" idPrefix="t-line">
      {#snippet children(id)}<p class="tab-panel">Panneau « {id} »</p>{/snippet}
    </Tabs>
    <div class="two">
      <div>
        <h3>Line compact (volet de 440 px, icônes)</h3>
        <div class="frame-440">
          <Tabs
            items={sideTabs}
            bind:value={compactValue}
            label="Volet compact"
            idPrefix="t-compact"
          >
            {#snippet children(id)}<p class="tab-panel">Panneau « {id} »</p>{/snippet}
          </Tabs>
        </div>
      </div>
      <div>
        <h3>Line sans icônes (défilement à fondus)</h3>
        <div class="frame-440">
          <Tabs
            items={plainTabs}
            bind:value={scrollValue}
            label="Volet sans icônes"
            idPrefix="t-scroll"
          >
            {#snippet children(id)}<p class="tab-panel">Panneau « {id} »</p>{/snippet}
          </Tabs>
        </div>
      </div>
    </div>
    <div class="two">
      <div>
        <h3>Bar (360 px, valeur hors barre)</h3>
        <div class="frame-360">
          <Tabs
            items={barTabs}
            bind:value={barValue}
            variant="bar"
            label="Navigation du téléphone"
            idPrefix="t-bar"
          >
            {#snippet children(id)}<p class="tab-panel">Panneau « {id} »</p>{/snippet}
          </Tabs>
        </div>
      </div>
      <div>
        <h3>Rail</h3>
        <div class="rail-frame">
          <Tabs
            items={railTabs}
            bind:value={railValue}
            variant="rail"
            label="Zone principale"
            idPrefix="t-rail"
          >
            {#snippet children(id)}<p class="tab-panel">Panneau « {id} »</p>{/snippet}
          </Tabs>
        </div>
      </div>
    </div>
  </section>

  <!-- 5 bis. Onglets de chemise -->
  <section aria-labelledby="d-folder-tabs" class="demo">
    <h2 id="d-folder-tabs">Onglets de chemise (<code>variant="folder"</code>)</h2>
    <div class="frame-440">
      <Tabs
        items={folderTabs}
        bind:value={folderValue}
        variant="folder"
        label="Chemise"
        idPrefix="t-folder"
      >
        {#snippet children(id)}<p class="tab-panel">Intérieur de la chemise : « {id} »</p>{/snippet}
      </Tabs>
    </div>
  </section>

  <!-- 5 ter. Matières -->
  <section aria-labelledby="d-materials" class="demo">
    <h2 id="d-materials">Matières (§6)</h2>
    <div class="desk-demo desk-surface">
      <div class="blotter mat-blotter">
        <div class="materials">
          <PaperSheet tone="new" tilt={-1.5} fastener="tape">
            <p class="reading">Papier neuf, ruban adhésif.</p>
          </PaperSheet>
          <PaperSheet tone="paper" tilt={1} fastener="clip" edge="torn">
            <p class="reading">Papier, trombone, bord déchiré.</p>
          </PaperSheet>
          <PaperSheet tone="aged" tilt={-0.6} fastener="pin" edge="perforated" sway>
            <p class="reading">Papier vieilli, punaise, perforé, balancement.</p>
          </PaperSheet>
        </div>
      </div>
    </div>
    <div class="materials">
      <Folder title="Chemise kraft" cote="ORC 74-118" headingLevel={3}>
        <p>Intérieur kraft : texte à l’encre, accent safran bruni.</p>
        <DymoLabel text="Pièce n° 3" />
      </Folder>
      <Folder
        title="Chemise manille"
        cote="ORC 74-119"
        tone="manila"
        tabAlign="end"
        headingLevel={3}
      >
        <p>Onglet à droite.</p>
      </Folder>
      <IndexCard title="Fiche bristol" cote="RG-09" tilt={-1}>
        Réglure bleue, ligne de tête vermillon, texte tapé.
      </IndexCard>
    </div>
    <div class="row">
      <DymoLabel text="Étiqueteuse" tilt={-2} />
      <DymoLabel text="Annonce" tone="red" tilt={1.5} />
      <Tape length="7rem" />
      <Tape length="5rem" rotate={8} />
    </div>
  </section>

  <!-- 6. Fiches -->
  <section aria-labelledby="d-cards" class="demo">
    <h2 id="d-cards">Fiches, documents, photos</h2>
    <div class="cards">
      <Card title="Fiche du Catalogue" kicker="Fiche" meta="Cote 74-0112" unread>
        Une fiche d’outil sur le bureau.
      </Card>
      <Card variant="document" title="Lettre du 3 mai" kicker="Lettre" meta="1929" tilt={-1} pinned>
        Un document posé sur la table.
      </Card>
      <Card variant="photo" title="Au bord du lac" kicker="Photographie" meta="1941" tilt={1.2}>
        {#snippet media()}
          <div class="photo-ph art" aria-hidden="true">
            <svg viewBox="0 0 160 110"
              ><rect class="photo-paper" width="160" height="110" /><rect
                class="photo-mid"
                x="10"
                y="60"
                width="140"
                height="40"
              /><circle class="photo-dark" cx="60" cy="50" r="14" /><circle
                class="photo-dark"
                cx="100"
                cy="48"
                r="12"
              /></svg
            >
          </div>
        {/snippet}
      </Card>
      <Card title="Sélectionnable" kicker="Fiche" onactivate={() => {}} selected
        >Survol, sélection.</Card
      >
      <Card variant="index" title="Fiche index" meta="RG-12" deal={0} onactivate={() => {}}
        >Distribuée à l’apparition, cliquable.</Card
      >
    </div>
  </section>

  <!-- 7. Tampons et pastilles -->
  <section aria-labelledby="d-stamps" class="demo">
    <h2 id="d-stamps">Tampons et pastilles</h2>
    <div class="row">
      {#key replay}
        {#each [0, 1, 2, 3] as i (i)}
          <Stamp animate delay={i} label="Tampon Établi {i + 1}" />
        {/each}
      {/key}
      <Button variant="ghost" iconName="stamp" onclick={() => replay++}>Rejouer la cascade</Button>
    </div>
    <div class="row">
      <Stamp tone="ink" text="Copie" size="l" label="Tampon Copie" />
      <Badge>Neutre</Badge>
      <Badge tone="accent" dot>Nouveau</Badge>
      <Badge tone="established" variant="outline" iconName="lock">Établi</Badge>
    </div>
  </section>

  <!-- 8. Champs -->
  <section aria-labelledby="d-fields" class="demo">
    <h2 id="d-fields">Champs</h2>
    <div class="fields">
      <TextField label="Prénom" bind:value={name} hint="Tel qu’il apparaît dans les actes." />
      <TextField label="Recherche" variant="typewriter" iconName="search" value="TENNOK" />
      <TextField label="Nom" value="Vas" error="Aucun candidat ne commence ainsi." />
      <TextField label="Note" multiline rows={3} maxlength={140} bind:value={note} />
      <Select label="Métier" options={jobs} bind:value={job} />
      <Combobox label="Candidat" options={candidates} bind:value={comboValue} />
      <Toggle
        label="Annoncer les verrouillages"
        bind:checked={notify}
        description="Région live polie."
        showState
      />
      <Slider
        label="Volume de la musique"
        bind:value={volume}
        min={0}
        max={100}
        step={10}
        format={(v) => `${v} %`}
        marks={[
          { value: 0, label: 'Muet' },
          { value: 100, label: 'Max' },
        ]}
      />
    </div>
  </section>

  <!-- 9. Retours -->
  <section aria-labelledby="d-feedback" class="demo">
    <h2 id="d-feedback">Retours</h2>
    <div class="row">
      <Button
        onclick={() =>
          pushToast({ tone: 'info', title: 'Nouveau document', message: 'Ajouté aux Archives.' })}
        >Toast info</Button
      >
      <Button
        onclick={() =>
          pushToast({
            tone: 'established',
            title: 'Branche établie',
            message: 'Trois cases verrouillées.',
          })}>Toast établi</Button
      >
      <Button
        onclick={() =>
          pushToast({
            tone: 'danger',
            title: 'Sauvegarde impossible',
            message: 'Le disque est plein.',
          })}>Toast danger</Button
      >
      <Tooltip text="Raccourci : Ctrl + K">
        {#snippet children(attrs)}
          <Button {...attrs}>Info-bulle</Button>
        {/snippet}
      </Tooltip>
      <Button variant="primary" onclick={() => (dialogOpen = true)}>Ouvrir la fiche</Button>
    </div>
    <div class="row">
      <Loader label="Chargement des archives" showLabel delay={0} />
    </div>
    <div class="row keys">
      <KeyHint action="Ouvrir" device="keyboard" keys={['Entrée']} />
      <KeyHint action="Repérer" device="keyboard" keys={['Espace']} />
      <KeyHint action="Valider" device="gamepad" pad="south" padStyle="xbox" />
      <KeyHint action="Valider" device="gamepad" pad="south" padStyle="playstation" />
      <KeyHint action="Valider" device="gamepad" pad="south" padStyle="nintendo" />
      <KeyHint action="Repérer" device="gamepad" pad="lt" />
      <KeyHint action="Épingler" device="touch" gesture="Appui long" />
    </div>
    <Dialog
      bind:open={dialogOpen}
      title="Carte de révélation"
      kicker="Révélation"
      surface="paper"
      description="Une fiche papier se pose au centre."
    >
      <p class="reading">Les trois cases de la branche sont établies.</p>
      {#snippet actions()}
        <Button variant="primary" onclick={() => (dialogOpen = false)}>Fermer</Button>
      {/snippet}
    </Dialog>
  </section>

  <!-- 9 bis. Mouvement (§7–§8) -->
  <section aria-labelledby="d-motion" class="demo">
    <h2 id="d-motion">Mouvement : catalogue rejouable (§8.3)</h2>
    <p class="hint">
      Chaque tuile rejoue sa classe <code>mv-*</code>. Réglage « Mouvement : réduit » : fondus
      seuls.
    </p>
    <ul class="catalogue">
      {#each catalogue as c, i (c.cls)}
        <li>
          <button
            type="button"
            class="cat-tile"
            onclick={() => (catalogueKeys[i] = (catalogueKeys[i] ?? 0) + 1)}
          >
            <span class="cat-stage" aria-hidden="true">
              {#key catalogueKeys[i]}
                <span class="cat-sample {c.cls}" style:--tilt="-2deg">
                  {#if c.cls === 'mv-lock'}<Icon
                      name="lock"
                      size="1.75rem"
                    />{:else if c.cls === 'mv-pop'}12{:else}<span class="cat-card"></span>{/if}
                </span>
              {/key}
            </span>
            <span class="cat-name"><code>.{c.cls}</code> {c.label}</span>
            <span class="cat-note">{c.note}</span>
          </button>
        </li>
      {/each}
    </ul>
    <h3>
      Ambiance (boucles) : <code>mv-flicker</code>, <code>mv-breathe</code>, <code>mv-sway</code>
    </h3>
    <div class="row ambient">
      <span class="amb mv-flicker"><Icon name="lamp" size="2.5rem" wash="var(--accent)" /></span>
      <span class="amb mv-breathe glow-dot" aria-hidden="true"></span>
      <span class="amb mv-sway"><Ornament name="pin" size="2rem" /></span>
    </div>
    <h3>Transitions Svelte (<code>@arbre/ui/motion</code>, §8.6)</h3>
    <div class="row">
      <Button variant="secondary" iconName="flip" onclick={() => (shown = !shown)}
        >{shown ? 'Ranger' : 'Distribuer'}</Button
      >
    </div>
    <ul class="transitions">
      {#each transitionIds as id, i (id)}
        <li>
          <span class="tr-stage">
            {#if shown}
              <span class="tr-card" in:play={{ id, index: i }} out:play={{ id, index: 0 }}>
                <code>{id}</code>
              </span>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
    <h3>
      Primitives : InkReveal, FlipCard, Celebrate ; actions <code>reveal</code>, <code>tilt</code>,
      <code>rustle</code>
    </h3>
    <div class="prims">
      <div class="prim">
        <div class="prim-stage">
          <InkReveal from="left" blur key={inkKey}>
            <span class="ink-word">Velmarche</span>
          </InkReveal>
        </div>
        <Button variant="ghost" iconName="quill" onclick={() => inkKey++}>Encrer</Button>
      </div>
      <div class="prim">
        <div class="prim-stage flip-stage">
          <FlipCard bind:flipped>
            {#snippet front()}
              <IndexCard title="Recto" cote="Pl. I">Le portrait.</IndexCard>
            {/snippet}
            {#snippet back()}
              <IndexCard title="Verso" cote="Pl. I">« Studio Haask, 1931 »</IndexCard>
            {/snippet}
          </FlipCard>
        </div>
        <Button variant="ghost" iconName="flip" onclick={() => (flipped = !flipped)}
          >Retourner</Button
        >
      </div>
      <div class="prim">
        <div class="prim-stage celebrate-stage">
          <Stamp text="Établi" size="m" label="Tampon Établi" />
          <Celebrate key={celebrateKey} count={32} />
        </div>
        <Button variant="ghost" iconName="sparkle" onclick={() => celebrateKey++}>Célébrer</Button>
      </div>
      <div class="prim">
        <div class="prim-stage" use:rustle={rustleKey}>
          <div class="tilt-demo" use:tilt={6} use:reveal>
            <PaperSheet tone="new" fastener="pin">
              <p class="reading">Survolez : <code>use:tilt</code>.</p>
            </PaperSheet>
          </div>
        </div>
        <Button variant="ghost" iconName="note" onclick={() => rustleKey++}>Froisser</Button>
      </div>
    </div>
  </section>

  <!-- 9 ter. Art clé (§8.5) -->
  <section aria-labelledby="d-keyart" class="demo">
    <h2 id="d-keyart">Art clé vivant (<code>KeyArt</code>, 16:9 et 4:5)</h2>
    <p class="hint">
      Fond en image autonome, scène vivante (rideau, lampe, poussières, vapeur) inline par-dessus.
      Figée en mouvement réduit.
    </p>
    <div class="keyarts">
      <HeroArt
        images={data.hero.images}
        live={data.hero.live}
        alt={data.hero.alt}
        priority={false}
        only="wide"
      />
      <HeroArt
        images={data.hero.images}
        live={data.hero.live}
        alt={data.hero.alt}
        priority={false}
        only="tall"
      />
    </div>
  </section>

  <!-- 10. Maquette du Bureau -->
  <section aria-labelledby="d-desk" class="demo">
    <h2 id="d-desk">Maquette du Bureau</h2>
    <div class="desk">
      <div class="desk-rail">
        <Tabs items={railTabs} value="tree" variant="rail" label="Bureau" idPrefix="t-desk">
          {#snippet children(id)}<p class="tab-panel">Panneau « {id} »</p>{/snippet}
        </Tabs>
      </div>
      <div class="desk-main">
        <div class="slots">
          {#each ['Prénom Nom', 'Prénom Nom', 'Prénom Nom'] as s, i (i)}
            <div class="slot" class:locked={i === 0}>
              <Icon name={i === 0 ? 'lock' : 'unknown-person'} />
              <span>{s}</span>
            </div>
          {/each}
        </div>
      </div>
      <Panel title="Lecteur" kicker="Lettre" surface="paper" as="section" class="desk-reader">
        <p class="reading">
          Ma chère sœur, le vent n’a pas cessé depuis trois jours sur le
          <span class="kw" data-state="new" role="button" tabindex="0">cap</span>…
        </p>
      </Panel>
    </div>
    <h3>Panel dans un cadre de 360 px (rayon 0)</h3>
    <div class="frame-360 panel-360">
      <Panel title="Archives" kicker="Téléphone">
        <p>Panneau plein écran, sans bordure.</p>
      </Panel>
    </div>
  </section>

  <!-- 11. Illustration -->
  <section aria-labelledby="d-art" class="demo">
    <h2 id="d-art">Illustration</h2>
    <div class="two">
      <figure class="art-fig">
        <svg
          class="art"
          viewBox="410 380 470 340"
          role="img"
          aria-label="Extrait de carte : lieux ouverts et mentionnés"
        >
          <rect class="paper" x="410" y="380" width="470" height="340" />
          {#each data.places as g, i (i)}
            <g {...g.a} data-state={stateOf(g.a.id)}><SvgTree nodes={g.c} /></g>
          {/each}
        </svg>
        <figcaption>
          États <code>open</code> (lavis) et <code>mentioned</code> (tirets, silhouette).
        </figcaption>
      </figure>
      <figure class="art-fig portrait-fig">
        {#if data.portrait}
          <ArtSvg node={data.portrait} label="Portrait gravé et aquarellé" />
        {/if}
        <figcaption>Portrait 160 × 200, buste de trois-quarts.</figcaption>
      </figure>
    </div>
    <h3>Écran titre : papier et nuit (<code>.art.on-night</code>)</h3>
    <div class="two">
      {#each [false, true] as night (night)}
        <figure class="art-fig" class:night>
          <svg
            class="art desk-art"
            class:on-night={night}
            viewBox="0 0 400 260"
            role="img"
            aria-label="Scène du bureau, version {night ? 'nuit' : 'papier'}"
          >
            {#if !night}<rect class="paper" width="400" height="260" />{/if}
            <rect class="paper-shade" x="36" y="132" width="110" height="78" rx="2" />
            <rect class="wash-sienne" x="36" y="132" width="110" height="78" rx="2" />
            <rect class="ink" fill="none" x="36" y="132" width="110" height="78" rx="2" />
            <rect class="ink-soft" fill="none" x="30" y="122" width="122" height="16" rx="2" />
            <rect class="hatch" x="36" y="186" width="110" height="24" />
            <rect class="paper" x="74" y="150" width="34" height="14" rx="1" />
            <rect
              class="paper"
              x="168"
              y="170"
              width="96"
              height="62"
              transform="rotate(-6 216 201)"
            />
            <rect
              class="ink-soft"
              fill="none"
              x="168"
              y="170"
              width="96"
              height="62"
              transform="rotate(-6 216 201)"
            />
            <path
              class="ink-faint"
              d="M178 186 h70 M179 196 h62 M180 206 h68 M181 216 h40"
              transform="rotate(-6 216 201)"
            />
            <rect class="wash-indigo" x="282" y="178" width="70" height="50" rx="3" />
            <rect class="ink" fill="none" x="282" y="178" width="70" height="50" rx="3" />
            <path class="ink-soft" d="M290 178 v50" />
            <path class="ink" d="M336 234 h44 M358 234 v-96 l-34 -34" fill="none" />
            <path class="wash-safran" d="M300 96 l26 -30 l34 28 l-34 22 z" />
            <path class="ink" fill="none" d="M300 96 l26 -30 l34 28 l-34 22 z" />
            <text class="label-note" x="200" y="40" text-anchor="middle"
              >Le bureau de l’enquêteur</text
            >
          </svg>
          <figcaption>{night ? 'Sur le bureau (on-night)' : 'Sur papier (défaut)'}</figcaption>
        </figure>
      {/each}
    </div>
    <h3>Pigments et motifs</h3>
    <div class="row">
      {#each pigments as p (p)}
        <figure class="pigment">
          <svg class="art" viewBox="0 0 60 40" aria-hidden="true"
            ><rect class="paper" width="60" height="40" /><rect
              class={p}
              x="4"
              y="4"
              width="52"
              height="32"
            /></svg
          >
          <figcaption><code>{p}</code></figcaption>
        </figure>
      {/each}
      {#each ['hatch', 'hatch-dense', 'stipple'] as m (m)}
        <figure class="pigment">
          <svg class="art" viewBox="0 0 60 40" aria-hidden="true"
            ><rect class="paper" width="60" height="40" /><rect
              class={m}
              x="4"
              y="4"
              width="52"
              height="32"
            /></svg
          >
          <figcaption><code>{m}</code></figcaption>
        </figure>
      {/each}
    </div>
  </section>

  <!-- 12. Icônes -->
  <section aria-labelledby="d-icons" class="demo">
    <h2 id="d-icons">Icônes encrées ({ICON_NAMES.length})</h2>
    <div class="row">
      <Toggle label="Lavis (wash)" bind:checked={iconWash} />
      <Toggle label="Géométrie nette (clean)" bind:checked={iconClean} />
    </div>
    <ul class="icons">
      {#each ICON_NAMES as n (n)}
        <li>
          <Icon
            name={n}
            size="1.75rem"
            wash={iconWash ? 'var(--fern)' : false}
            clean={iconClean}
          /><code>{n}</code>
        </li>
      {/each}
    </ul>
    <h3>Ornements (§10.11)</h3>
    <ul class="ornaments">
      {#each ORNAMENT_NAMES as n (n)}
        <li><Ornament name={n} size={n === 'divider' ? '8rem' : '3rem'} /><code>{n}</code></li>
      {/each}
    </ul>
  </section>

  <!-- 13. Curseurs -->
  <section aria-labelledby="d-cursors" class="demo">
    <h2 id="d-cursors">Curseurs (à survoler)</h2>
    <p class="hint">
      Avec le réglage « Curseurs encrés », <code>data-cursors="ink"</code> les active sur toute la page.
    </p>
    <ul class="verbs">
      {#each verbs as v (v.verb)}
        <li data-verb={v.verb}><code>{v.verb}</code> {v.label}</li>
      {/each}
    </ul>
  </section>

  <!-- 14. Logos -->
  <section aria-labelledby="d-logos" class="demo">
    <h2 id="d-logos">Logos (§11)</h2>
    <div class="row logos">
      {#each HOUSE_LOGOS as logo (logo.id)}<BrandLogo {logo} />{/each}
    </div>
    <div class="row logos ctx" data-surface="paper">
      {#each HOUSE_LOGOS as logo (logo.id)}<BrandLogo {logo} />{/each}
    </div>
  </section>
</div>

<style>
  .page-head h1 em,
  .display-sample em {
    font-style: italic;
    color: var(--brand);
  }
  .title-stage {
    display: grid;
    place-items: center;
    min-block-size: 20rem;
    padding: var(--space-10) var(--space-6);
    border-radius: var(--radius-l);
    overflow: hidden;
  }
  .header-ctx {
    display: grid;
    place-items: center;
  }
  .display-sample {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-4);
    line-height: var(--leading-display);
  }
  .desk-demo {
    padding: var(--space-6);
    border-radius: var(--radius-l);
  }
  .mat-blotter {
    padding: var(--space-8) var(--space-6);
    border-radius: var(--radius-m);
  }
  .materials {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: var(--space-8);
    align-items: start;
  }
  .catalogue {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .cat-tile {
    display: grid;
    gap: var(--space-1);
    inline-size: 100%;
    padding: var(--space-3);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    color: var(--text);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .cat-tile:hover {
    border-color: var(--accent);
  }
  .cat-stage {
    display: grid;
    place-items: center;
    block-size: 5.5rem;
  }
  .cat-sample {
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: var(--step-3);
    color: var(--brand);
  }
  .cat-card {
    display: block;
    inline-size: 4rem;
    block-size: 3rem;
    border-radius: var(--radius-xs);
    background: var(--card);
    border-block-start: 3px solid var(--card-margin);
    box-shadow: var(--shadow-paper);
  }
  .cat-name {
    font-size: var(--step--1);
  }
  .cat-note {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .ambient {
    gap: var(--space-10);
  }
  .amb {
    display: inline-grid;
    place-items: center;
    color: var(--metal);
  }
  .glow-dot {
    inline-size: 3rem;
    block-size: 3rem;
    border-radius: var(--radius-pill);
    background: radial-gradient(var(--lamp-pool), transparent 70%);
  }
  .transitions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tr-stage {
    display: grid;
    place-items: center;
    block-size: 6rem;
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-m);
    overflow: hidden;
  }
  .tr-card {
    display: grid;
    place-items: center;
    inline-size: 6rem;
    block-size: 4rem;
    border-radius: var(--radius-xs);
    background: var(--card);
    color: var(--ink);
    box-shadow: var(--shadow-paper);
  }
  .prims {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: var(--space-6);
  }
  .prim {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
  }
  .prim-stage {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 100%;
    block-size: 11rem;
    padding: var(--space-4);
    border-radius: var(--radius-m);
    background: var(--surface-1);
  }
  .flip-stage :global(.index-card) {
    inline-size: 11rem;
  }
  .ink-word {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-style: italic;
    font-size: var(--step-4);
    color: var(--brand);
  }
  .tilt-demo {
    inline-size: 11rem;
  }
  .keyarts {
    display: grid;
    grid-template-columns: minmax(0, 16fr) minmax(0, 7fr);
    gap: var(--space-6);
    align-items: start;
  }
  .ornaments {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--fern);
  }
  .ornaments li {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
  }
  .ornaments code {
    color: var(--text-muted);
  }
  .sections {
    display: grid;
    gap: var(--space-16);
  }
  .demo {
    display: grid;
    gap: var(--space-5);
    min-inline-size: 0;
  }
  .demo h3 {
    font-size: var(--step-1);
    margin-block-start: var(--space-4);
  }
  .hint {
    color: var(--text-muted);
  }
  .settings {
    padding: var(--space-6);
    border-radius: var(--radius-l);
    background: var(--surface-1);
    box-shadow: var(--shadow-2);
  }
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: var(--space-5);
    align-items: end;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-6);
  }
  .ctx {
    padding: var(--space-5);
    color: var(--text);
    border-radius: var(--radius-m);
    background: var(--canvas);
    border: var(--border) solid var(--line);
  }
  .tokens {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--step--1);
  }
  .tokens li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .chip {
    flex: none;
    inline-size: var(--space-8);
    block-size: var(--space-8);
    border-radius: var(--radius-s);
    box-shadow: inset 0 0 0 var(--border) var(--line-strong);
  }
  .state-row,
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }
  .steps {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .steps li {
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    align-items: baseline;
    gap: var(--space-4);
    font-family: var(--font-display);
  }
  .steps code {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .paper-sheet {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-8);
    border-radius: var(--radius-paper);
    background: var(--canvas);
    box-shadow: var(--shadow-paper);
  }
  .hand {
    font-family: var(--font-hand);
    font-size: calc(var(--step-read) * var(--hand-boost));
  }
  mark {
    color: var(--text);
  }
  .frame-440 {
    inline-size: min(100%, var(--side-default));
    padding: var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-m);
  }
  .frame-360 {
    position: relative;
    inline-size: min(100%, var(--side-min));
    border: var(--border) dashed var(--line-strong);
  }
  .rail-frame {
    display: inline-block;
    padding: var(--space-2);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-m);
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: var(--space-6);
    align-items: start;
  }
  .photo-ph svg {
    inline-size: 100%;
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: var(--space-6);
    align-items: start;
  }
  .keys {
    gap: var(--space-5);
  }
  .desk {
    display: grid;
    grid-template-columns: var(--rail-w) minmax(0, 1fr) minmax(0, var(--side-default));
    gap: var(--space-3);
    padding: var(--space-3);
    min-block-size: 22rem;
    border-radius: var(--radius-l);
    background: var(--canvas);
    border: var(--border) solid var(--line);
  }
  .desk-main {
    display: grid;
    place-items: center;
    border-radius: var(--radius-l);
    background: var(--surface-1);
  }
  .slots {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-4);
  }
  .slot {
    display: grid;
    place-items: center;
    align-content: center;
    gap: var(--space-2);
    inline-size: var(--slot-w);
    block-size: var(--slot-h);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .slot.locked {
    border: var(--border-strong) solid var(--established);
    color: var(--established);
  }
  .panel-360 :global(section) {
    border-radius: 0;
  }
  .art-fig {
    display: grid;
    gap: var(--space-2);
    margin: 0;
  }
  .art-fig > svg,
  .art-fig :global(svg.art) {
    inline-size: 100%;
    block-size: auto;
    border-radius: var(--radius-paper);
  }
  .portrait-fig :global(svg.art) {
    max-inline-size: 16rem;
  }
  .art-fig.night {
    padding: var(--space-3);
    border-radius: var(--radius-m);
    background: var(--canvas);
  }
  figcaption {
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .pigment {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    inline-size: 7rem;
  }
  .icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .icons li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--step--1);
  }
  .verbs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .verbs li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: var(--hit-row);
    padding: var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-m);
  }
  .logos :global(.brand-logo) {
    block-size: var(--space-10);
    inline-size: auto;
  }
  @media (max-width: 79.9375rem) {
    .desk {
      grid-template-columns: var(--rail-w-tablet) minmax(0, 1fr);
    }
    .desk :global(.desk-reader) {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 37.4375rem) {
    .keyarts {
      grid-template-columns: minmax(0, 1fr);
    }
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
    .steps li {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
  }
</style>
