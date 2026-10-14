<!--
  P09 — Aide : « Où chercher ? » (une piste ouverte, jamais une réponse de l'arbre), indices
  progressifs de la case sélectionnée et de son groupe (paliers, confirmation avant chaque
  indice, aucune pénalité), et « Comment jouer ». Désactivées : proposition de les activer.
-->
<script lang="ts">
  import { hintPreset, type HintId, type Settings } from '@arbre/contract';
  import { hintsFor, whereToLook, type HintStatus, type HintTarget } from '@arbre/engine';
  import { Button, Dialog, Icon, Panel } from '@arbre/ui';
  import { announcer } from '../lib/game/announcer.svelte';
  import { getApp, getGame } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import { restartTutorial } from '../tutorial/tutorial.svelte';
  import type { NavTarget } from '../lib/game/types';
  import { slotName } from './lib/view';
  import { pm } from './messages';

  const game = getGame();
  const app = getApp();

  function replayTutorial() {
    restartTutorial(app);
    announcer.say(messages.tutorial.restarted);
  }
  const hints = $derived(game.settings.hints);

  const where = $derived(hints.whereToLook ? whereToLook(game.state, game.content) : null);
  const whereText = $derived.by(() => {
    if (!where) return pm.help.whereNone;
    const c = game.content;
    if (where.kind === 'document')
      return pm.help.whereDocument(c.documents[where.id]?.title ?? where.id);
    if (where.kind === 'keyword')
      return pm.help.whereKeyword(c.keywords[where.id]?.label ?? where.id);
    return pm.help.wherePlace(c.places[where.id]?.name ?? where.id);
  });
  const whereTarget = $derived.by((): NavTarget | null => {
    if (!where) return null;
    if (where.kind === 'document') return { kind: 'document', id: where.id };
    if (where.kind === 'keyword') return { kind: 'keyword', id: where.id };
    return { kind: 'place', id: where.id };
  });

  const slot = $derived(
    game.ui.selectedSlot && Object.hasOwn(game.content.slots, game.ui.selectedSlot)
      ? game.ui.selectedSlot
      : null,
  );
  const targets = $derived.by(() => {
    if (!slot) return [];
    const list: { key: string; title: string; target: HintTarget }[] = [
      {
        key: `slot:${slot}`,
        title: `${pm.help.hints} · ${slotName(game.state, game.content, slot) ?? pm.tree.unknownPerson}`,
        target: { slot },
      },
    ];
    for (const g of game.content.groups.filter((x) => x.slots.includes(slot))) {
      list.push({
        key: `group:${g.id}`,
        title: `${pm.help.hintsGroup} · ${g.label}`,
        target: { group: g.id },
      });
    }
    return list
      .map((t) => ({ ...t, statuses: hintsFor(t.target, game.state, game.content) }))
      .filter((t) => t.statuses.length > 0);
  });

  let confirming = $state<HintStatus | null>(null);
  let confirmOpen = $state(false);
  let returnFocus: HTMLElement | null = null;

  function ask(h: HintStatus, e: MouseEvent) {
    returnFocus = e.currentTarget as HTMLElement;
    confirming = h;
    confirmOpen = true;
  }

  function reveal() {
    const id: HintId | undefined = confirming?.id;
    confirmOpen = false;
    confirming = null;
    if (id) game.dispatch({ type: 'useHint', id });
    queueMicrotask(() => {
      const el = id ? document.getElementById(`hint-${id}`) : null;
      (el ?? returnFocus)?.focus();
    });
  }

  function enable(patch: Partial<Settings['hints']>) {
    const base = hints.preset === 0 ? hintPreset(1) : hints;
    game.updateSettings({ hints: { ...base, ...patch, preset: 'custom' } });
  }
</script>

<Panel title={pm.help.title} class="help-panel">
  <section aria-labelledby="help-where">
    <h3 id="help-where"><Icon name="search" size="1.25rem" /> {pm.help.where}</h3>
    {#if !hints.whereToLook}
      <p class="muted">{pm.help.disabled}</p>
      <Button onclick={() => enable({ whereToLook: true })}>{pm.help.enable}</Button>
    {:else}
      <p class="muted intro">{pm.help.whereIntro}</p>
      <p class="answer" aria-live="polite">{whereText}</p>
      {#if whereTarget}
        {@const t = whereTarget}
        <Button variant="primary" iconName="forward" onclick={() => game.navigate(t)}
          >{pm.help.go}</Button
        >
      {/if}
    {/if}
  </section>

  <section aria-labelledby="help-hints">
    <h3 id="help-hints"><Icon name="info" size="1.25rem" /> {pm.help.hints}</h3>
    {#if !hints.progressiveHints}
      <p class="muted">{pm.help.disabled}</p>
      <Button onclick={() => enable({ progressiveHints: true })}>{pm.help.enable}</Button>
    {:else if !slot}
      <p class="muted">{pm.help.selectSlot}</p>
    {:else if targets.length === 0}
      <p class="muted">{pm.help.hintsNone}</p>
    {:else}
      {#each targets as t (t.key)}
        <h4>{t.title}</h4>
        <ol class="hints">
          {#each t.statuses as h (h.id)}
            <li class="hint" class:used={h.used} data-surface={h.used ? 'paper' : undefined}>
              <span class="level caps">{pm.help.level(h.level)}</span>
              {#if h.used}
                <p class="reading text" id="hint-{h.id}" tabindex="-1">{h.text}</p>
              {:else if h.available}
                <Button iconName="look" onclick={(e: MouseEvent) => ask(h, e)}
                  >{pm.help.reveal}</Button
                >
              {:else}
                <p class="muted"><Icon name="lock" size="1rem" /> {pm.help.locked}</p>
              {/if}
            </li>
          {/each}
        </ol>
      {/each}
    {/if}
  </section>

  <section aria-labelledby="help-howto">
    <h3 id="help-howto"><Icon name="help" size="1.25rem" /> {pm.help.howTo}</h3>
    <ol class="howto">
      {#each pm.help.howToItems as item, i (i)}<li>{item}</li>{/each}
    </ol>
    <Button iconName="quill" onclick={replayTutorial}>{pm.help.replayTutorial}</Button>
  </section>
</Panel>

<Dialog
  bind:open={confirmOpen}
  title={pm.help.confirmTitle}
  description={pm.help.confirmBody}
  size="s"
  onclose={() => (confirming = null)}
>
  {#snippet actions()}
    <Button onclick={() => (confirmOpen = false)}>{pm.common.cancel}</Button>
    <Button variant="primary" iconName="look" onclick={reveal}>{pm.help.reveal}</Button>
  {/snippet}
</Dialog>

<style>
  :global(.help-panel) {
    block-size: 100%;
  }
  section {
    display: grid;
    gap: var(--space-2);
    justify-items: start;
    padding-block: var(--space-3) var(--space-5);
    border-block-end: 1px dashed var(--line-strong);
  }
  section:last-child {
    border-block-end: 0;
  }
  h3 {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    margin: 0;
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  h3 :global(svg) {
    color: var(--brand);
  }
  h4 {
    margin: var(--space-2) 0 0;
    font-size: var(--step-0);
  }
  p {
    margin: 0;
  }
  .muted {
    color: var(--text-muted);
  }
  .muted :global(svg) {
    vertical-align: -0.125em;
  }
  .answer {
    color: var(--text);
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-style: italic;
    font-size: var(--step-1);
    line-height: var(--leading-display);
  }
  .hints,
  .howto {
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
    inline-size: 100%;
  }
  .hints {
    list-style: none;
  }
  .howto {
    padding-inline-start: var(--space-5);
  }
  .hint {
    display: grid;
    gap: var(--space-1);
    justify-items: start;
    padding: var(--space-2) var(--space-3);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-xs);
    background: var(--surface-1);
  }
  .hint.used {
    border-color: transparent;
    border-inline-start: 3px solid var(--card-margin);
    background: var(--card);
    box-shadow: var(--shadow-paper);
    color: var(--text);
    animation: m-fade-in var(--dur-fade) var(--ease-out) backwards;
  }
  .hint.used .text {
    color: var(--ink);
  }
  .hint.used .level {
    color: var(--ink-muted);
  }
  .level {
    color: var(--text-muted);
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    font-size: var(--step--1);
  }
  .text {
    color: var(--text);
  }
</style>
