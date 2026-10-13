<!--
  P02 — Archives (l'inventaire) : documents débloqués en grille ou en liste, tri, filtres par
  type, lieu et état (non lu / lu / épinglé), recherche dans les titres, pastilles « non lu »
  (aide de niveau ≥ 1). Ouvrir une fiche ouvre le Lecteur.
-->
<script lang="ts">
  import type { DocumentKind } from '@arbre/contract';
  import { Button, Card, IconButton, Panel, Select, TextField } from '@arbre/ui';
  import { fold } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import Spot from '../shell/Spot.svelte';
  import { dateKey, formatPartialDate } from './lib/view';
  import { KIND_LABELS, pm } from './messages';

  const game = getGame();

  type Sort = 'found' | 'date' | 'kind' | 'title';
  let sort = $state<Sort>('found');
  let kind = $state('');
  let place = $state('');
  let readState = $state('');
  let query = $state('');
  let layout = $state<'grid' | 'list'>('grid');

  const unlocked = $derived(
    Object.keys(game.state.unlocked).filter((id) => game.content.documents[id] !== undefined),
  );
  const pinned = $derived(
    new Set(game.state.notebook.pins.filter((p) => p.kind === 'document').map((p) => p.id)),
  );
  const badges = $derived(game.settings.hints.unreadBadges);

  const kinds = $derived(
    [...new Set(unlocked.map((id) => game.content.documents[id]!.kind))].sort((a, b) =>
      KIND_LABELS[a].localeCompare(KIND_LABELS[b], 'fr'),
    ),
  );
  const places = $derived(
    [
      ...new Set(
        unlocked.map((id) => game.content.documents[id]!.place).filter((p): p is string => !!p),
      ),
    ]
      .map((id) => ({ id, name: game.content.places[id]?.name ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  );

  const docs = $derived.by(() => {
    const c = game.content;
    const s = game.state;
    const q = fold(query);
    const list = unlocked.filter((id) => {
      const d = c.documents[id]!;
      if (kind && d.kind !== kind) return false;
      if (place && d.place !== place) return false;
      if (readState === 'unread' && s.read[id] !== undefined) return false;
      if (readState === 'read' && s.read[id] === undefined) return false;
      if (readState === 'pinned' && !pinned.has(id)) return false;
      if (q && !fold(d.title).includes(q)) return false;
      return true;
    });
    const cmp: Record<Sort, (a: string, b: string) => number> = {
      found: (a, b) => (s.unlocked[a] ?? 0) - (s.unlocked[b] ?? 0),
      date: (a, b) => dateKey(c.documents[a]!.date).localeCompare(dateKey(c.documents[b]!.date)),
      kind: (a, b) =>
        KIND_LABELS[c.documents[a]!.kind].localeCompare(KIND_LABELS[c.documents[b]!.kind], 'fr'),
      title: (a, b) => c.documents[a]!.title.localeCompare(c.documents[b]!.title, 'fr'),
    };
    return list.sort((a, b) => cmp[sort](a, b) || (a < b ? -1 : 1));
  });

  const filtered = $derived(Boolean(kind || place || readState || query));

  function clearFilters() {
    kind = '';
    place = '';
    readState = '';
    query = '';
  }

  function openFirst() {
    const first = game.content.meta.intro;
    game.navigate({ kind: 'document', id: first });
  }

  const tilt = (id: string) => ((id.length * 7) % 5) * 0.5 - 1;
</script>

<Panel title={pm.archives.title} class="archives-panel">
  {#snippet actions()}
    <IconButton
      icon={layout === 'grid' ? 'list' : 'archives'}
      label={layout === 'grid' ? pm.archives.list : pm.archives.grid}
      onclick={() => (layout = layout === 'grid' ? 'list' : 'grid')}
    />
  {/snippet}

  {#if unlocked.length === 0}
    <div class="empty">
      <Spot name="archives" size="9rem" />
      <p>{pm.archives.empty}</p>
      <Button variant="primary" iconName="reader" onclick={openFirst}
        >{pm.archives.openFirst}</Button
      >
    </div>
  {:else}
    <div class="filters">
      <TextField label={pm.archives.search} iconName="search" bind:value={query} type="search" />
      <Select
        label={pm.archives.sort}
        bind:value={sort}
        options={(['found', 'date', 'kind', 'title'] as const).map((v) => ({
          value: v,
          label: pm.archives.sortOptions[v],
        }))}
      />
      <Select
        label={pm.archives.kind}
        bind:value={kind}
        options={[
          { value: '', label: pm.archives.all },
          ...kinds.map((k: DocumentKind) => ({ value: k, label: KIND_LABELS[k] })),
        ]}
      />
      {#if places.length > 0}
        <Select
          label={pm.archives.place}
          bind:value={place}
          options={[
            { value: '', label: pm.archives.all },
            ...places.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      {/if}
      <Select
        label={pm.archives.state}
        bind:value={readState}
        options={[
          { value: '', label: pm.archives.all },
          { value: 'unread', label: pm.archives.stateOptions.unread },
          { value: 'read', label: pm.archives.stateOptions.read },
          { value: 'pinned', label: pm.archives.stateOptions.pinned },
        ]}
      />
    </div>
    <p class="count num" aria-live="polite">{pm.archives.count(docs.length, unlocked.length)}</p>

    {#if docs.length === 0}
      <div class="empty">
        <Spot name="magnifier" size="8rem" />
        <p>{pm.archives.noMatch}</p>
        {#if filtered}<Button onclick={clearFilters}>{pm.archives.clearFilters}</Button>{/if}
      </div>
    {:else}
      <ul class="docs {layout}">
        {#each docs as id, i (id)}
          {@const d = game.content.documents[id]!}
          <li>
            <Card
              variant={layout === 'grid' ? (d.kind === 'photo' ? 'photo' : 'document') : 'index'}
              deal={i < 12 ? i : undefined}
              title={d.title}
              kicker={KIND_LABELS[d.kind]}
              meta={[formatPartialDate(d.date), d.place ? game.content.places[d.place]?.name : '']
                .filter(Boolean)
                .join(' · ') || undefined}
              unread={badges && game.state.read[id] === undefined}
              pinned={pinned.has(id)}
              selected={game.ui.openDocument === id}
              tilt={layout === 'grid' ? tilt(id) : 0}
              verb="take"
              onactivate={() => game.navigate({ kind: 'document', id })}
            />
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</Panel>

<style>
  :global(.archives-panel) {
    block-size: 100%;
  }
  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: var(--space-3);
    align-items: end;
  }
  .filters > :global(:first-child) {
    grid-column: 1 / -1;
  }
  .count {
    margin: var(--space-3) 0;
    color: var(--text-muted);
  }
  .empty {
    display: grid;
    gap: var(--space-3);
    justify-items: center;
    padding-block: var(--space-6);
    text-align: center;
  }
  .empty p {
    margin: 0;
  }
  .docs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-4);
  }
  .docs.grid {
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: var(--space-5) var(--space-4);
    padding-block: var(--space-2);
  }
  .docs.list {
    gap: var(--space-2);
  }
</style>
