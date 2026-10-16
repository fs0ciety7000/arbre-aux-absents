<!--
  P10, champ Portrait : grille des visages collectés dans une grande boîte (`Dialog size="xl"`,
  plein écran au téléphone). Chaque tuile : le portrait, son numéro (celui de la Galerie des
  visages) et une ligne « vu dans : premier document (+n) » ; la description complète est
  repliée (interrupteur « Afficher les descriptions », réglage du profil) mais reste dans
  le nom accessible de la tuile, et s'affiche en grand dans l'aperçu (desktop) quand une tuile
  est survolée ou focalisée. Filtre plein texte (description, titres des documents) et
  « seulement le document ouvert ». Grille : un seul arrêt de tabulation, flèches, Début/Fin,
  Page préc./suiv. ; manette par la navigation spatiale.
-->
<script lang="ts">
  import { availablePortraits } from '@arbre/engine';
  import { Button, Icon, TextField, Toggle } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from './lib/assets.svelte';
  import { getApp, getGame } from '../lib/game/context';
  import { initialFocus } from '../lib/game/initial-focus';
  import {
    columnsFromTops,
    filterPortraits,
    gridMove,
    type PortraitEntry,
  } from './lib/portrait-picker';
  import { documentTitle, portraitOrigins, seenIn, usageCount } from './lib/view';
  import { pm } from './messages';

  interface Props {
    slot: string;
    currentValue: string | null;
    /** Case revendiquée : valeur déclarée, rappelée au-dessus de la grille. */
    declared?: string | null;
    onchoose: (portrait: string) => void;
  }
  let { slot, currentValue, declared = null, onchoose }: Props = $props();

  const game = getGame();
  const app = getApp();
  /** « Afficher les descriptions » : réglage du profil (absent = repliées), gardé d'un lancement à l'autre. */
  const showDescriptions = $derived(app.settings.pickerDescriptions ?? false);
  function setShowDescriptions(on: boolean) {
    app.updateSettings({ pickerDescriptions: on });
  }
  const uid = `pp-${Math.random().toString(36).slice(2, 8)}`;

  const entries: PortraitEntry[] = $derived.by(() => {
    const s = game.state;
    const c = game.content;
    return availablePortraits(s, c)
      .filter((p) => Object.hasOwn(c.portraits, p))
      .map((p, i) => {
        const docs = portraitOrigins(s, c, p);
        return {
          id: p,
          n: i + 1,
          alt: c.portraits[p]?.alt ?? p,
          docs,
          docTitles: docs.map((d) => documentTitle(c, d)),
        };
      });
  });

  let query = $state('');
  let onlyOpen = $state(false);
  const openDoc = $derived(game.ui.openDocument);
  /** Le filtre « document ouvert » n'est proposé que s'il garde au moins un visage. */
  const openDocUseful = $derived(openDoc !== null && entries.some((e) => e.docs.includes(openDoc)));
  const filtered = $derived(
    filterPortraits(entries, { query, onlyDoc: onlyOpen && openDocUseful ? openDoc : null }),
  );

  // Tuile active (roving tabindex) : par identifiant, pour survivre au filtrage.
  let activeId = $state<string | null>(null);
  const tabId = $derived(
    [activeId, currentValue].find((id) => id !== null && filtered.some((e) => e.id === id)) ??
      filtered[0]?.id ??
      null,
  );

  // Aperçu : tuile survolée, sinon focalisée, sinon le choix actuel, sinon la première.
  let hoverId = $state<string | null>(null);
  let focusId = $state<string | null>(null);
  const previewId = $derived(
    [hoverId, focusId, currentValue, filtered[0]?.id ?? null].find(
      (id) => id !== null && filtered.some((e) => e.id === id),
    ) ?? null,
  );
  const preview = $derived(entries.find((e) => e.id === previewId) ?? null);

  let grid: HTMLUListElement | undefined = $state();

  function tiles(): HTMLElement[] {
    return grid ? [...grid.querySelectorAll<HTMLElement>('button.tile')] : [];
  }

  function onGridKey(e: KeyboardEvent) {
    const list = tiles();
    const index = list.findIndex((el) => el === document.activeElement);
    if (index < 0) return;
    const cols = columnsFromTops(list.map((el) => el.getBoundingClientRect().top));
    const next = gridMove(index, e.key, cols, list.length);
    if (next === null) return;
    e.preventDefault();
    const target = list[next];
    if (!target) return;
    target.focus();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function onTileFocus(id: string) {
    activeId = id;
    focusId = id;
  }

  function clearFilters() {
    query = '';
    onlyOpen = false;
  }

  const total = $derived(entries.length);
</script>

<div class="pp" class:described={showDescriptions}>
  {#if declared}
    <p class="declared">
      {pm.picker.declared} <span class="claim-value">{declared}</span>
      {pm.picker.declaredSource}
    </p>
  {/if}
  <div class="tools">
    <div class="search">
      <TextField
        label={pm.picker.portraitSearch}
        hint={pm.picker.portraitSearchHint}
        iconName="search"
        type="search"
        autocomplete="off"
        bind:value={query}
      />
    </div>
    <div class="switches">
      <Toggle
        label={pm.picker.showDescriptions}
        bind:checked={() => showDescriptions, setShowDescriptions}
      />
      {#if openDocUseful && openDoc}
        <Toggle
          label={pm.picker.onlyOpenDoc}
          description={documentTitle(game.content, openDoc)}
          bind:checked={onlyOpen}
        />
      {/if}
    </div>
    <p class="count" role="status">{pm.picker.count(filtered.length, total)}</p>
  </div>

  <div class="layout">
    {#if filtered.length === 0}
      <div class="none">
        <p>{pm.picker.noPortraitMatch}</p>
        <Button variant="secondary" iconName="close" onclick={clearFilters}>
          {pm.picker.clearFilters}
        </Button>
      </div>
    {:else}
      <div class="scroller">
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <ul
          class="grid"
          aria-label={pm.picker.gallery}
          bind:this={grid}
          onkeydown={onGridKey}
          onmouseleave={() => (hoverId = null)}
          use:initialFocus={'button.tile[tabindex="0"]'}
        >
          {#each filtered as e (e.id)}
            {@const used = usageCount(game.state, game.content, 'portrait', e.id, slot)}
            {@const isCurrent = currentValue === e.id}
            <li>
              <button
                type="button"
                class="tile"
                data-portrait={e.id}
                data-verb="take"
                tabindex={e.id === tabId ? 0 : -1}
                aria-pressed={isCurrent}
                aria-describedby="{uid}-{e.n}"
                onclick={() => onchoose(e.id)}
                onfocus={() => onTileFocus(e.id)}
                onblur={() => (focusId = null)}
                onmouseenter={() => (hoverId = e.id)}
              >
                <span
                  class="art"
                  aria-hidden="true"
                  use:svgContent={portraitSvg(game.content, e.id)}
                ></span>
                <span class="head">
                  <span class="num">{pm.faces.face(e.n)}</span>
                  {#if isCurrent}
                    <span class="current"
                      ><Icon name="check" size="1rem" /><span class="visually-hidden"
                        >{pm.picker.current}</span
                      ></span
                    >
                  {/if}
                </span>
                <span class="alt" class:visually-hidden={!showDescriptions}>{e.alt}</span>
                {#if e.docs.length > 0}
                  <span class="seen" aria-hidden="true">{seenIn(game.content, e.docs, 1)}</span>
                {/if}
                {#if used > 0}<span class="used">{pm.common.usedIn(used)}</span>{/if}
              </button>
              <span id="{uid}-{e.n}" class="visually-hidden"
                >{seenIn(game.content, e.docs, e.docs.length)}</span
              >
            </li>
          {/each}
        </ul>
      </div>
      {#if preview}
        <!-- Aperçu visuel : tout son texte est déjà dans le nom et la description de la tuile. -->
        <aside class="preview" aria-hidden="true">
          <div class="preview-card">
            <span class="art" use:svgContent={portraitSvg(game.content, preview.id)}></span>
            <p class="num">
              {pm.faces.face(preview.n)}
              {#if currentValue === preview.id}
                <span class="current"><Icon name="check" size="1rem" /> {pm.picker.current}</span>
              {/if}
            </p>
            <p class="preview-alt">{preview.alt}</p>
            {#if preview.docTitles.length > 0}
              <p class="seen-label">{pm.faces.origin}</p>
              <ul class="docs">
                {#each preview.docTitles as t, i (i)}<li>{t}</li>{/each}
              </ul>
            {/if}
          </div>
        </aside>
      {/if}
    {/if}
  </div>
</div>

<style>
  .pp {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .declared {
    margin: 0;
    color: var(--text-muted);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-2) var(--space-4);
    padding-block: var(--space-1) var(--space-3);
    border-block-end: var(--border) solid var(--line);
  }
  .search {
    flex: 1 1 18rem;
    min-inline-size: 0;
  }
  .switches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    min-inline-size: 0;
  }
  .count {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--step--1);
    min-block-size: var(--hit);
    display: flex;
    align-items: center;
  }
  .layout {
    display: grid;
    gap: var(--space-4);
    min-block-size: 0;
  }
  .scroller {
    min-block-size: 0;
    min-inline-size: 0;
  }
  .none {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    padding-block: var(--space-6);
  }
  .none p {
    margin: 0;
  }
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(9rem, 100%), 1fr));
    gap: var(--space-3);
  }
  .grid > li {
    display: grid;
    min-inline-size: 0;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: var(--hit);
    padding: var(--space-2);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--surface-2);
    color: var(--text);
    font: inherit;
    text-align: start;
    transition: border-color var(--dur-fade-fast) var(--ease-out);
  }
  .tile:hover {
    border-color: var(--accent);
  }
  .tile[aria-pressed='true'] {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 var(--border) var(--accent);
  }
  .art {
    display: block;
    aspect-ratio: 4 / 5;
    background: var(--art-paper);
    border-radius: var(--radius-xs);
    overflow: hidden;
  }
  .art :global(svg) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1);
  }
  .num {
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    font-size: var(--step--1);
  }
  .current {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    color: var(--accent);
  }
  .alt {
    line-height: var(--leading-snug);
    font-size: var(--step--1);
    overflow-wrap: anywhere;
  }
  .seen,
  .used {
    color: var(--text-muted);
    font-size: var(--step--1);
    line-height: var(--leading-snug);
  }
  /* Deux lignes au plus : la liste complète est dans la description accessible et l'aperçu. */
  .seen {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  .preview {
    display: none;
  }
  /* Tablette et plus : la boîte a une hauteur fixe ; les outils restent en place, la grille
     (et l'aperçu) défilent chacun dans sa colonne. Téléphone : tout défile d'un bloc. */
  @media (min-width: 37.5rem) {
    /* Descriptions affichées : tuiles plus larges (au téléphone, deux colonnes restent). */
    .described .grid {
      grid-template-columns: repeat(auto-fill, minmax(min(11rem, 100%), 1fr));
    }
    .pp {
      block-size: 100%;
      min-block-size: 0;
    }
    .layout {
      flex: 1;
      grid-template-rows: minmax(0, 1fr);
      overflow: hidden;
    }
    .scroller,
    .preview {
      overflow-y: auto;
      overscroll-behavior: contain;
      /* place pour l'anneau de focus (3 px décalé de 2 px) */
      padding: var(--space-2);
    }
  }
  /* Assez large : aperçu à droite (description complète, tous les documents). */
  @media (min-width: 64rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 20rem;
    }
    .preview {
      display: block;
    }
  }
  .preview-card {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-4);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-l);
    background: var(--surface-2);
  }
  .preview-card p {
    margin: 0;
  }
  .preview-card .num {
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .preview-alt {
    line-height: var(--leading-read);
  }
  .seen-label {
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .docs {
    margin: 0;
    padding-inline-start: var(--space-4);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  @media (forced-colors: active) {
    .tile[aria-pressed='true'] {
      outline: var(--border-strong) solid CanvasText;
    }
  }
</style>
