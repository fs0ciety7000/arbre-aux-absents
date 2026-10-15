<!--
  P05 — Carnet automatique : rubriques de termes (lus = notés), passages surlignés, notes.
  Une entrée : libellé, nombre de documents, documents où il apparaît, état recherché / tout
  consulté (aide ≥ 1), « souvent cités ensemble », actions (Rechercher, Épingler, Utiliser dans
  l'arbre). Jamais de déduction écrite par le jeu.
-->
<script lang="ts">
  import type { Keyword, KeywordId } from '@arbre/contract';
  import { exhaustedKeywords, keywordMentions, knownKeywords } from '@arbre/engine';
  import { Badge, Button, fold, Icon, IconButton, Panel, Select, Tabs, TextField } from '@arbre/ui';
  import { tick } from 'svelte';
  import { getGame } from '../lib/game/context';
  import { carry } from './lib/carry.svelte';
  import { inLanguage, passageText } from './lib/doc-layout';
  import { carryFromText, documentTitle, keywordOrigins } from './lib/view';
  import { KEYWORD_RUBRICS, pm, RUBRIC_EMPTY } from './messages';
  import { intlLocale } from '../i18n/index.svelte';

  const game = getGame();

  let section = $state('terms');
  let filter = $state('');
  let sort = $state<'found' | 'alpha' | 'freq'>('found');
  let expanded = $state<KeywordId | null>(null);
  let draft = $state('');
  let editing = $state<string | null>(null);

  const known = $derived(knownKeywords(game.state, game.content));
  const mentions = $derived(keywordMentions(game.state, game.content));
  const exhausted = $derived(
    game.settings.hints.exhaustedTerms
      ? new Set(exhaustedKeywords(game.state, game.content))
      : new Set<string>(),
  );

  const rubrics = $derived(Object.keys(KEYWORD_RUBRICS) as Keyword['kind'][]);

  const grouped = $derived.by(() => {
    const q = fold(filter);
    const order = new Map(known.map((k, i) => [k, i]));
    const list = known.filter((k) => !q || fold(game.content.keywords[k]?.label ?? k).includes(q));
    const cmp = {
      found: (a: string, b: string) => order.get(a)! - order.get(b)!,
      alpha: (a: string, b: string) =>
        (game.content.keywords[a]?.label ?? a).localeCompare(
          game.content.keywords[b]?.label ?? b,
          intlLocale(),
        ),
      freq: (a: string, b: string) =>
        (mentions[b] ?? 0) - (mentions[a] ?? 0) || order.get(a)! - order.get(b)!,
    }[sort];
    const out = new Map<Keyword['kind'], KeywordId[]>(rubrics.map((r) => [r, []]));
    for (const k of list.sort(cmp)) out.get(game.content.keywords[k]?.kind ?? 'other')!.push(k);
    return out;
  });

  /** Souvent cités ensemble : co-présents dans ≥ 2 documents lus (5 au plus). */
  function together(kw: KeywordId): KeywordId[] {
    const docs = keywordOrigins(game.state, game.content, kw);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- table locale, non réactive
    const count = new Map<KeywordId, number>();
    for (const d of docs) {
      for (const other of new Set(game.content.documents[d]?.keywords ?? [])) {
        if (other !== kw && known.includes(other)) count.set(other, (count.get(other) ?? 0) + 1);
      }
    }
    return [...count.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }

  // Navigation transverse vers un terme.
  $effect(() => {
    const kw = game.focusKeyword;
    if (!kw) return;
    section = 'terms';
    expanded = kw;
    filter = '';
    void tick().then(() =>
      document.getElementById(`nb-${kw}`)?.scrollIntoView({ block: 'nearest' }),
    );
  });

  const notes = $derived([...game.state.notebook.notes].sort((a, b) => b.at - a.at));
  const passages = $derived(
    game.state.notebook.highlights
      .map((h, index) => ({ ...h, index }))
      .filter((h) => game.content.documents[h.doc] && inLanguage(h, game.content.locale ?? 'fr')),
  );

  function targetLabel(t: { kind: string; id: string } | undefined): string | null {
    if (!t) return null;
    if (t.kind === 'document') return documentTitle(game.content, t.id);
    if (t.kind === 'keyword') return game.content.keywords[t.id]?.label ?? t.id;
    if (t.kind === 'slot') return t.id;
    return null;
  }

  function saveNote() {
    const text = draft.trim();
    if (!text) return;
    game.dispatch({ type: 'note', ...(editing ? { id: editing } : {}), text: draft });
    draft = '';
    editing = null;
  }

  const isPinned = (kw: string) =>
    game.state.notebook.pins.some((p) => p.kind === 'keyword' && p.id === kw);
</script>

<Panel title={pm.notebook.title} class="notebook-panel">
  <Tabs
    class="notebook-tabs"
    label={pm.notebook.sections}
    bind:value={section}
    items={[
      { id: 'terms', label: pm.notebook.terms, icon: 'notebook', badge: known.length || undefined },
      { id: 'passages', label: pm.notebook.passages, icon: 'highlight' },
      { id: 'notes', label: pm.notebook.notes, icon: 'note' },
    ]}
  >
    {#snippet children(tab)}
      {#if tab === 'terms'}
        <div class="filters">
          <TextField
            label={pm.notebook.filter}
            iconName="search"
            type="search"
            bind:value={filter}
          />
          <Select
            label={pm.notebook.sort}
            bind:value={sort}
            options={(['found', 'alpha', 'freq'] as const).map((v) => ({
              value: v,
              label: pm.notebook.sortOptions[v],
            }))}
          />
        </div>
        <p class="muted">{pm.notebook.termsHelp}</p>
        {#each rubrics as r (r)}
          {@const list = grouped.get(r) ?? []}
          {#if list.length > 0 || r === 'person' || r === 'place'}
            <section class="rubric" aria-labelledby="rub-{r}">
              <h3 id="rub-{r}">
                {KEYWORD_RUBRICS[r]} <span class="num muted">({list.length})</span>
              </h3>
              {#if list.length === 0}
                <p class="muted">{RUBRIC_EMPTY[r]}</p>
              {:else}
                <ul class="terms">
                  {#each list as kw (kw)}
                    {@const def = game.content.keywords[kw]}
                    {@const open = expanded === kw}
                    {@const isEx = exhausted.has(kw)}
                    <li id="nb-{kw}" class="term" class:exhausted={isEx} data-surface="paper">
                      <button
                        type="button"
                        class="term-head"
                        aria-expanded={open}
                        aria-controls="nb-body-{kw}"
                        onclick={() => (expanded = open ? null : kw)}
                      >
                        <Icon name={open ? 'chevron-up' : 'chevron-down'} />
                        <span class="label">{def?.label ?? kw}</span>
                        <span class="muted">{pm.notebook.mentions(mentions[kw] ?? 0)}</span>
                        {#if game.state.searched.includes(kw)}<Badge tone="info" iconName="search"
                            >{pm.notebook.searched}</Badge
                          >{/if}
                        {#if isEx}<Badge tone="success" iconName="check"
                            >{pm.notebook.exhausted}</Badge
                          >{/if}
                      </button>
                      {#if open}
                        <div class="term-body" id="nb-body-{kw}">
                          <div class="actions">
                            <Button
                              iconName="search"
                              verb="look"
                              onclick={() => {
                                game.dispatch({ type: 'search', query: def?.label ?? kw });
                                game.navigate({ kind: 'panel', id: 'catalogue' });
                              }}>{pm.common.search}</Button
                            >
                            <Button
                              iconName="pin"
                              verb="pin"
                              aria-pressed={isPinned(kw)}
                              onclick={() =>
                                game.dispatch({
                                  type: isPinned(kw) ? 'unpin' : 'pin',
                                  target: { kind: 'keyword', id: kw },
                                })}>{isPinned(kw) ? pm.common.unpin : pm.common.pin}</Button
                            >
                            {#if carryFromText(game.state, game.content, def?.label ?? '')}
                              <Button
                                iconName="use"
                                verb="use"
                                onclick={() => {
                                  const item = carryFromText(
                                    game.state,
                                    game.content,
                                    def?.label ?? '',
                                  );
                                  if (item) {
                                    carry.take(item);
                                    game.navigate({ kind: 'panel', id: 'tree' });
                                  }
                                }}>{pm.common.useInTree}</Button
                              >
                            {/if}
                          </div>
                          <h4>{pm.notebook.seenIn}</h4>
                          <ul class="links">
                            {#each keywordOrigins(game.state, game.content, kw) as d (d)}
                              <li>
                                <Button
                                  variant="ghost"
                                  iconName="reader"
                                  onclick={() => game.navigate({ kind: 'document', id: d })}
                                  >{documentTitle(game.content, d)}</Button
                                >
                              </li>
                            {/each}
                          </ul>
                          {#if together(kw).length > 0}
                            <h4>{pm.notebook.together}</h4>
                            <ul class="links inline">
                              {#each together(kw) as o (o)}
                                <li>
                                  <Button variant="ghost" onclick={() => (expanded = o)}
                                    >{game.content.keywords[o]?.label ?? o}</Button
                                  >
                                </li>
                              {/each}
                            </ul>
                          {/if}
                        </div>
                      {/if}
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>
          {/if}
        {/each}
      {:else if tab === 'passages'}
        {#if passages.length === 0}
          <p class="muted">{pm.notebook.passagesEmpty}</p>
        {:else}
          <ul class="passages">
            {#each passages as h, i (h.index)}
              {@const d = game.content.documents[h.doc]!}
              <li class="mv-deal" style:--i={Math.min(i, 12)} data-surface="paper">
                <blockquote class="reading">
                  <span class="hl-{h.color}">{passageText(d.body, h.path, h.start, h.end)}</span>
                </blockquote>
                <div class="actions">
                  <Button
                    variant="ghost"
                    iconName="reader"
                    onclick={() => game.navigate({ kind: 'document', id: h.doc, passage: h.path })}
                    >{d.title}</Button
                  >
                  <IconButton
                    icon="trash"
                    label={pm.reader.removeHighlight}
                    onclick={() => game.dispatch({ type: 'removeHighlight', index: h.index })}
                  />
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      {:else}
        <form
          class="note-form"
          onsubmit={(e) => {
            e.preventDefault();
            saveNote();
          }}
        >
          <TextField
            label={editing ? pm.notebook.edit : pm.notebook.addNote}
            multiline
            rows={4}
            maxlength={2000}
            bind:value={draft}
          />
          <div class="actions">
            <Button type="submit" variant="primary" iconName="save" disabled={!draft.trim()}
              >{pm.notebook.save}</Button
            >
            {#if editing}<Button variant="ghost" onclick={() => ((editing = null), (draft = ''))}
                >{pm.common.cancel}</Button
              >{/if}
          </div>
        </form>
        {#if notes.length === 0}
          <p class="muted">{pm.notebook.notesEmpty}</p>
        {:else}
          <ul class="notes">
            {#each notes as n, i (n.id)}
              <li class="mv-deal" style:--i={Math.min(i, 12)} data-surface="paper">
                {#if targetLabel(n.target)}<p class="muted">
                    {pm.notebook.on(targetLabel(n.target)!)}
                  </p>{/if}
                <p class="note-text">{n.text}</p>
                <div class="actions">
                  <Button
                    variant="ghost"
                    iconName="write"
                    onclick={() => ((editing = n.id), (draft = n.text))}>{pm.notebook.edit}</Button
                  >
                  <IconButton
                    icon="trash"
                    label={pm.notebook.delete}
                    onclick={() => game.dispatch({ type: 'deleteNote', id: n.id })}
                  />
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    {/snippet}
  </Tabs>
</Panel>

<style>
  :global(.notebook-panel) {
    block-size: 100%;
  }
  /* La largeur vient du panneau, jamais des onglets ou des filtres (pas de débord à 360 px). */
  :global(.notebook-tabs) {
    contain: inline-size;
  }
  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: var(--space-3);
    align-items: end;
    margin-block-start: var(--space-3);
  }
  .muted {
    color: var(--text-muted);
  }
  .rubric {
    margin-block-start: var(--space-4);
  }
  .rubric h3 {
    margin: 0 0 var(--space-2);
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .terms,
  .links,
  .passages,
  .notes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .links.inline {
    display: flex;
    flex-wrap: wrap;
  }
  /* Fiche bristol (§6.3) : ligne de tête vermillon, se soulève au survol. */
  .term {
    border-radius: var(--radius-xs);
    border-inline-start: 3px solid var(--card-margin);
    background: var(--card);
    box-shadow: var(--shadow-paper);
    color: var(--text);
    transition:
      transform var(--dur-base) var(--ease-paper),
      box-shadow var(--dur-base) var(--ease-out);
  }
  @media (hover: hover) {
    .term:hover {
      transform: translateY(var(--lift));
      box-shadow: var(--shadow-lifted);
    }
  }
  .term.exhausted .label {
    color: var(--text-muted);
  }
  .term-head {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    inline-size: 100%;
    min-block-size: var(--hit-row);
    padding: var(--space-2) var(--space-3);
    border: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    text-align: start;
  }
  .label {
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }
  .term-body {
    padding: 0 var(--space-3) var(--space-3);
  }
  .term-body h4 {
    margin: var(--space-3) 0 var(--space-1);
    font-size: var(--step-0);
    color: var(--text-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }
  .passages li,
  .notes li {
    padding: var(--space-3);
    border-radius: var(--radius-xs);
    background: var(--card);
    box-shadow: var(--shadow-paper);
    color: var(--text);
  }
  .notes li {
    border-block-start: 2px solid var(--card-margin);
  }
  .note-text {
    font-family: var(--font-hand);
    font-size: var(--step-1);
    line-height: var(--leading-read);
  }
  .passages blockquote {
    margin: 0 0 var(--space-2);
    max-inline-size: none;
  }
  .passages .reading {
    font-size: var(--step-0);
  }
  .passages [class^='hl-'] {
    color: var(--ink);
  }
  .note-form {
    display: grid;
    gap: var(--space-2);
    margin-block: var(--space-3);
  }
  .note-text {
    margin: 0 0 var(--space-2);
    white-space: pre-wrap;
  }
  @media (forced-colors: active) {
    .term,
    .passages li,
    .notes li {
      border: 1px solid CanvasText;
    }
  }
</style>
