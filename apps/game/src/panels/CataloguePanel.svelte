<!--
  P04 — Catalogue : terminal du « Lecteur » des Archives. Requête (machine à écrire), fiches
  résultat (titre, type, date, extrait avec le terme), historique rejouable, états vides
  diégétiques et discrets (ECRANS §5) ; aucune suggestion d'orthographe.
-->
<script lang="ts">
  import type { SearchOutcome } from '@arbre/contract';
  import {
    documentText,
    exhaustedKeywords,
    knownKeywords,
    MIN_QUERY_LENGTH,
    normalize,
    search,
  } from '@arbre/engine';
  import { Badge, Button, Card, Icon, Panel, TextField } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import { listenCommands } from './lib/commands';
  import { formatPartialDate } from './lib/view';
  import { KIND_LABELS, pm } from './messages';

  const game = getGame();
  let query = $state('');
  let tooShort = $state(false);
  let field: HTMLElement | undefined = $state();

  /** Dernière consultation : celle du store, ou la dernière de l'historique rejouée. */
  const outcome = $derived.by((): SearchOutcome | null => {
    if (game.ui.lastSearch) return game.ui.lastSearch;
    const last = game.state.searchLog.at(-1);
    return last ? search(last.query, game.state, game.content) : null;
  });

  const examples = $derived(
    knownKeywords(game.state, game.content)
      .filter((k) => !game.state.searched.includes(k))
      .slice(0, 3)
      .map((k) => game.content.keywords[k]?.label ?? k),
  );
  const history = $derived([...game.state.searchLog].reverse().slice(0, 50));
  const exhausted = $derived(
    game.settings.hints.exhaustedTerms
      ? new Set(exhaustedKeywords(game.state, game.content))
      : new Set<string>(),
  );

  function run(q: string) {
    query = q;
    const trimmed = q.trim();
    if (normalize(trimmed).replace(/ /g, '').length < MIN_QUERY_LENGTH) {
      tooShort = true;
      return;
    }
    tooShort = false;
    game.dispatch({ type: 'search', query: trimmed });
  }

  function onsubmit(e: SubmitEvent) {
    e.preventDefault();
    run(query);
  }

  /** Extrait de 140 caractères autour du terme (texte brut, jamais de HTML). */
  function excerpt(docId: string, term: string): { before: string; hit: string; after: string } {
    const d = game.content.documents[docId];
    if (!d) return { before: '', hit: '', after: '' };
    const text = documentText(d).replace(/\s+/g, ' ').trim();
    const norm = normalize(text);
    const n = normalize(term);
    // normalize() garde la longueur sur l'alphabet latin courant ; sinon, début du texte.
    const at = n && norm.length === text.length ? norm.indexOf(n) : -1;
    if (at < 0)
      return { before: text.slice(0, 140) + (text.length > 140 ? '…' : ''), hit: '', after: '' };
    const start = Math.max(0, at - 50);
    const end = Math.min(text.length, at + n.length + 80);
    return {
      before: (start > 0 ? '…' : '') + text.slice(start, at),
      hit: text.slice(at, at + n.length),
      after: text.slice(at + n.length, end) + (end < text.length ? '…' : ''),
    };
  }

  const ordered = $derived.by(() => {
    if (!outcome) return [];
    const unread = (id: string) => (game.state.read[id] === undefined ? 0 : 1);
    return [...outcome.documents]
      .sort(
        (a, b) =>
          unread(a) - unread(b) ||
          (game.content.documents[a]?.date ?? '9999').localeCompare(
            game.content.documents[b]?.date ?? '9999',
          ),
      )
      .slice(0, 12);
  });

  const allSeen = $derived(
    !!outcome &&
      outcome.keyword !== null &&
      outcome.newDocuments.length === 0 &&
      game.settings.hints.exhaustedTerms &&
      exhausted.has(outcome.keyword),
  );

  /** `/` ou Ctrl+F (commande `search`) : focus sur la requête. */
  export function focusQuery() {
    field?.querySelector('input')?.focus();
  }
  $effect(() =>
    listenCommands((cmd) => {
      if (cmd !== 'search' || !field) return false;
      focusQuery();
      return true;
    }),
  );
</script>

