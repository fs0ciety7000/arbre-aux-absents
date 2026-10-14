<script lang="ts">
  import type { GameMode, SaveSlotId } from '@arbre/contract';
  import { Badge, Button, CaseFolder, CaseFolderGroup, Dialog, Select } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';
  import Spot from '../shell/Spot.svelte';
  import {
    defaultTutorialMode,
    prepareTutorial,
    TUTORIAL_MODES,
    type TutorialMode,
  } from '../tutorial/tutorial.svelte';
  import { caseStatus, defaultCaseId } from '../lib/game/case-folders';

  /**
   * E04 : affaire (une chemise par affaire, AFFAIRE-2 §2.1), mode, préréglage d'aide, notes de
   * service (tutoriel à trois crans, §2.4), emplacement.
   */
  const app = getApp();
  const m = messages.newGame;
  const SLOTS: SaveSlotId[] = ['slot-1', 'slot-2', 'slot-3'];

  const firstFree = SLOTS.find((s) => !app.saves.some((x) => x.slot === s)) ?? 'slot-1';
  const initialPreset = app.settings.hints.preset;

  // Affaires déjà triées (`order`, content-tools) ; par défaut la dernière jouée, sinon la première.
  let caseId = $state(defaultCaseId(app.cases, app.saves));
  let mode = $state<string>('standard');
  let preset = $state(String(initialPreset === 'custom' ? 1 : initialPreset));
  let tutorialMode = $state<string>(defaultTutorialMode(app.profile));
  let slot = $state<string>(firstFree);
  let confirmOpen = $state(false);
  let starting = $state(false);

  const entry = $derived(app.findCase(caseId));
  const timedOk = $derived(entry ? app.timedUnlocked(entry.content.id) : false);
  const occupied = $derived(app.saves.find((s) => s.slot === slot));

  const modeOptions = $derived([
    { value: 'standard', label: m.modeStandard },
    { value: 'timed', label: timedOk ? m.modeTimed : m.modeTimedLocked, disabled: !timedOk },
  ]);
  const tutorialOptions = TUTORIAL_MODES.map((v) => ({ value: v, label: m.tutorialModes[v] }));
  const presetOptions = [0, 1, 2, 3].map((p) => ({
    value: String(p),
    label: messages.hintPresets[String(p)] ?? String(p),
  }));
  const slotOptions = $derived(
    SLOTS.map((s) => {
      const used = app.saves.find((x) => x.slot === s);
      const name = messages.slots.slotName(s);
      return { value: s, label: used ? m.slotUsed(name, used.caseTitle) : m.slotFree(name) };
    }),
  );

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!entry) return;
    if (occupied) confirmOpen = true;
    else void start();
  }

  async function start() {
    if (!entry) return;
    confirmOpen = false;
    starting = true;
    // Le cran choisi s'écrit dans le profil ; les bulles suivent au Bureau.
    const tutorial = tutorialMode as TutorialMode;
    prepareTutorial(app, tutorial, entry.content);
    await app.startNewGame({
      caseId,
      mode: timedOk ? (mode as GameMode) : 'standard',
      slot: slot as SaveSlotId,
      hintPreset: Number(preset) as 0 | 1 | 2 | 3,
      skipTutorial: tutorial === 'none',
    });
    starting = false;
  }
</script>

<ScreenFrame title={m.title} kicker={m.kicker} onback={() => app.goto('title')} surface="paper">
  {#if app.cases.length === 0}
    <div class="empty" role="status">
      <Spot name="fern" size="8rem" />
      <p class="lead">{m.noCases}</p>
      <p class="muted">{m.noCasesHint}</p>
      <Button onclick={() => app.goto('title')}>{messages.back}</Button>
    </div>
  {:else}
    <form class="form" onsubmit={submit}>
      <CaseFolderGroup legend={m.caseLabel}>
        {#each app.cases as c, i (c.content.id)}
          <CaseFolder
            name="case"
            id="case-{c.content.id}"
            value={c.content.id}
            checked={caseId === c.content.id}
            onselect={(v) => (caseId = v)}
            title={c.fixture ? m.devFixture : c.content.meta.title}
            cote={c.content.edition === 'demo' ? m.edition('demo') : undefined}
            status={caseStatus(c.content, app.saves, app.profile)}
            deal={i}
          />
        {/each}
      </CaseFolderGroup>
      {#if entry?.fixture}
        <p class="note">
          <Badge tone="warning" variant="outline">{messages.menu.devBadge}</Badge>
          {m.devFixtureHint}
        </p>
      {:else if entry?.content.meta.subtitle}
        <p class="note">{entry.content.meta.subtitle}</p>
      {/if}
      <Select
        label={m.modeLabel}
        options={modeOptions}
        bind:value={mode}
        hint={mode === 'timed' ? m.modeTimedHint : m.modeStandardHint}
      />
      {#if mode !== 'timed'}
        <Select
          label={m.hintsLabel}
          options={presetOptions}
          bind:value={preset}
          hint={m.hintsHint}
        />
      {/if}
      <Select
        label={m.tutorialLabel}
        options={tutorialOptions}
        bind:value={tutorialMode}
        hint={m.tutorialHints[tutorialMode as TutorialMode]}
      />
      <Select label={m.slotLabel} options={slotOptions} bind:value={slot} />
      <div class="submit">
        <Button type="submit" variant="primary" size="l" iconName="forward" loading={starting}
          >{m.start}</Button
        >
      </div>
    </form>
  {/if}
</ScreenFrame>

<Dialog bind:open={confirmOpen} title={m.overwriteTitle} description={m.overwriteText} size="s">
  {#snippet actions()}
    <Button onclick={() => (confirmOpen = false)}>{messages.cancel}</Button>
    <Button variant="danger" onclick={start}>{m.start}</Button>
  {/snippet}
</Dialog>

<style>
  .form,
  .empty {
    display: grid;
    gap: var(--space-5);
  }
  .lead {
    font-size: var(--step-1);
  }
  .muted,
  .note {
    color: var(--text-muted);
  }
  .note {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-block-start: calc(-1 * var(--space-3));
  }
  .submit {
    display: flex;
    justify-content: flex-end;
  }
</style>
