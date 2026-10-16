<!--
  P11 — Galerie des visages : portraits collectés sur les photographies lues, avec les
  documents où ils figurent. « Utiliser dans l'arbre » prend le visage (prendre → déposer) ;
  à la souris, on peut aussi le glisser sur une case. Affaire à marques (AFFAIRE-3 §1.4) :
  « Galerie », onglets Visages (N) / Marques (N), numérotation par onglet, description en clair.
-->
<script lang="ts" module>
  import type { PortraitKind } from '@arbre/contract';

  /** Onglet de la Galerie gardé par partie (le panneau est démonté à chaque changement). */
  const lastTab = new WeakMap<object, PortraitKind>();
</script>

<script lang="ts">
  import { availablePortraits, portraitKindOf } from '@arbre/engine';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from './lib/assets.svelte';
  import { Badge, Button, MarkFrame, Panel, Tabs } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import Spot from '../shell/Spot.svelte';
  import { carry, DRAG_MIME, encodeCarry } from './lib/carry.svelte';
  import { caseHasMarks, portraitNumberLabel } from './lib/marks';
  import { carryFromPortrait, portraitOrigins, usageCount } from './lib/view';
  import { pm } from './messages';

  const game = getGame();
  const all = $derived(
    availablePortraits(game.state, game.content).filter((p) =>
      Object.hasOwn(game.content.portraits, p),
    ),
  );
  /** Onglets Visages / Marques seulement si l'affaire contient des marques (AFFAIRE-3 §1.4). */
  const tabbed = $derived(caseHasMarks(game.content));
  const faces = $derived(all.filter((p) => portraitKindOf(p, game.content) === 'face'));
  const marks = $derived(all.filter((p) => portraitKindOf(p, game.content) === 'mark'));

  /** Dernier onglet utilisé ; au premier passage, celui du plus récent élément collecté. */
  let chosen = $state<PortraitKind | null>(lastTab.get(game) ?? null);
  const tab = $derived<PortraitKind>(
    chosen ?? (all.length > 0 ? portraitKindOf(all[all.length - 1]!, game.content) : 'face'),
  );
  function setTab(id: string) {
    chosen = id === 'mark' ? 'mark' : 'face';
    lastTab.set(game, chosen);
  }
  const kind = $derived<PortraitKind>(tabbed ? tab : 'face');
  const label = (n: number) => portraitNumberLabel(kind, n);
  const title = $derived(tabbed ? messages.galleryWithMarks : pm.faces.title);

  function use(p: string, n: number) {
    carry.take(carryFromPortrait(game.content, p, label(n)));
    game.navigate({ kind: 'panel', id: 'tree' });
  }

  function ondragstart(e: DragEvent, p: string, n: number) {
    const item = carryFromPortrait(game.content, p, label(n));
    e.dataTransfer?.setData(DRAG_MIME, encodeCarry(item));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
    carry.take(item);
  }
</script>

