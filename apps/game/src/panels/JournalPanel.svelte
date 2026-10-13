<!--
  P08 — Journal : ce qui est établi, dans l'ordre où ça l'a été (cases confirmées par groupe,
  secrets découverts, cartes de révélation de la session), et le dénouement à relire.
  Ne contient que des faits déjà acquis : rien qui aide à remplir l'arbre.
-->
<script lang="ts">
  import { endingSections } from '@arbre/engine';
  import { Button, Dialog, Icon, Panel, Stamp, type IconName } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import { illustration } from './lib/assets.svelte';
  import { slotName } from './lib/view';
  import DocumentBody from './doc/DocumentBody.svelte';
  import type { BodyOptions } from './doc/context';
  import { pm } from './messages';

  interface Entry {
    key: string;
    at: number;
    icon: IconName;
    title: string;
    lines: string[];
    tone: 'start' | 'locked' | 'secret' | 'reveal' | 'ending';
  }

  const game = getGame();
  const time = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  /** Cartes de révélation de la session (`GameStore.reveals`). */
  const reveals = $derived(game.reveals);

  const entries = $derived.by((): Entry[] => {
    const s = game.state;
    const c = game.content;
    const out: Entry[] = [];
    // Cases confirmées ensemble (même instant) = une entrée.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- table locale, non réactive
    const byAt = new Map<number, string[]>();
    for (const [slot, at] of Object.entries(s.locked)) {
      if (!Object.hasOwn(c.slots, slot)) continue;
      byAt.set(at, [...(byAt.get(at) ?? []), slot]);
    }
    for (const [at, slots] of byAt) {
      const names = slots.map((id) => slotName(s, c, id) ?? pm.tree.unknownPerson).join(', ');
      out.push({
        key: `l${at}`,
        at,
        icon: 'stamp',
        title: pm.journal.locked(names),
        lines: [],
        tone: 'locked',
      });
    }
    for (const secret of c.progression.secrets) {
      const at = s.secrets[secret.id];
      if (at === undefined) continue;
      out.push({
        key: `s${secret.id}`,
        at,
        icon: 'star',
        title: pm.journal.secret(secret.title),
        lines: [],
        tone: 'secret',
      });
    }
    for (const [i, r] of reveals.entries()) {
      out.push({
        key: `r${i}`,
        at: r.at,
        icon: 'info',
        title: r.title,
        lines: r.lines,
        tone: 'reveal',
      });
    }
    const ending = s.ending ? c.endings[s.ending] : undefined;
    if (ending) {
      out.push({
        key: 'ending',
        at: s.updatedAt,
        icon: 'quill',
        title: pm.journal.ending(ending.title),
        lines: [],
        tone: 'ending',
      });
    }
    return out.sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
  });

  let replay = $state(false);
  const sections = $derived(
    game.state.ending ? endingSections(game.state.ending, game.state, game.content) : [],
  );
  const opts: BodyOptions = { mode: 'original', decorative: false, kwState: () => 'known' };
  const figure = (asset: string) => illustration(game.content.id, asset);
</script>

<Panel title={pm.journal.title} class="journal-panel">
  {#if entries.length === 0}
    <p class="empty">{pm.journal.empty}</p>
  {:else}
    <ol class="timeline">
      <li class="entry start">
        <span class="mark" aria-hidden="true"><Icon name="clock" size="1rem" /></span>
        <div>
          <p class="title">{pm.journal.started}</p>
          <p class="at num">
            <time datetime={new Date(game.state.createdAt).toISOString()}
              >{time.format(game.state.createdAt)}</time
            >
          </p>
        </div>
      </li>
      {#each entries as e (e.key)}
        <li class="entry {e.tone}">
          <span class="mark" aria-hidden="true"><Icon name={e.icon} size="1rem" /></span>
          <div>
            {#if e.tone === 'locked'}
              <span class="stamp"><Stamp size="s" text={pm.tree.established} /></span>
            {/if}
            <p class="title">{e.title}</p>
            {#each e.lines as line, j (j)}<p class="line">{line}</p>{/each}
            <p class="at num">
              <time datetime={new Date(e.at).toISOString()}>{time.format(e.at)}</time>
            </p>
            {#if e.tone === 'ending' && sections.length > 0}
              <Button iconName="reader" onclick={() => (replay = true)}>{pm.journal.replay}</Button>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</Panel>

{#if game.state.ending}
  <Dialog
    bind:open={replay}
    title={game.content.endings[game.state.ending]?.title ?? pm.journal.title}
    kicker={pm.journal.replay}
    size="l"
    surface="paper"
    mobile="fullscreen"
  >
    <div class="reading ending">
      {#each sections as sec, i (i)}
        {#if sec.title}<h3>{sec.title}</h3>{/if}
        <DocumentBody blocks={sec.body} {opts} {figure} />
      {/each}
    </div>
  </Dialog>
{/if}

<style>
  :global(.journal-panel) {
    block-size: 100%;
  }
  .empty {
    margin: 0;
    padding-block: var(--space-6);
    color: var(--text-muted);
  }
  .timeline {
    list-style: none;
    margin: 0;
    padding: 0 0 0 var(--space-2);
    display: grid;
    gap: var(--space-4);
    border-inline-start: var(--border) solid var(--line-strong);
  }
  .entry {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-3);
    align-items: start;
    margin-inline-start: calc(var(--space-2) * -1 - 0.75rem);
  }
  .mark {
    display: grid;
    place-items: center;
    inline-size: 1.5rem;
    block-size: 1.5rem;
    border-radius: 50%;
    border: var(--border) solid var(--line-strong);
    background: var(--surface-2);
    color: var(--text-muted);
  }
  .locked .mark {
    color: var(--established);
    border-color: var(--established);
  }
  .secret .mark,
  .ending .mark {
    color: var(--accent);
    border-color: var(--accent);
  }
  .title {
    margin: 0;
    color: var(--text);
    font-weight: 600;
  }
  .line {
    margin: var(--space-1) 0 0;
    color: var(--text-muted);
  }
  .at {
    margin: var(--space-1) 0 var(--space-2);
    color: var(--text-faint);
    font-size: var(--step--1);
  }
  .stamp {
    float: inline-end;
  }
  .ending h3 {
    margin: var(--space-4) 0 var(--space-2);
  }
</style>
