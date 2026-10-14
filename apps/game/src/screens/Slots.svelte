<script lang="ts">
  import type { SaveSlotId } from '@arbre/contract';
  import { Badge, Button, Card, Dialog, Select, pushToast } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { formatDateTime, formatDuration } from '../lib/game/format';
  import type { GameSlotSummary } from '../platform/index';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /**
   * E03 : 3 emplacements (communs) + un secours par affaire (AFFAIRE-2 §2.3) ; Charger, Effacer
   * (confirmation), Exporter, Importer.
   */
  const app = getApp();
  const m = messages.slots;
  const MANUAL: SaveSlotId[] = ['slot-1', 'slot-2', 'slot-3'];

  /** Une carte : emplacement manuel, ou secours d'une affaire (`caseId`). */
  interface Row {
    key: string;
    slot: SaveSlotId;
    caseId: string | null;
    title: string;
    save: GameSlotSummary | undefined;
  }

  let errors = $state<Record<string, string>>({});
  let corrupt = $state<Record<string, boolean>>({});
  let busy = $state<string | null>(null);
  let removing = $state<Row | null>(null);
  let importTarget = $state<string>('slot-1');
  let importError = $state<string | null>(null);

  const backups = $derived(app.saves.filter((s) => s.slot === 'auto' && s.caseId !== null));
  const rows = $derived<Row[]>([
    ...MANUAL.map((slot) => ({
      key: slot,
      slot,
      caseId: null,
      title: m.slotName(slot),
      save: app.saves.find((s) => s.slot === slot),
    })),
    ...(backups.length > 0
      ? backups.map((s) => ({
          key: `auto:${s.caseId}`,
          slot: 'auto' as const,
          caseId: s.caseId,
          title: m.backupName(s.caseTitle),
          save: s,
        }))
      : [
          {
            key: 'auto',
            slot: 'auto' as const,
            caseId: null,
            title: m.slotName('auto'),
            save: undefined,
          },
        ]),
  ]);

  async function load(row: Pick<Row, 'key' | 'slot' | 'caseId'>) {
    busy = row.key;
    const res = await app.loadSlot(row.slot, row.caseId ?? undefined);
    busy = null;
    if (!res.ok) {
      errors = { ...errors, [row.key]: res.error };
      corrupt = { ...corrupt, [row.key]: res.corrupt };
    }
  }

  async function confirmRemove() {
    const row = removing;
    removing = null;
    if (!row) return;
    try {
      await app.removeSlot(row.slot, row.caseId ?? undefined);
      pushToast({ tone: 'info', title: m.removed });
    } catch (err) {
      pushToast({ tone: 'danger', title: err instanceof Error ? err.message : m.corrupt });
    }
  }

  async function exportSlot(row: Row) {
    try {
      await app.exportSlot(row.slot, row.caseId ?? undefined);
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

  const slotOptions = MANUAL.map((s) => ({
    value: s,
    label: m.slotName(s),
  }));
</script>

<ScreenFrame title={m.title} kicker={m.kicker} onback={() => app.goto('title')}>
  <div class="stack">
    <ul class="slots" aria-label={m.listLabel}>
      {#each rows as row, i (row.key)}
        {@const s = row.save}
        <li class:vacant={!s}>
          <Card
            variant="index"
            title={row.title}
            kicker={s ? s.caseTitle : undefined}
            deal={i}
            tilt={i % 2 ? 0.4 : -0.5}
          >
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
            {#if errors[row.key]}
              <p class="error" role="alert">{errors[row.key]}</p>
              {#if corrupt[row.key] && row.slot !== 'auto' && backups.length > 0}
                <!-- Affaire de l'emplacement illisible inconnue : le secours le plus récent. -->
                <Button size="m" onclick={() => load({ key: row.key, slot: 'auto', caseId: null })}
                  >{m.useBackup}</Button
                >
              {/if}
            {/if}
            {#snippet footer()}
              {#if s}
                <div class="actions">
                  <Button variant="primary" loading={busy === row.key} onclick={() => load(row)}
                    >{m.load}</Button
                  >
                  <Button iconName="external" onclick={() => exportSlot(row)}>{m.exportFile}</Button
                  >
                  <Button variant="danger" iconName="trash" onclick={() => (removing = row)}
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
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
    gap: var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .vacant {
    opacity: 0.88;
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
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    margin-block-end: var(--space-3);
  }
  .import-row {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--space-3);
  }
</style>
