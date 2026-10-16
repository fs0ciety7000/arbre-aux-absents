<!--
  P08 — Journal : ce qui est établi, dans l'ordre où ça l'a été (cases confirmées par groupe,
  secrets découverts, branches et générations complètes, déclarations contestées), et chaque
  rapport remis avec sa décision et son dénouement à relire. Tout est retrouvé dans la partie
  sauvegardée (rien de propre à la session). Ne contient que des faits déjà acquis : rien qui
  aide à remplir l'arbre.
-->
<script lang="ts">
  import { endingSections } from '@arbre/engine';
  import { Button, Dialog, Icon, Panel, Stamp, type IconName } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import Spot from '../shell/Spot.svelte';
  import { illustration, portraitSvg } from './lib/assets.svelte';
  import { slotName } from './lib/view';
  import DocumentBody from './doc/DocumentBody.svelte';
  import type { BodyOptions } from './doc/context';
  import { FIELD_LABELS, pm } from './messages';
  import { formatDateTime } from '../lib/game/format';
  import { milestones } from '../lib/game/replay';
  import { messages } from '../messages.fr';

  interface Entry {
    key: string;
    at: number;
    icon: IconName;
    title: string;
    lines: string[];
    tone: 'start' | 'locked' | 'secret' | 'reveal' | 'claim' | 'ending';
    /** Rapport remis (index dans `SaveState.reports`) : dénouement à relire. */
    report?: number;
  }

  const game = getGame();

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
    // Branches et générations complètes, retrouvées dans les verrous (cartes de révélation).
    for (const ms of milestones(s, c)) {
      const names = ms.slots.map((id) => slotName(s, c, id) ?? pm.tree.unknownPerson).join(', ');
      out.push({
        key: ms.key,
        at: ms.at,
        icon: 'info',
        title:
          ms.kind === 'group'
            ? messages.reveal.groupDone(String(ms.label))
            : messages.reveal.generationDone(Number(ms.label)),
        lines: [messages.reveal.established(names)],
        tone: 'reveal',
      });
    }
    // Déclarations contestées (case revendiquée, AFFAIRE-2 §1.7) : constat, sans verdict.
    for (const [slot, claim] of Object.entries(s.contested ?? {})) {
      out.push({
        key: `c${slot}`,
        at: claim.at,
        icon: 'staple',
        title: pm.journal.claimContested(claim.fields.map((f) => FIELD_LABELS[f]).join(', ')),
        lines: [],
        tone: 'claim',
      });
    }
    // Rapports remis : dénouement et décision de chacun (AFFAIRE-2 §3.3).
    for (const [i, r] of (s.reports ?? []).entries()) {
      const ending = c.endings[r.ending];
      if (!ending) continue;
      const lines: string[] = [];
      for (const q of c.report ?? []) {
        if (q.kind !== 'choice') continue;
        const label = q.options.find((o) => o.id === r.answers[q.id])?.label;
        if (label) lines.push(pm.journal.decision(label));
      }
      lines.push(pm.journal.ending(ending.title));
      out.push({
        key: `e${i}`,
        at: r.at,
        icon: 'quill',
        title: pm.journal.report(ending.title),
        lines,
        tone: 'ending',
        report: i,
      });
    }
    return out.sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
  });

  /** Rapport dont le dénouement est relu (index dans `reports`), ou null. */
  let replayIndex = $state<number | null>(null);
  let replay = $state(false);
  const replayed = $derived(replayIndex === null ? undefined : game.state.reports?.[replayIndex]);
  // Les sections d'une fin dépendent des réponses : celles du rapport relu, pas les actuelles.
  const sections = $derived(
    replayed
      ? endingSections(
          replayed.ending,
          { ...game.state, report: replayed.answers, ending: replayed.ending },
          game.content,
        )
      : [],
  );
  function openReplay(i: number) {
    replayIndex = i;
    replay = true;
  }
  const opts: BodyOptions = {
    mode: 'original',
    decorative: false,
    kwState: () => 'known',
    // Marque dans un texte de fin (affaire 3) : dessin nommé par sa description, sans action.
    markAlt: (p) => game.content.portraits[p]?.alt ?? '',
    markSvg: (p) => portraitSvg(game.content, p),
  };
  const figure = (asset: string) => illustration(game.content, asset);
</script>

<Panel title={pm.journal.title} class="journal-panel">
  {#if entries.length === 0}
    <div class="empty">
      <Spot name="register" size="9rem" />
      <p>{pm.journal.empty}</p>
    </div>
  {:else}
    <ol class="timeline">
      <li class="entry start mv-deal" style:--i="0">
        <span class="mark" aria-hidden="true"><Icon name="clock" size="1rem" /></span>
        <div>
          <p class="title">{pm.journal.started}</p>
          <p class="at num">
            <time datetime={new Date(game.state.createdAt).toISOString()}
              >{formatDateTime(game.state.createdAt)}</time
            >
          </p>
        </div>
      </li>
      {#each entries as e, i (e.key)}
        <li class="entry {e.tone} mv-deal" style:--i={Math.min(i + 1, 12)}>
          <span class="mark" aria-hidden="true"><Icon name={e.icon} size="1rem" /></span>
          <div>
            {#if e.tone === 'locked'}
              <span class="stamp"><Stamp size="s" text={pm.tree.established} /></span>
            {/if}
            <p class="title">{e.title}</p>
            {#each e.lines as line, j (j)}<p class="line">{line}</p>{/each}
            <p class="at num">
              <time datetime={new Date(e.at).toISOString()}>{formatDateTime(e.at)}</time>
            </p>
            {#if e.report !== undefined}
              <Button iconName="reader" onclick={() => openReplay(e.report!)}
                >{pm.journal.replay}</Button
              >
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</Panel>

{#if replayed}
  <Dialog
    bind:open={replay}
    title={game.content.endings[replayed.ending]?.title ?? pm.journal.title}
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
  .timeline {
    list-style: none;
    margin: 0;
    padding: 0 0 0 var(--space-2);
    display: grid;
    gap: var(--space-4);
    border-inline-start: 2px dashed var(--line-strong);
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
    box-shadow: var(--shadow-1);
  }
  .locked .mark {
    color: var(--established);
    border-color: var(--established);
  }
  /* Déclaration contestée : agrafe, cercle en tirets (comme le bord de la case revendiquée). */
  .claim .mark {
    border-style: dashed;
  }
  .secret .mark,
  .ending .mark {
    color: var(--accent);
    border-color: var(--accent);
  }
  .title {
    margin: 0;
    color: var(--text);
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-1);
    line-height: var(--leading-display);
  }
  .line {
    margin: var(--space-1) 0 0;
    color: var(--text-muted);
  }
  .at {
    margin: var(--space-1) 0 var(--space-2);
    color: var(--text-faint);
    font-family: var(--font-type);
    font-size: var(--step--1);
  }
  .stamp {
    float: inline-end;
  }
  .ending h3 {
    margin: var(--space-4) 0 var(--space-2);
  }
</style>
