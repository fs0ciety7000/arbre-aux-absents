<!--
  Nouveautés (ARCHITECTURE §3.8, DESIGN §14.7) : une feuille par version publiée, la plus récente
  d'abord ; cote rouge de la version à l'étiqueteuse, date à la machine à écrire, points marqués
  Nouveauté / Amélioration / Correction (pastille : icône + texte). Prérendu, sans JS.
-->
<script lang="ts">
  import { Badge, Button, DymoLabel, PaperSheet, type IconName } from '@arbre/ui';
  import type { ChangeKind } from '@arbre/contract';
  import Seo from '#lib/components/Seo.svelte';
  import { STRINGS } from '#lib/i18n/index';
  import { currentLang, localHref } from '#lib/i18n/app';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const lang = $derived(currentLang());
  const t = $derived(STRINGS[lang].changelog);
  const latest = $derived(data.releases[0]);

  const KIND: Record<ChangeKind, { tone: 'accent' | 'info' | 'success'; icon: IconName }> = {
    new: { tone: 'accent', icon: 'sparkle' },
    improved: { tone: 'info', icon: 'plus' },
    fixed: { tone: 'success', icon: 'check' },
  };

  /** Date du jour de publication (AAAA-MM-JJ) en clair, sans décalage de fuseau. */
  function formatDay(day: string): string {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${day}T00:00:00Z`));
  }
</script>

<Seo title={t.seoTitle} description={t.seoDescription} path="nouveautes/" />

<header class="container-narrow page-head">
  <p class="kicker">{t.kicker}</p>
  <h1>{t.title}</h1>
  <p class="lede">{t.lede}</p>
  {#if latest}
    <p class="current ink-type">{t.current} <strong>{latest.version}</strong></p>
  {/if}
</header>

<div class="container-narrow">
  <ol class="releases" aria-label={t.listLabel}>
    {#each data.releases as release, i (release.version)}
      <li>
        <PaperSheet
          tone={i === 0 ? 'new' : 'paper'}
          fastener={i === 0 ? 'clip' : 'none'}
          as="article"
        >
          <div class="release">
            <p class="meta">
              <DymoLabel tone="red" tilt={i % 2 ? 1 : -1.5}>
                <span class="visually-hidden">{t.versionLabel}</span>
                {release.version}
              </DymoLabel>
              <time class="ink-type" datetime={release.date}>{formatDay(release.date)}</time>
            </p>
            <h2 id="v-{release.version}">{release.title}</h2>
            <ul class="items">
              {#each release.items as item, j (j)}
                <li>
                  <Badge tone={KIND[item.kind].tone} iconName={KIND[item.kind].icon}
                    >{t.kinds[item.kind]}</Badge
                  >
                  <span class="text">{item.text}</span>
                </li>
              {/each}
            </ul>
          </div>
        </PaperSheet>
      </li>
    {/each}
  </ol>

  <div class="actions">
    <Button variant="secondary" href={localHref(lang, 'problemes-connus/')}>{t.knownLink}</Button>
    <Button variant="ghost" href={localHref(lang, 'signaler/')} iconName="envelope"
      >{t.reportLink}</Button
    >
  </div>
</div>

<style>
  .current {
    color: var(--text-muted);
  }
  .current strong {
    color: var(--text);
  }
  .releases {
    display: grid;
    gap: var(--space-10);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .release {
    display: grid;
    gap: var(--space-4);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    margin: 0;
  }
  time {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  h2 {
    margin: 0;
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
    grid-template-columns: 9rem minmax(0, 1fr);
    align-items: baseline;
    gap: var(--space-1) var(--space-4);
  }
  /* La pastille garde sa largeur ; la colonne aligne les textes. */
  .items li > :global(.badge) {
    justify-self: start;
  }
  .text {
    max-inline-size: var(--measure);
    font-family: var(--font-read);
    font-size: var(--step-read);
    line-height: var(--leading-read);
  }
  /* Feuille étroite : la pastille au-dessus de sa ligne. */
  @media (max-width: 40rem) {
    .items li {
      grid-template-columns: minmax(0, 1fr);
      justify-items: start;
    }
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-block-start: var(--space-10);
  }
</style>
