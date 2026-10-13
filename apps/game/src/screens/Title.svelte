<script lang="ts">
  import { ArtDefs, Badge, Button, Dialog } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { getApp } from '../lib/game/context';
  import { formatDateTime } from '../lib/game/format';
  import type { ScreenId } from '../lib/game/types';
  import { messages } from '../messages.fr';

  /** E02 : bureau illustré (objets = entrées du menu) doublé d'une liste de boutons. */
  const app = getApp();
  const m = messages.menu;

  let error = $state<string | null>(null);
  let busy = $state(false);
  let quitOpen = $state(false);
  let first: HTMLElement | undefined = $state();

  const last = $derived(app.lastSave);
  const canQuit = $derived(Boolean(app.platform?.quit) && app.platform?.kind === 'desktop');
  const dev = $derived(app.cases.some((c) => c.fixture));

  async function continueGame() {
    busy = true;
    error = null;
    const res = await app.continueLast();
    busy = false;
    if (!res.ok) error = res.error;
  }

  function go(screen: ScreenId) {
    app.goto(screen);
  }

  onMount(() => {
    first?.querySelector<HTMLElement>('button')?.focus();
  });
</script>

<main id="contenu" class="title-screen" tabindex="-1">
  <div class="scene" aria-hidden="true">
    <ArtDefs />
    <!-- Objets du bureau cliquables à la souris ; la liste de boutons est l'accès clavier. -->
    <svg class="art on-night desk-art" viewBox="0 0 400 260">
      <ellipse class="lamp-light" cx="250" cy="200" rx="170" ry="52" />
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <g class="object" data-verb="look" onclick={() => go('slots')}>
        <rect class="paper-shade" x="36" y="132" width="110" height="78" rx="2" />
        <rect class="wash-sienne" x="36" y="132" width="110" height="78" rx="2" />
        <rect class="ink" fill="none" x="36" y="132" width="110" height="78" rx="2" />
        <rect class="ink-soft" fill="none" x="30" y="122" width="122" height="16" rx="2" />
        <rect class="hatch" x="36" y="186" width="110" height="24" />
        <rect class="paper" x="74" y="150" width="34" height="14" rx="1" />
        <rect class="ink-soft" fill="none" x="74" y="150" width="34" height="14" rx="1" />
      </g>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <g class="object" data-verb="take" onclick={() => go('new-game')}>
        <rect class="paper" x="168" y="170" width="96" height="62" transform="rotate(-6 216 201)" />
        <rect
          class="ink-soft"
          fill="none"
          x="168"
          y="170"
          width="96"
          height="62"
          transform="rotate(-6 216 201)"
        />
        <path
          class="ink-faint"
          d="M178 186 h70 M179 196 h62 M180 206 h68 M181 216 h40"
          transform="rotate(-6 216 201)"
        />
      </g>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <g class="object" data-verb="write" onclick={() => go('options')}>
        <rect class="wash-indigo" x="282" y="178" width="70" height="50" rx="3" />
        <rect class="ink" fill="none" x="282" y="178" width="70" height="50" rx="3" />
        <path class="ink-soft" d="M290 178 v50" />
      </g>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <g class="object" data-verb="look" onclick={() => (last ? continueGame() : go('new-game'))}>
        <path class="ink" d="M336 234 h44 M358 234 v-96 l-34 -34" fill="none" />
        <circle class="ink" fill="none" cx="358" cy="138" r="3" />
        <path class="wash-safran" d="M300 96 l26 -30 l34 28 l-34 22 z" />
        <path class="ink" fill="none" d="M300 96 l26 -30 l34 28 l-34 22 z" />
        <circle class="wash-safran" cx="318" cy="112" r="6" />
      </g>
    </svg>
  </div>

  <div class="menu-col">
    <hgroup class="brand">
      <h1>{messages.title}</h1>
      <p class="tagline">{messages.tagline}</p>
    </hgroup>

    <nav aria-label={m.label} bind:this={first}>
      <ul class="menu">
        {#if last}
          <li>
            <Button
              variant="primary"
              size="l"
              block
              loading={busy}
              iconName="forward"
              onclick={continueGame}
            >
              <span class="label">
                {m.continue}
                <span class="detail"
                  >{m.continueDetail(last.caseTitle, formatDateTime(last.updatedAt))}</span
                >
              </span>
            </Button>
          </li>
        {/if}
        <li>
          <Button
            variant={last ? 'secondary' : 'primary'}
            size="l"
            block
            iconName="plus"
            onclick={() => go('new-game')}>{m.newGame}</Button
          >
        </li>
        <li>
          <Button size="l" block iconName="archives" onclick={() => go('slots')}>{m.load}</Button>
        </li>
        <li>
          <Button size="l" block iconName="settings" onclick={() => go('options')}
            >{m.options}</Button
          >
        </li>
        <li>
          <Button size="l" block iconName="star" onclick={() => go('achievements')}
            >{m.achievements}</Button
          >
        </li>
        <li>
          <Button size="l" block iconName="list" onclick={() => go('stats')}>{m.stats}</Button>
        </li>
        <li>
          <Button size="l" block iconName="layers" onclick={() => go('bonus')}>{m.bonus}</Button>
        </li>
        <li>
          <Button size="l" block iconName="info" onclick={() => go('credits')}>{m.credits}</Button>
        </li>
        {#if canQuit}
          <li>
            <Button
              size="l"
              block
              variant="ghost"
              iconName="close"
              onclick={() => (quitOpen = true)}>{m.quit}</Button
            >
          </li>
        {/if}
      </ul>
    </nav>

    {#if error}
      <p class="error" role="alert">{error}</p>
    {/if}
    {#if app.storageWarning}
      <p class="warning" role="status">{app.storageWarning}</p>
    {/if}

    <footer class="foot">
      <span>{messages.credits}</span>
      {#if dev}<Badge tone="warning" variant="outline">{m.devBadge}</Badge>{/if}
    </footer>
  </div>
</main>

<Dialog bind:open={quitOpen} title={m.quitConfirmTitle} description={m.quitConfirmText} size="s">
  {#snippet actions()}
    <Button onclick={() => (quitOpen = false)}>{messages.cancel}</Button>
    <Button variant="danger" onclick={() => app.platform?.quit?.()}>{m.quit}</Button>
  {/snippet}
</Dialog>

<style>
  .title-screen {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-8);
    min-height: 100dvh;
    padding: var(--space-8) var(--gutter);
    padding-block: max(var(--space-8), env(safe-area-inset-top))
      max(var(--space-8), env(safe-area-inset-bottom));
    outline: none;
  }
  .scene {
    max-width: 42rem;
    justify-self: end;
    width: 100%;
  }
  .desk-art {
    width: 100%;
  }
  .lamp-light {
    fill: var(--lamp-glow);
  }
  .object {
    cursor: pointer;
    transition: transform var(--dur-base) var(--ease-out);
    transform-box: fill-box;
  }
  .object:hover {
    transform: translateY(var(--lift));
  }
  .menu-col {
    display: grid;
    gap: var(--space-5);
    max-width: 24rem;
  }
  h1 {
    font-family: var(--font-display);
    font-weight: var(--weight-semibold);
    font-size: var(--step-4);
    line-height: var(--leading-tight);
    text-wrap: balance;
  }
  .tagline {
    margin-block-start: var(--space-2);
    color: var(--text-muted);
  }
  .menu {
    display: grid;
    gap: var(--space-2);
    padding: 0;
    list-style: none;
  }
  .label {
    display: grid;
    text-align: start;
  }
  .detail {
    font-size: var(--step--1);
    font-weight: var(--weight-regular);
  }
  .error {
    color: var(--danger);
  }
  .warning {
    color: var(--warning);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    color: var(--text-faint);
    font-size: var(--step--1);
  }
  @media (max-width: 37.4375rem) {
    .title-screen {
      grid-template-columns: 1fr;
      gap: var(--space-4);
      padding-block-start: max(var(--space-4), env(safe-area-inset-top));
    }
    .scene {
      justify-self: center;
      max-width: 22rem;
    }
    .menu-col {
      justify-self: center;
      width: 100%;
    }
  }
</style>
