<script lang="ts">
  import type { SaveSlotId, SaveSlotSummary } from '@arbre/contract';
  import { Badge, Button, Card, Dialog, Select, pushToast } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { formatDateTime, formatDuration } from '../lib/game/format';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /** E03 : 3 emplacements + secours ; Charger, Effacer (confirmation), Exporter, Importer. */
  const app = getApp();
  const m = messages.slots;
  const SLOTS: SaveSlotId[] = ['slot-1', 'slot-2', 'slot-3', 'auto'];

  let errors = $state<Partial<Record<SaveSlotId, string>>>({});
  let corrupt = $state<Partial<Record<SaveSlotId, boolean>>>({});
  let busy = $state<SaveSlotId | null>(null);
  let removing = $state<SaveSlotId | null>(null);
  let importTarget = $state<string>('slot-1');
  let importError = $state<string | null>(null);

  const bySlot = $derived(
    Object.fromEntries(app.saves.map((s) => [s.slot, s])) as Partial<
      Record<SaveSlotId, SaveSlotSummary>
    >,
  );

  async function load(slot: SaveSlotId) {
    busy = slot;
    const res = await app.loadSlot(slot);
    busy = null;
    if (!res.ok) {
      errors = { ...errors, [slot]: res.error };
      corrupt = { ...corrupt, [slot]: res.corrupt };
    }
  }

  async function confirmRemove() {
    const slot = removing;
    removing = null;
    if (!slot) return;
    try {
      await app.removeSlot(slot);
      pushToast({ tone: 'info', title: m.removed });
    } catch (err) {
      pushToast({ tone: 'danger', title: err instanceof Error ? err.message : m.corrupt });
    }
  }

  async function exportSlot(slot: SaveSlotId) {
    try {
      await app.exportSlot(slot);
      pushToast({ tone: 'success', title: m.exported });
    } catch (err) {
      pushToast({ tone: 'danger', title: err instanceof Error ? err.message : m.corrupt });
    }
  }

  async function importFile() {
    importError = null;
    const res = await app.importInto(importTarget as SaveSlotId);
    if (res.ok) pushToast({ tone: 'success', title: m.imported });
    else if (res.error) importError = res.error;
  }

  const slotOptions = SLOTS.filter((s) => s !== 'auto').map((s) => ({
    value: s,
    label: m.slotName(s),
  }));
</script>

<ScreenFrame title={m.title} kicker={m.kicker} onback={() => app.goto('title')}>
  <div class="stack">
    <ul class="slots" aria-label={m.listLabel}>
      {#each SLOTS as slot (slot)}
        {@const s = bySlot[slot]}
        <li>
          <Card title={m.slotName(slot)} kicker={s ? s.caseTitle : undefined}>
            {#if s}
              <p class="meta">
                <Badge tone={s.mode === 'timed' ? 'warning' : 'neutral'}
                  >{s.mode === 'timed' ? m.modeTimed : m.modeStandard}</Badge
                >
                <span class="num">{m.progress(Math.round(s.progress * 100))}</span>
              </p>
              <p class="meta">{m.playTime(formatDuration(s.elapsedMs))}</p>
              <p class="meta">{m.updated(formatDateTime(s.updatedAt))}</p>
            {:else}
              <p class="meta">{m.empty}</p>
            {/if}
            {#if errors[slot]}
              <p class="error" role="alert">{errors[slot]}</p>
              {#if corrupt[slot] && slot !== 'auto' && bySlot.auto}
                <Button size="m" onclick={() => load('auto')}>{m.useBackup}</Button>
              {/if}
            {/if}
            {#snippet footer()}
              {#if s}
                <div class="actions">
                  <Button variant="primary" loading={busy === slot} onclick={() => load(slot)}
                    >{m.load}</Button
                  >
                  <Button iconName="external" onclick={() => exportSlot(slot)}
                    >{m.exportFile}</Button
                  >
                  <Button variant="danger" iconName="trash" onclick={() => (removing = slot)}
                    >{m.remove}</Button
                  >
                </div>
              {/if}
            {/snippet}
          </Card>
        </li>
      {/each}
    </ul>

    <section class="import" aria-labelledby="import-title">
      <h2 id="import-title">{m.importFile}</h2>
      <div class="import-row">
        <Select label={m.importTarget} options={slotOptions} bind:value={importTarget} />
        <Button iconName="plus" onclick={importFile}>{m.importFile}</Button>
      </div>
      {#if importError}<p class="error" role="alert">{importError}</p>{/if}
    </section>
  </div>
</ScreenFrame>

<Dialog
  open={removing !== null}
  title={m.removeTitle}
  description={m.removeText}
  size="s"
  onclose={() => (removing = null)}
>
  {#snippet actions()}
    <Button onclick={() => (removing = null)}>{messages.cancel}</Button>
    <Button variant="danger" onclick={confirmRemove}>{m.remove}</Button>
  {/snippet}
</Dialog>

<style>
  .stack {
    display: grid;
    gap: var(--space-8);
  }
  .slots {
    display: grid;
    gap: var(--space-4);
    padding: 0;
    list-style: none;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .error {
    margin-block: var(--space-2);
    color: var(--danger);
  }
  h2 {
    font-family: var(--font-display);
    font-size: var(--step-1);
    margin-block-end: var(--space-3);
  }
  .import-row {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--space-3);
  }
</style>
