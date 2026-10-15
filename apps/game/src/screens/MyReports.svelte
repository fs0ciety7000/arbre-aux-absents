<!--
  « Mes signalements » (DESIGN §13.9) : tiroir de fiches, une par signalement envoyé depuis cet
  appareil (`Profile.reports`, ≤ 20, les plus récents d'abord). Cote rouge, date, dernier statut
  connu ; activation = feuille de suivi (`TicketView`). Vide : vignette des archives.
-->
<script lang="ts">
  import type { ReportRef } from '@arbre/contract';
  import { Button, Card, Dialog, DymoLabel, Stamp, UI_STRINGS } from '@arbre/ui';
  import { messages } from '../i18n/index.svelte';
  import { getApp } from '../lib/game/context';
  import { formatDay } from '../lib/game/format';
  import { initialFocus } from '../lib/game/initial-focus';
  import { readStatuses } from '../lib/report/status-cache';
  import Spot from '../shell/Spot.svelte';
  import TicketView from './TicketView.svelte';

  const app = getApp();
  const m = messages.bugReport;

  let open = $state(true);
  let current = $state.raw<ReportRef | null>(null);
  /** Relu à la fermeture d'une fiche (statut lu entre-temps). */
  let statusesRev = $state(0);
  const statuses = $derived.by(() => {
    void statusesRev;
    return readStatuses();
  });

  /** Dernier tampon connu : « Corrigé v1.2.0 », « Classé »… */
  function stampOf(ticket: string): { text: string; tone: 'ink' | 'established' } | null {
    const s = statuses[ticket];
    if (!s) return null;
    const ui = UI_STRINGS[app.lang].ticket;
    if (s.status === 'fixed') {
      return { text: s.fixedIn ? ui.fixedIn(s.fixedIn) : ui.status.fixed, tone: 'established' };
    }
    return { text: ui.status[s.status], tone: 'ink' };
  }

  function sheetClosed() {
    current = null;
    statusesRev += 1;
  }
</script>

<Dialog
  bind:open
  title={m.mine}
  kicker={m.kicker}
  size="m"
  mobile="fullscreen"
  onclose={() => app.closeMyReports()}
>
  {#if app.reports.length === 0}
    <div class="empty">
      <Spot name="archives" size="8rem" />
      <p>{m.empty}</p>
      <span use:initialFocus={'button'}>
        <Button
          variant="primary"
          iconName="envelope"
          onclick={() => {
            open = false;
            app.openReport();
          }}>{m.entry}</Button
        >
      </span>
    </div>
  {:else}
    <ul class="drawer" aria-label={m.listLabel} use:initialFocus={'button'}>
      {#each app.reports as r, i (r.ticket)}
        {@const stamp = stampOf(r.ticket)}
        <li>
          <Card
            variant="index"
            title={r.summary}
            headingLevel={3}
            meta={m.sentOn(formatDay(r.createdAt))}
            deal={Math.min(i, 8)}
            onactivate={() => (current = r)}
          >
            <DymoLabel text={r.ticket} tone="red" tilt={-1} />
            {#snippet footer()}
              {#if stamp}
                <Stamp text={stamp.text} tone={stamp.tone} size="s" rotate={-4} />
              {/if}
            {/snippet}
          </Card>
        </li>
      {/each}
    </ul>
  {/if}
</Dialog>

{#if current}
  {#key current.ticket}
    <TicketView report={current} onclose={sheetClosed} />
  {/key}
{/if}

<style>
  .empty {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    text-align: center;
  }
  .empty p {
    margin: 0;
    color: var(--text-muted);
  }
  .drawer {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: var(--space-2) 0;
    list-style: none;
  }
</style>
