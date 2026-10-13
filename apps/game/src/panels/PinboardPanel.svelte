<!--
  P07 — Tableau d'épingles : documents, termes et cases épinglés (60 au plus), dans l'ordre
  d'épinglage. Ouvrir une épingle navigue vers sa cible ; « Retirer » la désépingle.
-->
<script lang="ts">
  import type { Pin } from '@arbre/contract';
  import { Badge, Card, IconButton, Ornament, Panel } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import Spot from '../shell/Spot.svelte';
  import { documentMeta, slotName } from './lib/view';
  import { pm } from './messages';

  const PIN_LIMIT = 60;
  const game = getGame();

  const pins = $derived(game.state.notebook.pins.filter((p) => exists(p)));

  function exists(p: Pin): boolean {
    const c = game.content;
    if (p.kind === 'document') return Object.hasOwn(c.documents, p.id);
    if (p.kind === 'keyword') return Object.hasOwn(c.keywords, p.id);
    return Object.hasOwn(c.slots, p.id);
  }

  function titleOf(p: Pin): string {
    const c = game.content;
    if (p.kind === 'document') return c.documents[p.id]?.title ?? p.id;
    if (p.kind === 'keyword') return c.keywords[p.id]?.label ?? p.id;
    return slotName(game.state, c, p.id) ?? pm.tree.unknownPerson;
  }

  function metaOf(p: Pin): string | undefined {
    if (p.kind === 'document') return documentMeta(game.content, p.id) || undefined;
    return undefined;
  }

  function open(p: Pin) {
    if (p.kind === 'document') game.navigate({ kind: 'document', id: p.id });
    else if (p.kind === 'keyword') game.navigate({ kind: 'keyword', id: p.id });
    else game.navigate({ kind: 'slot', id: p.id });
  }

  function unpin(p: Pin, index: number) {
    game.dispatch({ type: 'unpin', target: { kind: p.kind, id: p.id } });
    // Le focus passe à l'épingle suivante (ou précédente), jamais sur le vide.
    queueMicrotask(() => {
      const items = document.querySelectorAll<HTMLElement>('.pinboard-panel .pin .cover');
      (items[index] ?? items[index - 1])?.focus();
    });
  }

  const tilt = (i: number) => ((i * 5) % 7) * 0.4 - 1.2;

  /* Fil rouge (§6.4) tendu d'une punaise à l'autre, dans l'ordre d'épinglage. Décor seul. */
  let board: HTMLUListElement | undefined = $state();
  let thread = $state<{ w: number; h: number; d: string } | null>(null);

  function measure() {
    if (!board) return;
    const box = board.getBoundingClientRect();
    const pts = [...board.querySelectorAll<HTMLElement>('.pin-head')].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height * 0.35 - box.top] as const;
    });
    if (pts.length < 2) {
      thread = null;
      return;
    }
    // Le fil pend un peu entre deux punaises (courbe quadratique, flèche selon l'écart).
    const d = pts
      .map(([x, y], i) => {
        if (i === 0) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
        const [px, py] = pts[i - 1]!;
        const sag = Math.min(28, Math.hypot(x - px, y - py) * 0.12);
        return `Q${((px + x) / 2).toFixed(1)} ${((py + y) / 2 + sag).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
    thread = { w: box.width, h: box.height, d };
  }

  $effect(() => {
    void pins.length;
    const el = board;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const raf = requestAnimationFrame(measure);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  });
</script>

<Panel title={pm.pinboard.title} class="pinboard-panel">
  {#snippet actions()}
    <Badge tone={pins.length >= PIN_LIMIT ? 'warning' : 'neutral'}>
      <span class="num">{pm.pinboard.count(pins.length)}</span>
    </Badge>
  {/snippet}

  {#if pins.length === 0}
    <div class="empty">
      <Spot name="stamp" size="9rem" />
      <p>{pm.pinboard.empty}</p>
    </div>
  {:else}
    {#if pins.length >= PIN_LIMIT}<p class="full" role="status">{pm.pinboard.full}</p>{/if}
    <div class="cork">
      {#if thread}
        <svg
          class="thread"
          width={thread.w}
          height={thread.h}
          viewBox="0 0 {thread.w} {thread.h}"
          aria-hidden="true"
          focusable="false"><path d={thread.d} /></svg
        >
      {/if}
      <ul class="board" bind:this={board}>
        {#each pins as p, i (p.kind + ':' + p.id)}
          <li class="pin mv-deal" style:--i={Math.min(i, 12)}>
            <span class="pin-head" aria-hidden="true"><Ornament name="pin" size="22px" /></span>
            <Card
              variant={p.kind === 'document' ? 'document' : 'index'}
              title={titleOf(p)}
              kicker={pm.pinboard.kinds[p.kind]}
              meta={metaOf(p)}
              tilt={tilt(i)}
              verb="look"
              onactivate={() => open(p)}
            />
            <span class="unpin">
              <IconButton
                icon="close"
                label={`${pm.pinboard.unpin} : ${titleOf(p)}`}
                onclick={() => unpin(p, i)}
              />
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</Panel>

<style>
  :global(.pinboard-panel) {
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
  .cork {
    position: relative;
  }
  .thread {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: visible;
    pointer-events: none;
    fill: none;
    stroke: var(--string);
    stroke-width: 1.6;
    stroke-linecap: round;
    filter: drop-shadow(0 1px 0 var(--kraft-edge));
    animation: m-fade-in var(--dur-slow) var(--ease-out) var(--dur-deal) backwards;
  }
  .pin-head {
    position: absolute;
    inset-block-start: calc(var(--space-3) * -1);
    inset-inline-start: 50%;
    z-index: 3;
    translate: -50% 0;
    color: var(--metal-shade);
    filter: drop-shadow(1px 2px 1px var(--kraft-edge));
    pointer-events: none;
  }
  @media (forced-colors: active) {
    .thread,
    .pin-head {
      display: none;
    }
  }
  .full {
    margin: 0 0 var(--space-3);
    color: var(--warning);
  }
  .board {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: var(--space-8) var(--space-5);
    padding-block-start: var(--space-4);
  }
  .pin {
    position: relative;
  }
  .unpin {
    position: absolute;
    inset-block-start: calc(var(--space-2) * -1);
    inset-inline-end: calc(var(--space-2) * -1);
    z-index: var(--z-raised);
  }
</style>
