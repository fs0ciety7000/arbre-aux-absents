<!--
  P03 — Lecteur : document ouvert sur papier. Original / Transcription (T), recto / verso (R),
  zoom ×1–×4 (+ / − / 0), loupe (Maj maintenue sur le document), surlignage 5 couleurs doublées
  d'un motif (H puis 1–5), épingle (P), note (N), mots-clés soulignés cliquables (bulle
  d'action : Rechercher, Voir au carnet, Épingler, Utiliser dans l'arbre), visages du document.
  Rendu de l'AST sans `{@html}` (DocumentBody).
-->
<script lang="ts">
  import type { KeywordId } from '@arbre/contract';
  import { keywordMentions } from '@arbre/engine';
  import {
    Badge,
    Button,
    Dialog,
    Icon,
    IconButton,
    Ornament,
    Tape,
    TextField,
    rustle,
    sheetPull,
  } from '@arbre/ui';
  import Spot from '../shell/Spot.svelte';
  import { svgContent } from '@arbre/map/svelte';
  import { illustration, portraitSvg } from './lib/assets.svelte';
  import { onMount, tick } from 'svelte';
  import { getGame } from '../lib/game/context';
  import { listenCommands, ownsCommands } from './lib/commands';
  import { carry, DRAG_MIME, encodeCarry, type CarryItem } from './lib/carry.svelte';
  import {
    containerAt,
    inLanguage,
    inlineText,
    leadIllustration,
    passageText,
    pathKey,
    rangesByPath,
    splitFaces,
    type HighlightColor,
  } from './lib/doc-layout';
  import { carryFromPortrait, carryFromText, formatPartialDate, isActivation } from './lib/view';
  import type { BodyOptions, KeywordState, ReadMode } from './doc/context';
  import DocumentBody from './doc/DocumentBody.svelte';
  import Figure from './doc/Figure.svelte';
  import KeywordBubble, { type BubbleItem } from './doc/KeywordBubble.svelte';
  import { HL_LABELS, KIND_LABELS, messages, pm } from './messages';
  import { formatNumber } from '../lib/game/format';

  const game = getGame();

  /** Taille du rem racine (suit la taille du texte système), 16 px hors navigateur. */
  function rootFontSize(): number {
    if (typeof document === 'undefined') return 16;
    return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  }

  const id = $derived(game.ui.openDocument);
  const doc = $derived(id ? game.content.documents[id] : undefined);

  let mode = $state<ReadMode>(game.settings.transcriptByDefault ? 'transcript' : 'original');
  let face = $state<'front' | 'back'>('front');
  let zoom = $state(1);
  const zoomText = $derived(`×${formatNumber(zoom)}`);
  /** Largeur de la barre d'outils (ResizeObserver de Svelte) → mode compact sous 40 rem. */
  let toolbarWidth = $state(0);
  const compact = $derived(toolbarWidth > 0 && toolbarWidth < 40 * rootFontSize());
  let sheet: HTMLDivElement | undefined = $state();
  let stage: HTMLDivElement | undefined = $state();
  let status = $state('');
  let awaitingColor = $state(false);
  let noteOpen = $state(false);
  let noteText = $state('');
  let bubble = $state<{
    kw: KeywordId;
    label: string;
    x: number;
    y: number;
    el: HTMLElement;
  } | null>(null);
  let lens = $state<{ x: number; y: number; ox: number; oy: number } | null>(null);
  let shift = false;

  // Nouveau document : remise à zéro de la vue, lecture enregistrée (idempotent).
  let lastId: string | null = null;
  $effect(() => {
    if (id === lastId) return;
    lastId = id;
    face = 'front';
    zoom = 1;
    bubble = null;
    status = '';
    mode = game.settings.transcriptByDefault ? 'transcript' : 'original';
    if (id && doc && game.state.read[id] === undefined) {
      game.dispatch({ type: 'openDocument', id });
    }
    const passage = game.focusPassage;
    void tick().then(() => {
      stage?.scrollTo?.({ top: 0 });
      if (passage && sheet) {
        sheet
          .querySelector(`[data-path="${pathKey(passage)}"]`)
          ?.scrollIntoView({ block: 'center' });
      }
    });
  });

  const faces = $derived(doc ? splitFaces(doc.body) : { front: [], back: [] });
  const flippable = $derived(
    !!doc &&
      (doc.kind === 'photo' || doc.kind === 'postcard') &&
      faces.front.length > 0 &&
      faces.back.length > 0,
  );
  /** Illustration d'en-tête (frontmatter) : au recto des pièces qui se retournent. */
  const lead = $derived(doc ? leadIllustration(doc) : null);
  const showLead = $derived(!!lead && (!flippable || mode === 'transcript' || face === 'front'));
  const only = $derived(
    !flippable || mode === 'transcript' ? null : face === 'front' ? faces.front : faces.back,
  );
  /** Langue du texte affiché : les surlignages d'une autre langue restent gardés, cachés (D5). */
  const textLang = $derived(game.content.locale ?? 'fr');
  const highlights = $derived(
    id ? rangesByPath(game.state.notebook.highlights, id, textLang) : new Map(),
  );
  const myHighlights = $derived(
    game.state.notebook.highlights
      .map((h, index) => ({ ...h, index }))
      .filter((h) => h.doc === id && inLanguage(h, textLang)),
  );
  const pinned = $derived(
    !!id && game.state.notebook.pins.some((p) => p.kind === 'document' && p.id === id),
  );
  const note = $derived(
    game.state.notebook.notes.find((n) => n.target?.kind === 'document' && n.target.id === id),
  );
  const mentions = $derived(keywordMentions(game.state, game.content));

  function kwState(kw: KeywordId): KeywordState {
    if (game.state.searched.includes(kw)) return 'searched';
    const others =
      (mentions[kw] ?? 0) - (doc?.keywords.includes(kw) && id && game.state.read[id] ? 1 : 0);
    return others > 0 ? 'known' : 'new';
  }

  function kwCarry(kw: KeywordId, label: string): CarryItem | null {
    return (
      carryFromText(game.state, game.content, label) ??
      carryFromText(game.state, game.content, game.content.keywords[kw]?.label ?? '')
    );
  }

  const opts: BodyOptions = $derived({
    mode,
    decorative: false,
    kwState,
    onkeyword: (kw, label, el) => openBubble(kw, label, el),
    onkeyworddrag: (kw, label, e) => {
      const item = kwCarry(kw, label);
      if (!item || !e.dataTransfer) return;
      e.dataTransfer.setData(DRAG_MIME, encodeCarry(item));
      e.dataTransfer.setData('text/plain', item.label);
      e.dataTransfer.effectAllowed = 'copy';
      carry.take(item);
    },
  });
  const lensOpts: BodyOptions = $derived({
    ...opts,
    decorative: true,
    onkeyword: undefined,
    onkeyworddrag: undefined,
  });

  const figure = (asset: string) => illustration(game.content, asset);

  function openBubble(kw: KeywordId, label: string, el: HTMLElement) {
    if (!stage) return;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = Math.max(8, Math.min(r.left - s.left + stage.scrollLeft, s.width - 240));
    bubble = { kw, label, el, x, y: r.bottom - s.top + stage.scrollTop + 6 };
  }

  const bubbleItems: BubbleItem[] = $derived.by(() => {
    if (!bubble) return [];
    const b = bubble;
    const item = kwCarry(b.kw, b.label);
    const kwPinned = game.state.notebook.pins.some((p) => p.kind === 'keyword' && p.id === b.kw);
    return [
      {
        id: 'search',
        label: pm.common.search,
        icon: 'search',
        verb: 'look',
        run: () => {
          game.dispatch({ type: 'search', query: game.content.keywords[b.kw]?.label ?? b.label });
          game.navigate({ kind: 'panel', id: 'catalogue' });
        },
      },
      {
        id: 'notebook',
        label: pm.common.seeNotebook,
        icon: 'notebook',
        verb: 'look',
        run: () => game.navigate({ kind: 'keyword', id: b.kw }),
      },
      {
        id: 'pin',
        label: kwPinned ? pm.common.unpin : pm.common.pin,
        icon: 'pin',
        verb: 'pin',
        run: () =>
          game.dispatch({
            type: kwPinned ? 'unpin' : 'pin',
            target: { kind: 'keyword', id: b.kw },
          }),
      },
      {
        id: 'use',
        label: item ? pm.common.useInTree : `${pm.common.useInTree} — ${pm.reader.notCandidate}`,
        icon: 'use',
        verb: 'use',
        disabled: !item,
        run: () => item && take(item),
      },
    ];
  });

  function take(item: CarryItem) {
    carry.take(item);
    status = pm.reader.taken(item.label);
    game.navigate({ kind: 'panel', id: 'tree' });
  }

  function closeBubble(refocus: boolean) {
    const el = bubble?.el;
    bubble = null;
    if (refocus) el?.focus();
  }

  // ── Surlignage ──────────────────────────────────────────────────
  function offsetIn(container: Element, node: Node, off: number): number {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
    const seg = el?.closest<HTMLElement>('[data-o]');
    if (seg && container.contains(seg) && node.nodeType === Node.TEXT_NODE) {
      return Number(seg.dataset.o) + off;
    }
    // Bord d'élément : premier segment suivant (ou fin du conteneur).
    const segs = [...container.querySelectorAll<HTMLElement>('[data-o]')];
    const child = el?.childNodes[off] ?? null;
    const after = segs.find(
      (s) =>
        child &&
        (child === s ||
          child.contains(s) ||
          (child.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0),
    );
    if (after) return Number(after.dataset.o);
    return Number.POSITIVE_INFINITY;
  }

  function selectionPassage(): { path: number[]; start: number; end: number } | null {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !sheet || !doc) return null;
    const r = sel.getRangeAt(0);
    const startEl = (
      r.startContainer.nodeType === Node.TEXT_NODE
        ? r.startContainer.parentElement
        : r.startContainer
    ) as Element | null;
    const container = startEl?.closest<HTMLElement>('[data-path]');
    if (!container || !sheet.contains(container)) return null;
    const path = container.dataset.path!.split('.').map(Number);
    const inl = containerAt(doc.body, path);
    if (!inl) return null;
    const len = inlineText(inl).length;
    const start = Math.max(0, Math.min(len, offsetIn(container, r.startContainer, r.startOffset)));
    const end = container.contains(r.endContainer)
      ? Math.min(len, offsetIn(container, r.endContainer, r.endOffset))
      : len;
    if (!(end > start)) return null;
    return { path, start, end };
  }

  function highlight(color: HighlightColor) {
    awaitingColor = false;
    const p = selectionPassage();
    if (!p || !id) {
      status = pm.reader.highlightNone;
      return;
    }
    // Étiqueté avec la langue du texte (absent = français, comme les sauvegardes d'avant l'i18n).
    const lang = textLang === 'fr' ? {} : { lang: textLang };
    game.dispatch({ type: 'highlight', h: { doc: id, ...p, color, ...lang } });
    window.getSelection()?.removeAllRanges();
    status = pm.reader.highlightDone;
  }

  // ── Zoom, loupe ─────────────────────────────────────────────────
  const setZoom = (z: number) => (zoom = Math.round(Math.min(4, Math.max(1, z)) * 4) / 4);

  function onPointerMove(e: PointerEvent) {
    if (!(e.shiftKey || shift) || e.pointerType !== 'mouse' || !sheet || !stage) {
      lens = null;
      return;
    }
    const s = stage.getBoundingClientRect();
    const r = sheet.getBoundingClientRect();
    lens = {
      x: e.clientX - s.left + stage.scrollLeft,
      y: e.clientY - s.top + stage.scrollTop,
      ox: (e.clientX - r.left) / zoom,
      oy: (e.clientY - r.top) / zoom,
    };
  }

  // ── Clavier ─────────────────────────────────────────────────────
  let readerEl: HTMLDivElement | undefined = $state();

  // Après « Surligner » (H), la touche suivante choisit la couleur (1–5) ; toute autre annule.
  $effect(() => {
    if (!awaitingColor) return;
    const onkey = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      awaitingColor = false;
      if (/^[1-5]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        highlight(Number(e.key) as HighlightColor);
      }
    };
    window.addEventListener('keydown', onkey, true);
    return () => window.removeEventListener('keydown', onkey, true);
  });

  // Commandes remappables relayées par le shell (T, R, P, H, N, zoom…).
  $effect(() =>
    listenCommands((cmd) => {
      if (!doc) return false;
      if (cmd === 'reader.transcript') mode = mode === 'original' ? 'transcript' : 'original';
      else if (cmd === 'reader.flip' && flippable) face = face === 'front' ? 'back' : 'front';
      else if (!ownsCommands(readerEl, 'reader', game.ui.main)) return false;
      else if (cmd === 'pin') togglePin();
      else if (cmd === 'note') openNote();
      else if (cmd === 'highlight') {
        awaitingColor = true;
        status = pm.reader.highlightColor;
      } else if (cmd === 'zoom.in') setZoom(zoom + 0.25);
      else if (cmd === 'zoom.out') setZoom(zoom - 0.25);
      else if (cmd === 'zoom.fit') setZoom(1);
      else return false;
      return true;
    }),
  );

  function togglePin() {
    if (!id) return;
    game.dispatch({ type: pinned ? 'unpin' : 'pin', target: { kind: 'document', id } });
  }

  function openNote() {
    noteText = note?.text ?? '';
    noteOpen = true;
  }
  function saveNote() {
    if (!id) return;
    if (noteText.trim() === '' && note) game.dispatch({ type: 'deleteNote', id: note.id });
    else if (noteText.trim() !== '')
      game.dispatch({
        type: 'note',
        ...(note ? { id: note.id } : {}),
        target: { kind: 'document', id },
        text: noteText,
      });
    noteOpen = false;
  }

  onMount(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shift = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shift = false;
        lens = null;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  });

  // Bruissement de la feuille quand elle livre un indice : pièce débloquée, secret, passage
  // surligné ou épinglé (§7.4, `use:rustle`).
  let clue = $state(0);

  /**
   * Pose de la feuille : inclinée de −0,5° autour de son centre. Une feuille haute (texte long,
   * volet étroit, zoom qui la rallonge au carré) dériverait d'autant : à ×2, ses premières lignes
   * sortaient à gauche du lecteur (débord non défilable) et les dernières à droite. L'angle est
   * donc borné pour que les bords ne dérivent jamais de plus de TILT_DRIFT px ; le froissement
   * (`--rustle-amp`) suit la même atténuation.
   */
  const TILT_MAX = 0.5;
  const TILT_DRIFT = 4;
  let sheetHeight = $state(0);
  const tiltRatio = $derived.by(() => {
    if (sheetHeight <= 0) return 1;
    const deg = (Math.asin(Math.min(1, TILT_DRIFT / (sheetHeight / 2))) * 180) / Math.PI;
    return Math.min(1, deg / TILT_MAX);
  });
  onMount(() =>
    game.onEvents((events) => {
      if (events.some((e) => e.type === 'documentsUnlocked' || e.type === 'secretFound')) clue++;
    }),
  );
  let lastMarks = -1;
  $effect(() => {
    const n = myHighlights.length + (pinned ? 1 : 0) + (note ? 1 : 0);
    if (lastMarks >= 0 && n > lastMarks) clue++;
    lastMarks = n;
  });

  /** Matière de la feuille selon le type de pièce (§10.8, §13.4). */
  type Edge = 'straight' | 'torn' | 'perforated';
  type Fastener = 'clip' | 'tape' | 'none';
  const SHEET: Partial<Record<string, { edge: Edge; fastener: Fastener; tone: string }>> = {
    register: { edge: 'perforated', fastener: 'none', tone: 'paper' },
    directory: { edge: 'perforated', fastener: 'none', tone: 'aged' },
    newspaper: { edge: 'torn', fastener: 'tape', tone: 'aged' },
    advert: { edge: 'torn', fastener: 'tape', tone: 'aged' },
    photo: { edge: 'straight', fastener: 'tape', tone: 'new' },
    postcard: { edge: 'straight', fastener: 'tape', tone: 'new' },
    letter: { edge: 'straight', fastener: 'clip', tone: 'new' },
    telegram: { edge: 'torn', fastener: 'clip', tone: 'new' },
  };
  const look = $derived(
    (doc && SHEET[doc.kind]) ?? {
      edge: 'straight' as Edge,
      fastener: 'clip' as Fastener,
      tone: 'paper',
    },
  );

  const place = $derived(doc?.place ? game.content.places[doc.place] : undefined);
  const facesOf = $derived(doc?.reveals?.portraits ?? []);
  const occupations = $derived(doc?.reveals?.occupations ?? []);
