<script lang="ts">
  import type { HintSettings, Settings } from '@arbre/contract';
  import { hintPreset, LONG_PRESS_MS, TEXT_SCALES } from '@arbre/contract';
  import { Button, KeyHint, Select, Slider, Tabs, Toggle, pushToast } from '@arbre/ui';
  import { announcer } from '../lib/game/announcer.svelte';
  import { getApp } from '../lib/game/context';
  import { input } from '../input/device.svelte';
  import { combosOf, comboLabel, COMMANDS, keymap, type CommandId } from '../input/keymap.svelte';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /** E05 : Jeu, Aides, Affichage, Accessibilité, Audio, Contrôles, Langue, Données. */
  const app = getApp();
  const m = messages.options;
  const s = $derived(app.settings);
  let tab = $state('game');

  const tabs = Object.entries(m.tabs).map(([id, label]) => ({ id, label }));
  const set = (patch: Partial<Settings>) => app.updateSettings(patch);
  const setHint = (key: keyof Omit<HintSettings, 'preset'>, v: boolean) =>
    set({ hints: { ...s.hints, [key]: v, preset: 'custom' } });

  const HINT_KEYS = [
    'unreadBadges',
    'exhaustedTerms',
    'placeCounters',
    'whereToLook',
    'groupCounter',
    'progressiveHints',
  ] as const;

  const presetOptions = [
    ...[0, 1, 2, 3].map((p) => ({ value: String(p), label: messages.hintPresets[String(p)]! })),
    { value: 'custom', label: messages.hintPresets.custom!, disabled: true },
  ];

  // ── Remappage ──
  let capturing = $state<CommandId | null>(null);
  $effect(() => {
    if (!capturing) return;
    const id = capturing;
    const onKey = (e: KeyboardEvent) => {
      const combos = combosOf(e);
      if (combos.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      capturing = null;
      if (e.key === 'Escape') return;
      const other = keymap.rebind(id, combos[0]!);
      const text = other
        ? m.keyConflict(messages.commands[other] ?? other)
        : `${messages.commands[id]} : ${comboLabel(combos[0]!)}`;
      announcer.say(text);
      if (other) pushToast({ tone: 'info', title: text });
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  });

  function resetKeys() {
    keymap.reset();
    pushToast({ tone: 'success', title: m.keysReset });
  }

  function resetSettings() {
    app.resetSettings();
    pushToast({ tone: 'success', title: m.resetDone });
  }
</script>

<ScreenFrame title={m.title} width="wide" onback={() => app.closeSecondary()}>
  <Tabs items={tabs} bind:value={tab} label={m.tabsLabel} idPrefix="options">
    {#snippet children(id)}
      <div class="section">
        {#if id === 'game'}
          <Select
            label={m.validation}
            options={[
              { value: 'auto', label: m.validationAuto },
              { value: 'manual', label: m.validationManual },
            ]}
            value={s.validation}
            onchange={(e) => set({ validation: e.currentTarget.value as Settings['validation'] })}
          />
          <Toggle
            label={m.showTimer}
            checked={s.showTimer}
            onchange={(v) => set({ showTimer: v })}
          />
          <Toggle
            label={m.confirmClear}
            checked={s.confirmClear}
            onchange={(v) => set({ confirmClear: v })}
          />
          <Select
            label={m.longPress}
            options={LONG_PRESS_MS.map((v) => ({ value: String(v), label: m.ms(v) }))}
            value={String(s.longPressMs)}
            onchange={(e) =>
              set({ longPressMs: Number(e.currentTarget.value) as Settings['longPressMs'] })}
          />
        {:else if id === 'hints'}
          <Select
            label={m.hintPreset}
            options={presetOptions}
            value={String(s.hints.preset)}
            onchange={(e) =>
              set({ hints: hintPreset(Number(e.currentTarget.value) as 0 | 1 | 2 | 3) })}
          />
          {#each HINT_KEYS as key (key)}
            <Toggle label={m[key]} checked={s.hints[key]} onchange={(v) => setHint(key, v)} />
          {/each}
        {:else if id === 'display'}
          <Select
            label={m.textScale}
            options={TEXT_SCALES.map((v) => ({ value: String(v), label: m.textScaleValue(v) }))}
            value={String(s.textScale)}
            onchange={(e) =>
              set({ textScale: Number(e.currentTarget.value) as Settings['textScale'] })}
          />
          <Select
            label={m.motion}
            options={[
              { value: 'system', label: m.motionSystem },
              { value: 'reduced', label: m.motionReduced },
              { value: 'full', label: m.motionFull },
            ]}
            value={s.motion}
            onchange={(e) => set({ motion: e.currentTarget.value as Settings['motion'] })}
          />
          <Toggle
            label={m.reducePaperTexture}
            checked={s.reducePaperTexture}
            onchange={(v) => set({ reducePaperTexture: v })}
          />
        {:else if id === 'accessibility'}
          <Select
            label={m.readingFont}
            options={[
              { value: 'default', label: m.readingFontDefault },
              { value: 'hyperlegible', label: m.readingFontLegible },
              { value: 'dyslexic', label: m.readingFontDyslexic },
            ]}
            value={s.readingFont}
            onchange={(e) => set({ readingFont: e.currentTarget.value as Settings['readingFont'] })}
          />
          <Select
            label={m.lineSpacing}
            options={[
              { value: 'default', label: m.lineSpacingDefault },
              { value: 'wide', label: m.lineSpacingWide },
              { value: 'wider', label: m.lineSpacingWider },
            ]}
            value={s.lineSpacing}
            onchange={(e) => set({ lineSpacing: e.currentTarget.value as Settings['lineSpacing'] })}
          />
          <Toggle
            label={m.letterSpacing}
            checked={s.letterSpacing}
            onchange={(v) => set({ letterSpacing: v })}
          />
          <Toggle
            label={m.highContrast}
            checked={s.highContrast}
            onchange={(v) => set({ highContrast: v })}
          />
          <Toggle
            label={m.transcriptByDefault}
            checked={s.transcriptByDefault}
            onchange={(v) => set({ transcriptByDefault: v })}
          />
          <Toggle
            label={m.replaceHandwriting}
            checked={s.replaceHandwriting}
            onchange={(v) => set({ replaceHandwriting: v })}
          />
          <Select
            label={m.colorVision}
            options={[
              { value: 'default', label: m.colorVisionDefault },
              { value: 'protanopia', label: m.protanopia },
              { value: 'deuteranopia', label: m.deuteranopia },
              { value: 'tritanopia', label: m.tritanopia },
            ]}
            value={s.colorVision}
            onchange={(e) => set({ colorVision: e.currentTarget.value as Settings['colorVision'] })}
          />
        {:else if id === 'audio'}
          {#each ['master', 'music', 'ambience', 'sfx', 'ui'] as const as key (key)}
            <Slider
              label={m.volume[key] ?? key}
              min={0}
              max={1}
              step={0.05}
              value={s.volume[key]}
              format={m.percent}
              hint={key === 'music' ? m.noMusic : undefined}
              onchange={(v) => set({ volume: { ...s.volume, [key]: v } })}
            />
          {/each}
          <Toggle label={m.mono} checked={s.mono} onchange={(v) => set({ mono: v })} />
          <Toggle
            label={m.muteInBackground}
            checked={s.muteInBackground}
            onchange={(v) => set({ muteInBackground: v })}
          />
          <Toggle label={m.haptics} checked={s.haptics} onchange={(v) => set({ haptics: v })} />
        {:else if id === 'controls'}
          <Select
            label={m.inputGlyphs}
            options={[
              { value: 'auto', label: m.glyphsAuto },
              { value: 'keyboard', label: m.glyphsKeyboard },
              { value: 'gamepad', label: m.glyphsGamepad },
            ]}
            value={s.inputGlyphs}
            onchange={(e) => set({ inputGlyphs: e.currentTarget.value as Settings['inputGlyphs'] })}
          />
          <h2>{m.shortcuts}</h2>
          <p class="status" role="status">{capturing ? m.pressKey : ''}</p>
          <ul class="keys">
            {#each COMMANDS as cmd (cmd)}
              <li>
                <span class="cmd">{messages.commands[cmd] ?? cmd}</span>
                <span class="binding">
                  {#if keymap.bindings[cmd].length > 0}
                    <KeyHint
                      keys={keymap.bindings[cmd][0]!.split(/\+(?!$)/).map((k) => comboLabel(k))}
                    />
                  {:else}
                    {m.noKey}
                  {/if}
                </span>
                <Button
                  variant="ghost"
                  aria-label={m.rebindFor(messages.commands[cmd] ?? cmd)}
                  aria-pressed={capturing === cmd}
                  onclick={() => (capturing = capturing === cmd ? null : cmd)}
                  >{capturing === cmd ? m.pressKey : m.rebind}</Button
                >
              </li>
            {/each}
          </ul>
          <Button onclick={resetKeys}>{m.resetKeys}</Button>
          <h2>{m.gamepadTitle}</h2>
          <p class="muted">
            {input.padName ? m.gamepadConnected(input.padName) : m.gamepadNone}
          </p>
          <div class="pad-hints">
            <KeyHint
              device="gamepad"
              pad="south"
              padStyle={input.padStyle}
              action={messages.glyphs.select}
            />
            <KeyHint
              device="gamepad"
              pad="east"
              padStyle={input.padStyle}
              action={messages.glyphs.back}
            />
            <KeyHint
              device="gamepad"
              pad="start"
              padStyle={input.padStyle}
              action={messages.glyphs.pause}
            />
            <KeyHint
              device="gamepad"
              pad="rb"
              padStyle={input.padStyle}
              action={messages.glyphs.tabs}
            />
          </div>
        {:else if id === 'language'}
          <Select
            label={m.language}
            options={[{ value: 'fr', label: m.languageFr }]}
            value="fr"
            hint={m.languageNote}
          />
        {:else if id === 'data'}
          <p class="muted">{app.storageWarning ?? m.storageNote}</p>
          {#if app.screen !== 'desk'}
            <Button iconName="archives" onclick={() => app.goto('slots')}>{m.manageSaves}</Button>
          {/if}
          <Button variant="danger" onclick={resetSettings}>{m.resetSettings}</Button>
        {/if}
      </div>
    {/snippet}
  </Tabs>
</ScreenFrame>

<style>
  .section {
    display: grid;
    gap: var(--space-5);
    padding-block: var(--space-6);
    justify-items: start;
  }
  .section > :global(*) {
    width: 100%;
  }
  .section > :global(button),
  .section > :global(a) {
    width: auto;
  }
  h2 {
    font-family: var(--font-display);
    font-size: var(--step-1);
    margin-block-start: var(--space-4);
  }
  .muted {
    color: var(--text-muted);
  }
  .status {
    min-height: 1lh;
    color: var(--accent);
  }
  .keys {
    display: grid;
    gap: var(--space-1);
    padding: 0;
    list-style: none;
  }
  .keys li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--space-3);
    min-height: var(--hit-row);
    border-block-end: var(--border) solid var(--line);
  }
  .binding {
    color: var(--text-muted);
  }
  .pad-hints {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
  }
</style>
