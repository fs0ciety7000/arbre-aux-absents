<!--
  P07 — Tableau d'épingles : documents, termes et cases épinglés (60 au plus), dans l'ordre
  d'épinglage. Ouvrir une épingle navigue vers sa cible ; « Retirer » la désépingle.
-->
<script lang="ts">
  import type { Pin } from '@arbre/contract';
  import { Badge, Card, IconButton, Panel } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
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
</script>

<Panel title={pm.pinboard.title} class="pinboard-panel">
  {#snippet actions()}
    <Badge tone={pins.length >= PIN_LIMIT ? 'warning' : 'neutral'}>
      <span class="num">{pm.pinboard.count(pins.length)}</span>
    </Badge>
  {/snippet}

  {#if pins.length === 0}
    <p class="empty">{pm.pinboard.empty}</p>
  {:else}
    {#if pins.length >= PIN_LIMIT}<p class="full" role="status">{pm.pinboard.full}</p>{/if}
    <ul class="board">
      {#each pins as p, i (p.kind + ':' + p.id)}
        <li class="pin">
          <Card
            variant={p.kind === 'document' ? 'document' : 'fiche'}
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
  {/if}
</Panel>

<style>
  :global(.pinboard-panel) {
    block-size: 100%;
  }
  .empty {
    margin: 0;
    padding-block: var(--space-6);
    color: var(--text-muted);
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
    gap: var(--space-5) var(--space-4);
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