<Panel title={pm.catalogue.title} kicker={pm.catalogue.kicker} class="catalogue-panel">
  <div class="frame">
    <form class="bar" {onsubmit} role="search" bind:this={field}>
      <TextField
        label={pm.catalogue.query}
        variant="typewriter"
        bind:value={query}
        maxlength={40}
        hint={pm.catalogue.hint}
        error={tooShort ? pm.catalogue.tooShort : undefined}
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="search"
      />
      <Button type="submit" variant="primary" iconName="search">{pm.catalogue.submit}</Button>
    </form>

    <div class="results" aria-live="polite">
      {#if !outcome}
        {#if examples.length > 0}
          <p class="muted">{pm.catalogue.examples}</p>
          <ul class="examples">
            {#each examples as ex (ex)}
              <li>
                <Button variant="ghost" iconName="search" onclick={() => run(ex)}>{ex}</Button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted">{pm.catalogue.before}</p>
        {/if}
      {:else}
        <h3 class="for type">{pm.catalogue.resultsFor(outcome.query)}</h3>
        {#if outcome.documents.length === 0}
          <p class="none type">{pm.catalogue.none}</p>
        {:else}
          <p class="muted num">{pm.catalogue.results(outcome.documents.length)}</p>
          {#if allSeen}<p class="seen"><Icon name="check" /> {pm.catalogue.allSeen}</p>{/if}
          <ul class="fiches">
            {#each ordered as id (id)}
              {@const d = game.content.documents[id]!}
              {@const ex = excerpt(id, outcome.query)}
              <li>
                <Card
                  variant="fiche"
                  title={d.title}
                  kicker={KIND_LABELS[d.kind]}
                  meta={formatPartialDate(d.date) || undefined}
                  unread={game.settings.hints.unreadBadges && game.state.read[id] === undefined}
                  verb="take"
                  onactivate={() => game.navigate({ kind: 'document', id })}
                >
                  <p class="excerpt">
                    {ex.before}{#if ex.hit}<mark class="hl-1">{ex.hit}</mark>{/if}{ex.after}
                  </p>
                  {#if outcome.newDocuments.includes(id)}
                    <Badge tone="accent" dot>{pm.catalogue.newBadge}</Badge>
                  {/if}
                </Card>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </div>

    <section class="history" aria-labelledby="catalogue-history">
      <h3 id="catalogue-history">{pm.catalogue.history}</h3>
      {#if history.length === 0}
        <p class="muted">{pm.catalogue.historyEmpty}</p>
      {:else}
        <ol>
          {#each history as h, i (i)}
            <li>
              <button
                type="button"
                class="replay type"
                aria-label={pm.catalogue.replay(h.query)}
                onclick={() => run(h.query)}
              >
                <Icon name="search" size="1rem" />
                <span>{h.query}</span>
                {#if h.keyword === null}<span class="muted">· {pm.catalogue.noResult}</span>{/if}
              </button>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  </div>
</Panel>

<style>
  :global(.catalogue-panel) {
    block-size: 100%;
  }
  .bar {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-3);
    align-items: start;
  }
  .bar :global(button[type='submit']) {
    margin-block-start: calc(var(--step-0) * 1.4 + var(--space-1));
  }
  .frame {
    container-type: inline-size;
  }
  @container (max-width: 30rem) {
    .bar {
      grid-template-columns: 1fr;
    }
    .bar :global(button[type='submit']) {
      margin-block-start: 0;
    }
  }
  .results {
    margin-block-start: var(--space-4);
  }
  .muted {
    color: var(--text-muted);
  }
  .type {
    font-family: var(--font-type);
  }
  .for {
    margin: 0 0 var(--space-2);
    font-size: var(--step-0);
    color: var(--text);
  }
  .none {
    color: var(--text-muted);
  }
  .seen {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    color: var(--success);
  }
  .examples,
  .fiches,
  .history ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .examples {
    display: flex;
    flex-wrap: wrap;
  }
  .fiches {
    gap: var(--space-3);
  }
  .excerpt {
    margin: 0;
    color: var(--text-muted);
  }
  .history {
    margin-block-start: var(--space-6);
  }
  .history h3 {
    font-size: var(--step-1);
    margin: 0 0 var(--space-2);
  }
  .replay {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    inline-size: 100%;
    min-block-size: var(--hit);
    padding: var(--space-1) var(--space-2);
    border: 0;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--text);
    font-size: var(--step-0);
    text-align: start;
  }
  .replay:hover {
    background: var(--surface-2);
  }
</style>
