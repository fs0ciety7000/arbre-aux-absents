<script lang="ts">
  import {
    Badge,
    Button,
    Dialog,
    DymoLabel,
    Icon,
    KeyArt,
    LampLight,
    LanguageSwitch,
    Wordmark,
    type IconName,
  } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { getApp } from '../lib/game/context';
  import { formatDateTime } from '../lib/game/format';
  import { KEYART_NARROW, keyArtFrame, loadKeyArt, type KeyArtFrame } from '../lib/game/keyart';
  import type { ScreenId } from '../lib/game/types';
  import { messages } from '../messages.fr';
  import UpdateNotice from './UpdateNotice.svelte';

  /**
   * E02 — écran titre (DESIGN §13.1) : l'art clé « Le bureau sous la lampe », vivant, plein
   * cadre ; le menu dans la zone calme à droite (sous 760 px : art 4:5 puis menu). Les objets du
   * bureau sont aussi des entrées du menu à la souris (point & click) ; la liste de boutons reste
   * l'accès clavier, manette et lecteur d'écran.
   */
  const app = getApp();
  const m = messages.menu;

  let error = $state<string | null>(null);
  let busy = $state(false);
  let quitOpen = $state(false);
  let first: HTMLElement | undefined = $state();
  let hot = $state<string | null>(null);

  const last = $derived(app.lastSave);
  /** Titre de l'affaire de la dernière partie, dans la langue courante (catalogue). */
  const lastTitle = $derived(last ? app.caseTitleOf(last) : '');
  // Index d'affaires en arrière-plan (≈ 0,6 Ko gz par affaire) : titre traduit sous « Continuer »
  // et E04 ouvert sans attente réseau.
  $effect(() => {
    void app.ensureCatalog();
  });
  const canQuit = $derived(Boolean(app.platform?.quit) && app.platform?.kind === 'desktop');
  const dev = $derived(app.cases.some((c) => c.fixture));

  // Un seul cadrage de l'art clé, choisi et rechargé selon la largeur (DESIGN §8.5).
  let frame = $state<KeyArtFrame>(keyArtFrame());
  let art = $state<{ frame: KeyArtFrame; svg: string } | null>(null);
  $effect(() => {
    const f = frame;
    let alive = true;
    loadKeyArt(f).then(
      (svg) => alive && (art = { frame: f, svg }),
      () => undefined, // décor : sans l'art, le bureau et sa lampe restent
    );
    return () => {
      alive = false;
    };
  });

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

  interface Hotspot {
    id: string;
    label: string;
    verb: 'look' | 'take' | 'use';
    /** Zone en unités du viewBox 16:9 (1600 × 900). */
    x: number;
    y: number;
    w: number;
    h: number;
    run: () => void;
  }
  /** Objets du bureau (art 16:9) qui mènent aux entrées du menu. */
  const hotspots: Hotspot[] = $derived([
    {
      id: 'lamp',
      label: last ? m.continue : m.newGame,
      verb: 'use',
      x: 470,
      y: 180,
      w: 340,
      h: 270,
      run: () => (last ? void continueGame() : go('new-game')),
    },
    {
      id: 'tree',
      label: m.newGame,
      verb: 'take',
      x: 600,
      y: 455,
      w: 340,
      h: 190,
      run: () => go('new-game'),
    },
    {
      id: 'folders',
      label: m.load,
      verb: 'take',
      x: 70,
      y: 555,
      w: 350,
      h: 245,
      run: () => go('slots'),
    },
    {
      id: 'stamp',
      label: m.achievements,
      verb: 'look',
      x: 430,
      y: 585,
      w: 160,
      h: 95,
      run: () => go('achievements'),
    },
  ]);

  interface Entry {
    id: ScreenId;
    label: string;
    icon: IconName;
  }
  const more: Entry[] = $derived([
    { id: 'slots', label: m.load, icon: 'archives' },
    { id: 'options', label: m.options, icon: 'settings' },
    { id: 'achievements', label: m.achievements, icon: 'star' },
    { id: 'stats', label: m.stats, icon: 'list' },
    { id: 'bonus', label: m.bonus, icon: 'layers' },
    { id: 'credits', label: m.credits, icon: 'quill' },
    { id: 'changelog', label: m.changelog, icon: 'sparkle' },
  ]);
  const HOT_ENTRY: Record<string, string> = {
    lamp: 'main',
    tree: 'new-game',
    folders: 'slots',
    stamp: 'achievements',
  };

  onMount(() => {
    first?.querySelector<HTMLElement>('button')?.focus();
    const mq = matchMedia(KEYART_NARROW);
    const on = () => (frame = mq.matches ? 'tall' : 'wide');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  });
</script>

