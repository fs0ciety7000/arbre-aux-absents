<!--
  P11 — Galerie des visages : portraits collectés sur les photographies lues, avec les
  documents où ils figurent. « Utiliser dans l'arbre » prend le visage (prendre → déposer) ;
  à la souris, on peut aussi le glisser sur une case.
-->
<script lang="ts">
  import { availablePortraits } from '@arbre/engine';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from './lib/assets.svelte';
  import { Badge, Button, Panel } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import Spot from '../shell/Spot.svelte';
  import { carry, DRAG_MIME, encodeCarry } from './lib/carry.svelte';
  import { carryFromPortrait, portraitOrigins, usageCount } from './lib/view';
  import { pm } from './messages';

  const game = getGame();
  const portraits = $derived(
    availablePortraits(game.state, game.content).filter((p) =>
      Object.hasOwn(game.content.portraits, p),
    ),
  );

  function use(p: string, n: number) {
    carry.take(carryFromPortrait(game.content, p, pm.faces.face(n)));
    game.navigate({ kind: 'panel', id: 'tree' });
  }

  function ondragstart(e: DragEvent, p: string, n: number) {
    const item = carryFromPortrait(game.content, p, pm.faces.face(n));
    e.dataTransfer?.setData(DRAG_MIME, encodeCarry(item));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
    carry.take(item);
  }
</script>

<Panel title={pm.faces.title} class="faces-panel">
  {#if portraits.length === 0}
    <div class="empty">
      <Spot name="magnifier" size="9rem" />
      <p>{pm.faces.empty}</p>
    </div>
  {:else}
    <ul class="gallery">
      {#each portraits as p, i (p)}
        {@const pr = game.content.portraits[p]!}
        {@const origins = portraitOrigins(game.state, game.content, p)}
        {@const used = usageCount(game.state, game.content, 'portrait', p)}
        <li
          class="face mv-deal"
          style:--i={Math.min(i, 12)}
          draggable="true"
          ondragstart={(e) => ondragstart(e, p, i + 1)}
        >
          <figure
            class="print mv-liftable"
            data-surface="paper"
            style:--tilt="{i % 2 ? 1.2 : -1.4}deg"
          >
            <span class="art" use:svgContent={portraitSvg(game.content, p)}></span>
            <figcaption>
              <span class="num n">{pm.faces.face(i + 1)}</span>
              <span class="alt">{pr.alt}</span>
            </figcaption>
          </figure>
          {#if used > 0}<Badge tone="established">{pm.common.usedIn(used)}</Badge>{/if}
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
