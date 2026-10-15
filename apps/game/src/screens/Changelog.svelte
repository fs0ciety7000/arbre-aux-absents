<script lang="ts">
  import { Badge, DymoLabel, Icon, PaperSheet, type IconName } from '@arbre/ui';
  import { ChangelogSchema, type ChangeKind } from '@arbre/contract';
  import { onMount } from 'svelte';
  // Notes de l'édition construite (`content:build`) : la démo n'embarque rien de l'édition complète.
  import raw from '../generated/changelog.json';
  import { uiLang } from '../i18n/index.svelte';
  import { getApp } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /**
   * Nouveautés (ARCHITECTURE §3.8, DESIGN §13.11) : notes de version, une feuille par version
   * publiée, la plus récente d'abord ; version installée en surtitre. Chaque version est un arrêt
   * de focus (clavier, manette : la navigation spatiale fait défiler la liste). Ouvrir l'écran
   * retire la marque « Nouveau » du menu titre jusqu'à la prochaine version.
   */
  const app = getApp();
  const m = $derived(messages.changelogScreen);
  const lang = $derived(uiLang());

  // Validé par `content:check` ; revalidé ici : un fichier abîmé donne un message, pas une erreur.
  const parsed = ChangelogSchema.safeParse(raw);
  const releases = parsed.success ? parsed.data : [];

  const KIND: Record<ChangeKind, { tone: 'accent' | 'info' | 'success'; icon: IconName }> = {
    new: { tone: 'accent', icon: 'sparkle' },
    improved: { tone: 'info', icon: 'plus' },
    fixed: { tone: 'success', icon: 'check' },
  };

  /** Jour de publication (AAAA-MM-JJ) dans la langue de l'interface, sans décalage de fuseau. */
  function formatDay(day: string): string {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${day}T00:00:00Z`));
  }

  onMount(() => app.markChangelogSeen());
</script>

<ScreenFrame
  title={m.title}
  kicker={messages.menu.version(app.version)}
  onback={() => app.goto('title')}
>
  <div class="stack">
    <p class="lede">{m.lede}</p>
    {#if !parsed.success}
      <p class="state" role="alert"><Icon name="warning" /> {m.error}</p>
    {:else}
      <ol class="releases">
        {#each releases as release, i (release.version)}
          <li class="mv-deal" style:--i={Math.min(i, 4) + 2}>
            <PaperSheet tone={i === 0 ? 'new' : 'paper'} tilt={i % 2 ? 0.3 : -0.3}>
              <!-- Arrêt de focus : la manette et le clavier font défiler les versions. -->
              <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
              <article
                class="release"
                tabindex="0"
                aria-labelledby="release-{i}"
                data-version={release.version}
              >
                <p class="meta">
                  <DymoLabel tone="red" tilt={i % 2 ? 1 : -1.5}>
                    <span class="visually-hidden">{m.versionLabel}</span>
                    {release.version}
                  </DymoLabel>
                  <time datetime={release.date}>{formatDay(release.date)}</time>
                </p>
                <h2 id="release-{i}">{release.title[lang]}</h2>
                <ul class="items">
                  {#each release.items as item, j (j)}
                    <li>
                      <Badge tone={KIND[item.kind].tone} iconName={KIND[item.kind].icon}
                        >{m.kinds[item.kind]}</Badge
                      >
                      <span class="text">{item.text[lang]}</span>
                    </li>
                  {/each}
                </ul>
              </article>
            </PaperSheet>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</ScreenFrame>

<style>
  .stack {
    display: grid;
    gap: var(--space-6);
  }
  .lede {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-style: italic;
    font-size: var(--step-1);
  }
  .state {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    margin: 0;
    color: var(--warning);
  }
  .releases {
    display: grid;
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .release {
    display: grid;
    gap: var(--space-3);
    border-radius: var(--radius-s);
    outline: none;
    scroll-margin-block: var(--space-6);
  }
  .release:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: var(--space-2);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    margin: 0;
  }
  time {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-2);
    text-wrap: balance;
  }
  .items {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .items li {
    display: grid;
    grid-template-columns: 8.5rem minmax(0, 1fr);
    align-items: baseline;
    gap: var(--space-1) var(--space-4);
  }
  /* La pastille garde sa largeur ; la colonne aligne les textes. */
  .items li > :global(.badge) {
    justify-self: start;
  }
  .text {
    font-family: var(--font-read);
    font-size: var(--step-read);
    line-height: var(--leading-read);
  }
  @media (max-width: 40rem) {
    .items li {
      grid-template-columns: minmax(0, 1fr);
      justify-items: start;
    }
  }
</style>