<main id="contenu" class="title-screen" class:tall={frame === 'tall'} tabindex="-1">
  <div class="art-layer" aria-hidden="true">
    <LampLight x={frame === 'tall' ? 36 : 47} y={frame === 'tall' ? 22 : 18} dust={0} />
    {#if art}
      {#key art.frame}
        <div class="art-fade">
          <KeyArt
            svg={art.svg}
            anchor={art.frame === 'tall' ? 'center' : 'start'}
            fade={art.frame === 'tall' ? 'bottom' : 'none'}
          />
        </div>
      {/key}
    {/if}
    {#if art?.frame === 'wide'}
      <!-- Objets cliquables à la souris ; le menu à droite est l'accès clavier. -->
      <svg
        class="hotspots"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMinYMid slice"
        focusable="false"
      >
        {#each hotspots as h (h.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
          <g
            class="hit"
            class:on={hot === h.id}
            data-verb={h.verb}
            onclick={h.run}
            onpointerenter={() => (hot = h.id)}
            onpointerleave={() => (hot = null)}
          >
            <rect class="zone" x={h.x} y={h.y} width={h.w} height={h.h} rx="14" />
            <g class="tag" transform="translate({h.x + 10} {h.y - 16})">
              <rect class="tag-bg" width={h.label.length * 15 + 34} height="34" rx="2" />
              <text class="tag-text" x="17" y="24">{h.label}</text>
            </g>
          </g>
        {/each}
      </svg>
    {/if}
  </div>
  <div class="calm" aria-hidden="true"></div>

  <div class="menu-col">
    <Wordmark size="hero" animate glow kicker={m.kicker} tagline={m.hook} />

    <nav class="menu mv-rise" style:--i="7" aria-label={m.label} bind:this={first}>
      <ul class="main-actions" class:hot={hot ? HOT_ENTRY[hot] === 'main' : false}>
        {#if last}
          <li>
            <Button
              variant="primary"
              size="l"
              block
              loading={busy}
              iconName="lamp"
              class={hot === 'lamp' ? 'is-hot' : ''}
              onclick={continueGame}
            >
              <span class="label">
                {m.continue}
                <span class="detail">{lastTitle}</span>
              </span>
            </Button>
          </li>
        {/if}
        <li>
          <Button
            variant={last ? 'secondary' : 'primary'}
            size="l"
            block
            iconName="folder"
            class={hot === 'tree' || (!last && hot === 'lamp') ? 'is-hot' : ''}
            onclick={() => go('new-game')}>{m.newGame}</Button
          >
        </li>
      </ul>
      <ul class="more">
        {#each more as e (e.id)}
          <li class:wide={e.id === 'changelog' && app.changelogUnseen}>
            <Button
              variant="ghost"
              iconName={e.icon}
              class={hot && HOT_ENTRY[hot] === e.id ? 'is-hot' : ''}
              onclick={() => go(e.id)}
              >{e.label}
              {#if e.id === 'changelog' && app.changelogUnseen}
                <!-- Notes de la version installée pas encore ouvertes (ARCHITECTURE §3.8). -->
                <Badge tone="accent" variant="solid" dot class="unseen">{m.changelogUnseen}</Badge>
              {/if}
            </Button>
          </li>
        {/each}
        {#if canQuit}
          <li>
            <Button variant="ghost" iconName="close" onclick={() => (quitOpen = true)}
              >{m.quit}</Button
            >
          </li>
        {/if}
      </ul>
    </nav>

    <!-- Mise à jour du jeu installé (D18, DESIGN §13.12) : jamais sur le web. -->
    {#if app.updates.prompt}
      <UpdateNotice variant="title" />
    {/if}

    {#if last}
      <p class="save mv-rise" style:--i="8">
        <DymoLabel text={m.lastFiled} tilt={-1.5} />
        <span class="when num">{formatDateTime(last.updatedAt)}</span>
        <span class="when num">{m.lastFiledDetail(Math.round(last.progress * 100), lastTitle)}</span
        >
      </p>
    {/if}

    {#if error}
      <p class="error" role="alert"><Icon name="danger" /> {error}</p>
    {/if}
    {#if app.storageWarning}
      <p class="warning" role="status"><Icon name="warning" /> {app.storageWarning}</p>
    {/if}

    <!-- Sélecteur de langue (DESIGN §9.35, §13.10) : sous le menu ; « système » est dans Options. -->
    <div class="language mv-rise" style:--i="9">
      <LanguageSwitch value={app.lang} onchange={(loc) => void app.setLanguage(loc)} />
    </div>
  </div>

  <footer class="studio">
    <p class="studio-line">
      <Icon name="fern" size="1rem" />
      <span>{messages.credits}</span>
      {#if dev}<Badge tone="warning" variant="outline">{m.devBadge}</Badge>{/if}
    </p>
    <!-- Signaler un problème (DESIGN §13.8) : lien discret sous les crédits. -->
    <button type="button" class="report-link" onclick={() => app.openReport()}>
      <Icon name="envelope" size="1rem" />
      {messages.bugReport.entry}
    </button>
  </footer>
</main>

<Dialog bind:open={quitOpen} title={m.quitConfirmTitle} description={m.quitConfirmText} size="s">
  {#snippet actions()}
    <Button onclick={() => (quitOpen = false)}>{messages.cancel}</Button>
    <Button variant="danger" onclick={() => app.platform?.quit?.()}>{m.quit}</Button>
  {/snippet}
</Dialog>

<style>
  .title-screen {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(22rem, 33.4%);
    min-height: 100dvh;
    overflow: hidden;
    background: var(--desk);
    outline: none;
  }
  .art-layer {
    position: absolute;
    inset: 0;
    z-index: -1;
  }
  .art-layer :global(.keyart),
  .art-fade {
    position: absolute;
    inset: 0;
  }
  .art-fade {
    animation: m-fade-in var(--dur-slow) var(--ease-out) backwards;
  }
  /* Zone calme : tiers droit, mur sombre ; voile d'encre pour lire le menu (§8.5). */
  .calm {
    position: absolute;
    inset: 0 0 0 auto;
    z-index: -1;
    width: 46%;
    background: linear-gradient(to left, var(--scrim-art) 62%, transparent);
    pointer-events: none;
  }

  /* ── Objets cliquables (souris) ── */
  .hotspots {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .hit {
    pointer-events: all;
  }
  .zone {
    fill: var(--accent-tint);
    stroke: var(--accent);
    stroke-width: 2;
    stroke-dasharray: 6 6;
    opacity: 0;
    transition: opacity var(--dur-base) var(--ease-out);
  }
  .tag {
    opacity: 0;
    transition: opacity var(--dur-fast) var(--ease-out);
    pointer-events: none;
  }
  .tag-bg {
    fill: var(--label-tape);
  }
  .tag-text {
    fill: var(--label-tape-text);
    font-family: var(--font-label);
    font-size: 19px;
    font-weight: var(--weight-medium);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .hit.on .zone,
  .hit.on .tag {
    opacity: 1;
  }

  /* ── Menu ── */
  .menu-col {
    grid-column: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-6);
    min-width: 0;
    padding: var(--space-8) var(--space-8) var(--space-12) var(--space-4);
    padding-block-start: max(var(--space-8), env(safe-area-inset-top));
    padding-inline-end: max(var(--space-8), env(safe-area-inset-right));
  }
  .menu {
    display: grid;
    gap: var(--space-3);
    max-width: 24rem;
  }
  .main-actions,
  .more {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .more {
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: var(--space-1) var(--space-2);
  }
  .more :global(.btn) {
    justify-content: flex-start;
    width: 100%;
  }
  /* Nouveautés marquées « Nouveau » : toute la rangée, pour que la pastille tienne. */
  .more .wide {
    grid-column: 1 / -1;
  }
  /* Objet survolé dans l'art : son entrée de menu s'allume aussi. */
  .menu :global(.is-hot) {
    outline: 2px dashed var(--accent);
    outline-offset: 3px;
  }
  .label {
    display: grid;
    text-align: start;
  }
  .detail {
    font-family: var(--font-ui);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: 0;
    text-transform: none;
  }
  .save {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    margin: 0;
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .when {
    font-family: var(--font-type);
  }
  .error,
  .warning {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    margin: 0;
  }
  .error {
    color: var(--danger);
  }
  .warning {
    color: var(--warning);
  }
  .language {
    display: flex;
    justify-content: flex-end;
  }
  .studio {
    position: absolute;
    inset: auto auto var(--space-4) var(--space-5);
    display: grid;
    justify-items: start;
    gap: var(--space-1);
    padding-block-end: env(safe-area-inset-bottom);
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .studio-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
  }
  /* Lien discret : texte souligné, cible ≥ 44 px, focus visible. */
  .report-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: var(--hit);
    padding: 0;
    border: 0;
    background: none;
    color: var(--text-muted);
    font: inherit;
    letter-spacing: inherit;
    text-transform: none;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    cursor: pointer;
  }
  .report-link:hover {
    color: var(--text);
  }
  .report-link:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  /* ── Sous 760 px : art 4:5 recomposé, menu dessous (§13.1) ── */
  .tall {
    display: block;
    overflow: visible;
  }
  .tall .art-layer {
    position: relative;
    inset: auto;
    z-index: 0;
    width: 100%;
    aspect-ratio: 4 / 5;
    max-height: 68dvh;
    overflow: hidden;
  }
  .tall .calm {
    display: none;
  }
  .tall .menu-col {
    position: relative;
    margin-top: -22vw;
    padding: 0 var(--gutter) var(--space-8);
  }
  .tall .menu {
    max-width: none;
  }
  .tall .studio {
    position: static;
    padding: 0 var(--gutter) max(var(--space-5), env(safe-area-inset-bottom));
  }
  @media (forced-colors: active) {
    .calm,
    .hotspots {
      display: none;
    }
  }
</style>
