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
  import { Badge, Button, Dialog, Icon, IconButton, Panel, TextField } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { onMount, tick } from 'svelte';
  import { getGame } from '../lib/game/context';
  import { illustration } from './lib/assets';
  import { listenCommands, ownsCommands } from './lib/commands';
  import { carry, DRAG_MIME, encodeCarry, type CarryItem } from './lib/carry.svelte';
  import {
    containerAt,
    inlineText,
    passageText,
    pathKey,
    rangesByPath,
    splitFaces,
    type HighlightColor,
  } from './lib/doc-layout';
  import { carryFromPortrait, carryFromText, formatPartialDate, isActivation } from './lib/view';
  import type { BodyOptions, KeywordState, ReadMode } from './doc/context';
  import DocumentBody from './doc/DocumentBody.svelte';
  import KeywordBubble, { type BubbleItem } from './doc/KeywordBubble.svelte';
  import { HL_LABELS, KIND_LABELS, pm } from './messages';

  const game = getGame();

  const id = $derived(game.ui.openDocument);
  const doc = $derived(id ? game.content.documents[id] : undefined);

  let mode = $state<ReadMode>(game.settings.transcriptByDefault ? 'transcript' : 'original');
  let face = $state<'front' | 'back'>('front');
  let zoom = $state(1);
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
  const only = $derived(
    !flippable || mode === 'transcript' ? null : face === 'front' ? faces.front : faces.back,
  );
  const highlights = $derived(id ? rangesByPath(game.state.notebook.highlights, id) : new Map());
  const myHighlights = $derived(
    game.state.notebook.highlights.map((h, index) => ({ ...h, index })).filter((h) => h.doc === id),
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

  const figure = (asset: string) => illustration(game.content.id, asset);

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
    game.dispatch({ type: 'highlight', h: { doc: id, ...p, color } });
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

  const place = $derived(doc?.place ? game.content.places[doc.place] : undefined);
  const facesOf = $derived(doc?.reveals?.portraits ?? []);
  const occupations = $derived(doc?.reveals?.occupations ?? []);
</script>

<Panel
  title={doc?.title ?? pm.reader.title}
  kicker={doc ? KIND_LABELS[doc.kind] : undefined}
  surface="paper"
  scroll={false}
  padded={false}
  class="reader-panel"
>
  {#snippet actions()}
    {#if doc}
      <IconButton
        icon="pin"
        label={pinned ? pm.common.unpin : pm.common.pin}
        pressed={pinned}
        onclick={togglePin}
      />
      <IconButton icon="note" label={pm.reader.noteTitle} pressed={!!note} onclick={openNote} />
    {/if}
  {/snippet}

  {#if !doc}
    <div class="none">
      <p>{pm.reader.none}</p>
      <Button iconName="archives" onclick={() => game.navigate({ kind: 'panel', id: 'archives' })}
        >{pm.reader.toArchives}</Button
      >
    </div>
  {:else}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="reader" bind:this={readerEl}>
      <div class="toolbar" role="toolbar" aria-label={pm.reader.mode}>
        <div class="seg" role="group" aria-label={pm.reader.mode}>
          <Button
            variant={mode === 'original' ? 'primary' : 'ghost'}
            aria-pressed={mode === 'original'}
            onclick={() => (mode = 'original')}>{pm.reader.original}</Button
          >
          <Button
            variant={mode === 'transcript' ? 'primary' : 'ghost'}
            aria-pressed={mode === 'transcript'}
            iconName="transcript"
            onclick={() => (mode = 'transcript')}>{pm.reader.transcript}</Button
          >
        </div>
        {#if flippable && mode === 'original'}
          <Button iconName="flip" onclick={() => (face = face === 'front' ? 'back' : 'front')}
            >{pm.reader.flip} · {face === 'front' ? pm.reader.front : pm.reader.back}</Button
          >
        {/if}
        <div class="seg" role="group" aria-label={pm.reader.zoomIn}>
          <IconButton
            icon="zoom-out"
            label={pm.reader.zoomOut}
            disabled={zoom <= 1}
            onclick={() => setZoom(zoom - 0.25)}
          />
          <span class="num zoom">×{zoom.toLocaleString('fr-FR')}</span>
          <IconButton
            icon="zoom-in"
            label={pm.reader.zoomIn}
            disabled={zoom >= 4}
            onclick={() => setZoom(zoom + 0.25)}
          />
          <IconButton icon="fit" label={pm.reader.fit} onclick={() => setZoom(1)} />
        </div>
        <div class="seg hl" role="group" aria-label={pm.reader.highlight}>
          <Icon name="highlight" />
          {#each [1, 2, 3, 4, 5] as const as c (c)}
            <button
              type="button"
              class="swatch"
              aria-label="{pm.reader.highlight} : {HL_LABELS[c - 1]}"
              onpointerdown={(e) => e.preventDefault()}
              onclick={() => highlight(c)}
            >
              <span class="hl-{c}">Aa</span>
            </button>
          {/each}
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
          {#if doc.date}<span class="num">{formatPartialDate(doc.date)}</span>{/if}
          {#if doc.author}<span>{pm.reader.author} : {doc.author}</span>{/if}
          {#if doc.archive}<span>{pm.reader.archive} : {doc.archive}</span>{/if}
          {#if place}
            <Button
              variant="ghost"
              iconName="map"
              onclick={() => game.navigate({ kind: 'place', id: place.id })}>{place.name}</Button
            >
          {/if}
        </div>

        <div
          class="sheet grain kind-{doc.kind}"
          class:transcript={mode === 'transcript'}
          bind:this={sheet}
          style:zoom
        >
          <div class="reading">
            <DocumentBody blocks={doc.body} {opts} {highlights} {figure} {only} />
          </div>
        </div>

        {#if lens && sheet}
          <div class="lens" aria-hidden="true" style:left="{lens.x}px" style:top="{lens.y}px">
            <div
              class="lens-inner sheet kind-{doc.kind}"
              class:transcript={mode === 'transcript'}
              style:width="{sheet.offsetWidth}px"
              style:transform="translate({90 - lens.ox * 2.5}px, {90 - lens.oy * 2.5}px) scale(2.5)"
            >
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
          <section class="extra" aria-labelledby="reader-faces">
            <h3 id="reader-faces">{pm.reader.faces}</h3>
            <ul class="faces">
              {#each facesOf as p (p)}
                {@const pr = game.content.portraits[p]}
                {#if pr}
                  <li>
                    <button
                      type="button"
                      class="face"
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
                      <span class="face-art" use:svgContent={pr.svg}></span>
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
</Panel>

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
  :global(.reader-panel) {
    block-size: 100%;
  }
  .none {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    padding: var(--space-6);
  }
  .reader {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border-block-end: var(--border) solid var(--line);
  }
  .seg {
    display: flex;
    gap: var(--space-1);
    align-items: center;
  }
  .zoom {
    min-inline-size: 2.75rem;
    text-align: center;
  }
  .swatch {
    display: grid;
    place-items: center;
    min-inline-size: var(--hit);
    min-block-size: var(--hit);
    padding: 0;
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--surface-1);
    color: var(--text);
    font: inherit;
    font-weight: var(--weight-semibold);
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
    padding: var(--space-3) var(--space-4) var(--space-6);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    align-items: center;
    margin-block-end: var(--space-3);
    color: var(--text-muted);
  }
  .sheet {
    max-inline-size: calc(var(--measure) + 2 * var(--space-6));
    padding: var(--space-6);
    border-radius: var(--radius-paper);
    background: var(--surface-1);
    color: var(--text);
    box-shadow: var(--shadow-2);
    rotate: -0.4deg;
  }
  .sheet.transcript {
    rotate: none;
  }
  .sheet .reading {
    max-inline-size: none;
  }
  .kind-newspaper,
  .kind-directory {
    background: var(--surface-2);
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
  .lens {
    position: absolute;
    z-index: var(--z-popover);
    inline-size: 180px;
    block-size: 180px;
    margin: -90px 0 0 -90px;
    border: var(--border-strong) solid var(--line-strong);
    border-radius: var(--radius-pill);
    overflow: hidden;
    background: var(--surface-1);
    box-shadow: var(--shadow-3);
    pointer-events: none;
  }
  .lens-inner {
    transform-origin: 0 0;
    rotate: none;
    box-shadow: none;
  }
  .extra {
    margin-block-start: var(--space-6);
  }
  .extra h3 {
    margin: 0 0 var(--space-2);
    font-size: var(--step-1);
  }
  .faces {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
    gap: var(--space-3);
  }
  .face {
    display: grid;
    gap: var(--space-1);
    inline-size: 100%;
    padding: var(--space-2);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    color: var(--text);
    font: inherit;
    text-align: start;
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