{#snippet gallery(list: string[])}
  {#if list.length === 0}
    <div class="empty">
      <Spot name="magnifier" size="9rem" />
      <p>{kind === 'mark' ? pm.marks.emptyMarks : pm.faces.empty}</p>
    </div>
  {:else}
    <ul class="gallery" class:marks={kind === 'mark'}>
      {#each list as p, i (p)}
        {@const pr = game.content.portraits[p]!}
        {@const origins = portraitOrigins(game.state, game.content, p)}
        {@const used = usageCount(game.state, game.content, 'portrait', p)}
        <li
          class="face mv-deal"
          style:--i={Math.min(i, 12)}
          draggable="true"
          data-portrait={p}
          ondragstart={(e) => ondragstart(e, p, i + 1)}
        >
          {#if kind === 'mark'}
            <!-- Marque (§1.4) : dessin ≥ 96 px, numéro, description en clair ; jamais de code. -->
            <figure class="relief" data-surface="paper">
              <MarkFrame size="tile">
                <span use:svgContent={portraitSvg(game.content, p)}></span>
              </MarkFrame>
              <figcaption>
                <span class="num n">{label(i + 1)}</span>
                <span class="desc">{pr.alt}</span>
              </figcaption>
            </figure>
            {#if used > 0}<Badge tone="established">{pm.marks.usedIn(used)}</Badge>{/if}
          {:else}
            <figure
              class="print mv-liftable"
              data-surface="paper"
              style:--tilt="{i % 2 ? 1.2 : -1.4}deg"
            >
              <span class="art" use:svgContent={portraitSvg(game.content, p)}></span>
              <figcaption>
                <span class="num n">{label(i + 1)}</span>
                <span class="alt">{pr.alt}</span>
              </figcaption>
            </figure>
            {#if used > 0}<Badge tone="established">{pm.common.usedIn(used)}</Badge>{/if}
          {/if}
          {#if origins.length > 0}
            <p class="origin">{pm.faces.origin} :</p>
            <ul class="docs">
              {#each origins as d (d)}
                <li>
                  <button
                    type="button"
                    class="link"
                    onclick={() => game.navigate({ kind: 'document', id: d })}
                  >
                    {game.content.documents[d]?.title ?? d}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
          <Button iconName="use" verb="use" block class="face-use" onclick={() => use(p, i + 1)}
            >{pm.faces.use}</Button
          >
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<Panel {title} class="faces-panel">
  {#if tabbed}
    <Tabs
      label={pm.marks.galleryTabs}
      variant="line"
      idPrefix="gallery"
      bind:value={() => tab, setTab}
      items={[
        { id: 'face', label: pm.marks.tabFaces(faces.length) },
        { id: 'mark', label: pm.marks.tabMarks(marks.length) },
      ]}
    >
      {#snippet children(id: string)}
        {@render gallery(id === 'mark' ? marks : faces)}
      {/snippet}
    </Tabs>
  {:else}
    {@render gallery(all)}
  {/if}
</Panel>

<style>
  :global(.faces-panel) {
    block-size: 100%;
  }
  .empty {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    padding-block: var(--space-6);
    color: var(--text-muted);
    text-align: center;
  }
  .empty p {
    margin: 0;
  }
  .gallery {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    gap: var(--space-4);
  }
  .face {
    display: grid;
    gap: var(--space-2);
    align-content: start;
    justify-items: start;
    padding: var(--space-2);
  }
  /* Tirage photo (§6.4) : bord blanc, légende manuscrite, se soulève au survol. */
  figure {
    margin: 0;
    display: grid;
    gap: var(--space-1);
    inline-size: 100%;
    padding: var(--space-2) var(--space-2) var(--space-3);
    border-radius: var(--radius-xs);
    background: var(--surface-1);
    box-shadow: var(--shadow-paper);
    color: var(--text);
    transform: rotate(var(--tilt, 0deg));
  }
  .face:active figure {
    box-shadow: var(--shadow-lifted);
  }
  @media (forced-colors: active) {
    figure {
      border: 1px solid CanvasText;
    }
  }
  .art {
    display: block;
    aspect-ratio: 4 / 5;
    background: var(--art-paper);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .art :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  figcaption {
    display: grid;
  }
  /* Relevé d'une marque : pas d'inclinaison de tirage, description en clair (texte courant). */
  .relief {
    justify-items: center;
  }
  .relief figcaption {
    justify-self: stretch;
  }
  .desc {
    color: var(--text);
    font-size: var(--step--1);
    line-height: var(--leading-snug);
  }
  /* 3 colonnes à 360 px (§1.4). */
  .gallery.marks {
    grid-template-columns: repeat(auto-fill, minmax(min(6.5rem, 30%), 1fr));
  }
  .n {
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .alt {
    color: var(--text);
    font-family: var(--font-hand);
    font-size: var(--step-1);
    line-height: 1.1;
  }
  .origin {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .docs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .face :global(.face-use) {
    white-space: normal;
    text-align: start;
  }
  .link {
    min-block-size: var(--hit);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--accent);
    font: inherit;
    text-align: start;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
</style>