</script>

<!-- Lecteur (§13.4) : la pièce est une feuille tirée de sa chemise, posée sur le sous-main. -->
<section class="reader-panel" aria-labelledby="reader-title">
  {#if !doc}
    <div class="none">
      <h2 id="reader-title" class="none-title">{pm.reader.title}</h2>
      <Spot name="letter" />
      <p>{pm.reader.none}</p>
      <Button iconName="archives" onclick={() => game.navigate({ kind: 'panel', id: 'archives' })}
        >{pm.reader.toArchives}</Button
      >
    </div>
  {:else}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="reader" bind:this={readerEl}>
      <!-- Deux rangées dans l'ordre du DOM (= ordre de tabulation) : affichage, zoom, épingle/note ;
           puis surlignage et verso. Étroit (< 40 rem, volet ou téléphone) : boutons icônes seuls,
           nom accessible et info-bulle conservés, le zoom affiché sert de bouton « Ajuster ». -->
      <div
        class="toolbar"
        class:compact
        role="toolbar"
        aria-label={pm.reader.mode}
        bind:clientWidth={toolbarWidth}
      >
        <div class="row">
          <div class="seg" role="group" aria-label={pm.reader.mode}>
            {#if compact}
              <IconButton
                icon="reader"
                label={pm.reader.original}
                pressed={mode === 'original'}
                onclick={() => (mode = 'original')}
              />
              <IconButton
                icon="transcript"
                label={pm.reader.transcript}
                pressed={mode === 'transcript'}
                onclick={() => (mode = 'transcript')}
              />
            {:else}
              <Button
                variant={mode === 'original' ? 'secondary' : 'ghost'}
                aria-pressed={mode === 'original'}
                onclick={() => (mode = 'original')}>{pm.reader.original}</Button
              >
              <Button
                variant={mode === 'transcript' ? 'secondary' : 'ghost'}
                aria-pressed={mode === 'transcript'}
                iconName="transcript"
                onclick={() => (mode = 'transcript')}>{pm.reader.transcript}</Button
              >
            {/if}
          </div>
          <div class="seg" role="group" aria-label={pm.reader.zoom}>
            <IconButton
              icon="zoom-out"
              label={pm.reader.zoomOut}
              disabled={zoom <= 1}
              onclick={() => setZoom(zoom - 0.25)}
            />
            {#if compact}
              <IconButton
                class="zoom num"
                label="{zoomText} · {pm.reader.fit}"
                onclick={() => setZoom(1)}>{zoomText}</IconButton
              >
            {:else}
              <span class="num zoom">{zoomText}</span>
            {/if}
            <IconButton
              icon="zoom-in"
              label={pm.reader.zoomIn}
              disabled={zoom >= 4}
              onclick={() => setZoom(zoom + 0.25)}
            />
            {#if !compact}
              <IconButton icon="fit" label={pm.reader.fit} onclick={() => setZoom(1)} />
            {/if}
          </div>
          <div class="seg end">
            <IconButton
              icon="pin"
              label={pinned ? pm.common.unpin : pm.common.pin}
              pressed={pinned}
              tooltipPlacement="start"
              onclick={togglePin}
            />
            <IconButton
              icon="note"
              label={pm.reader.noteTitle}
              pressed={!!note}
              tooltipPlacement="start"
              onclick={openNote}
            />
          </div>
        </div>
        <div class="row">
          <div class="seg hl" role="group" aria-label={pm.reader.highlight}>
            <span class="hl-icon"><Icon name="highlight" /></span>
            {#each [1, 2, 3, 4, 5] as const as c (c)}
              <button
                type="button"
                class="swatch"
                aria-label={messages.labelled(pm.reader.highlight, HL_LABELS[c - 1] ?? '')}
                onpointerdown={(e) => e.preventDefault()}
                onclick={() => highlight(c)}
              >
                <span class="hl-{c}">Aa</span>
              </button>
            {/each}
          </div>
          {#if flippable && mode === 'original'}
            <div class="seg end">
              {#if compact}
                <IconButton
                  icon="flip"
                  label="{pm.reader.flip} · {face === 'front' ? pm.reader.front : pm.reader.back}"
                  tooltipPlacement="start"
                  onclick={() => (face = face === 'front' ? 'back' : 'front')}
                />
              {:else}
                <Button iconName="flip" onclick={() => (face = face === 'front' ? 'back' : 'front')}
                  >{pm.reader.flip} · {face === 'front' ? pm.reader.front : pm.reader.back}</Button
                >
              {/if}
            </div>
          {/if}
        </div>
      </div>
      <p class="status" role="status">{status}</p>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="stage"
        bind:this={stage}
        onpointermove={onPointerMove}
        onpointerleave={() => (lens = null)}
      >
        <div class="meta">
          {#if doc.author}<span>{messages.labelled(pm.reader.author, doc.author)}</span>{/if}
          {#if place}
            <Button
              variant="ghost"
              iconName="map"
              verb="look"
              onclick={() => game.navigate({ kind: 'place', id: place.id })}>{place.name}</Button
            >
          {/if}
        </div>

        {#snippet sheetHead()}
          <p class="doc-kicker">
            {KIND_LABELS[doc.kind]}{#if doc.date}&nbsp;· <span class="num"
                >{formatPartialDate(doc.date)}</span
              >{/if}
          </p>
        {/snippet}

        {#key id}
          <div class="sheet-wrap fasten-{look.fastener}" in:sheetPull>
            <div
              class="sheet-rustle"
              use:rustle={clue}
              bind:clientHeight={sheetHeight}
              style:--tilt="{(-TILT_MAX * tiltRatio).toFixed(3)}deg"
              style:--rustle-amp={tiltRatio.toFixed(3)}
            >
              <div
                class="sheet mat-paper tone-{look.tone} kind-{doc.kind}"
                class:edge-torn={look.edge === 'torn' && mode !== 'transcript'}
                class:edge-perforated={look.edge === 'perforated' && mode !== 'transcript'}
                class:transcript={mode === 'transcript'}
                data-surface="paper"
                bind:this={sheet}
                style:zoom
                style:--sheet-zoom={zoom}
              >
                {@render sheetHead()}
                <h2 id="reader-title" class="doc-title">{doc.title}</h2>
                {#if lead && showLead}
                  <Figure asset={lead.file} alt={lead.alt} {mode} load={figure} lead />
                {/if}
                <div class="reading" data-tour="reader-text">
                  <DocumentBody blocks={doc.body} {opts} {highlights} {figure} {only} />
                </div>
                {#if doc.archive}
                  <p class="doc-fonds">{messages.labelled(pm.reader.archive, doc.archive)}</p>
                {/if}
              </div>
              {#if look.fastener === 'clip'}
                <span class="clip" aria-hidden="true"
                  ><Ornament name="clip" size="22px" weight={1.6} /></span
                >
              {:else if look.fastener === 'tape'}
                <span class="tape tl" aria-hidden="true"><Tape rotate={-38} length="76px" /></span>
                <span class="tape tr" aria-hidden="true"><Tape rotate={38} length="76px" /></span>
              {/if}
            </div>
          </div>
        {/key}

        {#if lens && sheet}
          <div class="lens" aria-hidden="true" style:left="{lens.x}px" style:top="{lens.y}px">
            <div
              class="lens-inner sheet mat-paper tone-{look.tone} kind-{doc.kind}"
              class:transcript={mode === 'transcript'}
              data-surface="paper"
              style:width="{sheet.offsetWidth}px"
              style:transform="translate({90 - lens.ox * 2.5}px, {90 - lens.oy * 2.5}px) scale(2.5)"
            >
              {@render sheetHead()}
              <p class="doc-title">{doc.title}</p>
              {#if lead && showLead}
                <Figure asset={lead.file} alt={lead.alt} {mode} load={figure} lead eager />
              {/if}
              <div class="reading">
                <DocumentBody blocks={doc.body} opts={lensOpts} {highlights} {figure} {only} />
              </div>
            </div>
          </div>
        {/if}
        {#if bubble}
          <KeywordBubble
            label={pm.reader.bubble(bubble.label)}
            items={bubbleItems}
            x={bubble.x}
            y={bubble.y}
            onclose={closeBubble}
          />
        {/if}

        {#if facesOf.length > 0}
          <section class="extra" aria-labelledby="reader-faces" data-tour="reader-faces">
            <h3 id="reader-faces">{pm.reader.faces}</h3>
            <ul class="faces">
              {#each facesOf as p, i (p)}
                {@const pr = game.content.portraits[p]}
                {#if pr}
                  <li class="mv-deal" style:--i={Math.min(i, 8)}>
                    <button
                      type="button"
                      class="face mv-liftable"
                      data-surface="paper"
                      style:--tilt="{i % 2 ? 1.2 : -1}deg"
                      data-verb="take"
                      draggable="true"
                      ondragstart={(e) => {
                        const item = carryFromPortrait(game.content, p);
                        e.dataTransfer?.setData(DRAG_MIME, encodeCarry(item));
                        carry.take(item);
                      }}
                      onclick={() => take(carryFromPortrait(game.content, p))}
                      onkeydown={(e) => {
                        if (e.key.toLowerCase() === 'u' && !isActivation(e))
                          take(carryFromPortrait(game.content, p));
                      }}
                    >
                      <span class="face-art" use:svgContent={portraitSvg(game.content, p)}></span>
                      <span>{pr.alt}</span>
                      <span class="verb"><Icon name="use" size="1rem" /> {pm.common.useInTree}</span
                      >
                    </button>
                  </li>
                {/if}
              {/each}
            </ul>
          </section>
        {/if}
        {#if occupations.length > 0}
          <section class="extra" aria-labelledby="reader-occ">
            <h3 id="reader-occ">{pm.reader.occupations}</h3>
            <p class="chips">
              {#each occupations as o (o)}
                <Badge tone="neutral">{game.content.occupations[o]?.label ?? o}</Badge>
              {/each}
            </p>
          </section>
        {/if}
        {#if myHighlights.length > 0}
          <section class="extra" aria-labelledby="reader-hl">
            <h3 id="reader-hl">{pm.notebook.passages}</h3>
            <ul class="passages">
              {#each myHighlights as h (h.index)}
                <li>
                  <span class="hl-{h.color}">{passageText(doc.body, h.path, h.start, h.end)}</span>
                  <IconButton
                    icon="trash"
                    label={pm.reader.removeHighlight}
                    onclick={() => game.dispatch({ type: 'removeHighlight', index: h.index })}
                  />
                </li>
              {/each}
            </ul>
          </section>
        {/if}
        <div class="to-tree">
          <Button iconName="tree" onclick={() => game.navigate({ kind: 'panel', id: 'tree' })}
            >{pm.reader.toTree}</Button
          >
        </div>
      </div>
    </div>
  {/if}
</section>

<Dialog bind:open={noteOpen} title={pm.reader.noteTitle} size="s">
  <TextField
    label={pm.reader.noteLabel}
    multiline
    rows={6}
    maxlength={2000}
    bind:value={noteText}
  />
  {#snippet actions()}
    <Button variant="primary" onclick={saveNote}>{pm.reader.save}</Button>
    <Button variant="ghost" onclick={() => (noteOpen = false)}>{pm.common.cancel}</Button>
  {/snippet}
</Dialog>

<style>
  .reader-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
    min-inline-size: 0;
    /* La largeur vient du volet, jamais du contenu (barre d'outils, feuille zoomée). */
    contain: inline-size;
    color: var(--text);
  }
  .none {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    padding: var(--space-6);
    color: var(--text-muted);
  }
  .none-title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-2);
    color: var(--text);
  }
  .reader {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
  }
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-block-end: 1.5px dashed var(--stitch);
  }
  .toolbar.compact {
    padding-inline: var(--space-2);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
    align-items: center;
    min-inline-size: 0;
  }
  .compact .row {
    gap: var(--space-1) var(--space-2);
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    min-inline-size: 0;
    gap: var(--space-1);
    align-items: center;
  }
  .seg.end {
    margin-inline-start: auto;
  }
  .zoom {
    min-inline-size: 2.75rem;
    text-align: center;
    font-family: var(--font-type);
  }
  /* Étroit : le zoom affiché devient le bouton « Ajuster » (cible ≥ 44 px, texte réel). */
  .toolbar :global(.ibtn.zoom) {
    inline-size: auto;
    min-inline-size: var(--hit);
    padding-inline: var(--space-1);
    color: var(--text);
    font-size: var(--step--1);
  }
  .hl-icon {
    display: inline-flex;
  }
  .swatch {
    display: grid;
    place-items: center;
    min-inline-size: var(--hit);
    min-block-size: var(--hit);
    padding: 0;
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-new);
    color: var(--ink);
    font: inherit;
    font-weight: var(--weight-semibold);
    transition: transform var(--dur-base) var(--ease-snap);
  }
  @media (hover: hover) {
    .swatch:hover {
      transform: translateY(var(--lift)) rotate(-3deg);
    }
  }
  .swatch:active {
    transform: translateY(var(--press-depth));
    transition-duration: var(--dur-instant);
  }
  .status {
    margin: 0;
    padding-inline: var(--space-3);
    min-block-size: var(--space-1);
    color: var(--text-muted);
  }
  .status:empty {
    display: none;
  }
  .stage {
    position: relative;
    flex: 1;
    min-block-size: 0;
    overflow: auto;
    padding: var(--space-3) var(--space-5) var(--space-6);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    align-items: center;
    margin-block-end: var(--space-4);
    color: var(--text-muted);
    font-family: var(--font-type);
    font-size: var(--step--1);
  }

  /* ── La feuille (PaperSheet, §6.1 ; style par type, §10.8) ── */
  .sheet-wrap {
    position: relative;
    max-inline-size: calc(var(--measure) + 2 * var(--space-6));
    margin-block-start: var(--space-3);
    transform-origin: 50% 100%;
  }
  .sheet-rustle {
    position: relative;
    /* --tilt et --rustle-amp viennent du script (pose bornée selon la hauteur). */
    --tilt: -0.5deg;
    transform: rotate(var(--tilt));
  }
  /* Les marges latérales ne grossissent pas avec le zoom : il agrandit le texte, pas le papier
     autour (sinon, à ×4, la colonne de texte perdait la moitié du volet). */
  .sheet {
    padding: var(--space-6) calc(var(--space-6) / var(--sheet-zoom, 1)) var(--space-8);
  }
  .sheet.transcript {
    padding-block-end: var(--space-6);
  }
  .tone-new {
    background: var(--paper-new);
  }
  .tone-aged {
    background: var(--paper-aged);
  }
  .doc-fonds {
    margin: var(--space-6) 0 0;
    padding-block-start: var(--space-2);
    border-block-start: 1px solid var(--line);
    color: var(--text-muted);
    font-family: var(--font-type);
    font-size: var(--step--1);
  }
  .doc-kicker {
    margin: 0;
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--paper-accent-strong);
  }
  .doc-title {
    margin: var(--space-1) 0 var(--space-4);
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-2);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-tight);
    color: var(--ink);
    text-wrap: balance;
  }
  .sheet .reading {
    max-inline-size: none;
  }
  .kind-telegram:not(.transcript),
  .kind-report:not(.transcript),
  .kind-note:not(.transcript) {
    font-family: var(--font-type);
    color: var(--ink-type);
  }
  .kind-telegram:not(.transcript) .reading,
  .kind-report:not(.transcript) .reading,
  .kind-note:not(.transcript) .reading {
    font-family: var(--font-type);
  }
  .kind-letter:not(.transcript) .reading,
  .kind-postcard:not(.transcript) .reading {
    font-family: var(--font-hand);
    font-size: calc(var(--step-read) * var(--hand-boost));
    color: var(--ink-hand);
    line-height: 1.4;
  }
  .clip {
    position: absolute;
    inset-block-start: calc(var(--space-4) * -1);
    inset-inline-start: var(--space-6);
    color: var(--metal);
    rotate: -6deg;
  }
  .tape {
    position: absolute;
    inset-block-start: calc(var(--space-3) * -1);
  }
  .tape.tl {
    inset-inline-start: calc(var(--space-6) * -1);
  }
  .tape.tr {
    inset-inline-end: calc(var(--space-6) * -1);
  }
  .lens {
    position: absolute;
    z-index: var(--z-popover);
    inline-size: 180px;
    block-size: 180px;
    margin: -90px 0 0 -90px;
    border: 3px solid var(--metal);
    border-radius: var(--radius-pill);
    overflow: hidden;
    background: var(--paper);
    box-shadow:
      var(--shadow-3),
      inset 0 0 0 2px var(--metal-shade);
    pointer-events: none;
  }
  .lens-inner {
    transform-origin: 0 0;
    box-shadow: none;
    padding: var(--space-6) var(--space-6) var(--space-8);
  }
  .lens-inner .doc-title {
    margin-block-start: var(--space-1);
  }
  .extra {
    margin-block-start: var(--space-6);
  }
  .extra h3 {
    margin: 0 0 var(--space-3);
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .faces {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    gap: var(--space-4);
  }
  /* Tirage photo (DESIGN §6.4) : marge blanche, légende manuscrite, se soulève au survol. */
  .face {
    display: grid;
    gap: var(--space-1);
    inline-size: 100%;
    padding: var(--space-2) var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius-s);
    background: var(--surface-1);
    box-shadow: var(--shadow-paper);
    color: var(--text);
    font: inherit;
    font-size: var(--step--1);
    text-align: start;
    transform: rotate(var(--tilt, 0deg));
    cursor: inherit;
  }
  .face-art {
    display: block;
    aspect-ratio: 4 / 5;
    background: var(--art-paper);
    overflow: hidden;
  }
  .face-art :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  @media (forced-colors: active) {
    .face {
      border: 1px solid CanvasText;
    }
  }
  .verb {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    color: var(--accent);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
  }
  .passages {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .passages li {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: space-between;
  }
  .to-tree {
    margin-block-start: var(--space-6);
  }
</style>
