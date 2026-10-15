<!--
  Confidentialité du signalement (ARCHITECTURE §8, D12, D13 ; PLAN §5 RGPD) : ce qui est collecté,
  pourquoi, où, combien de temps, IP et Cloudflare, lien de suivi, droits. Prérendu, sans JS.
-->
<script lang="ts">
  import { Button, PaperSheet } from '@arbre/ui';
  import Seo from '#lib/components/Seo.svelte';
  import { STRINGS } from '#lib/i18n/index';
  import { currentLang, localHref } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import { FORUM_URL } from '#lib/report/config';

  const lang = $derived(currentLang());
  const t = $derived(STRINGS[lang].privacy);
</script>

<Seo title={t.seoTitle} description={t.seoDescription} path="confidentialite/" />

<header class="container-narrow page-head">
  <p class="kicker">{t.kicker}</p>
  <h1>{t.title}</h1>
  <p class="lede">{t.lede}</p>
</header>

<div class="container-narrow">
  <PaperSheet tone="paper" fastener="tape" as="article">
    <div class="sheet-body">
      {#each t.sections as section (section.id)}
        <section aria-labelledby="privacy-{section.id}">
          <h2 id="privacy-{section.id}">{section.heading}</h2>
          {#each section.body as paragraph, i (i)}
            <p><Rich text={paragraph} /></p>
          {/each}
        </section>
      {/each}
      <p class="ink-type updated">{t.updated}</p>
    </div>
  </PaperSheet>

  <div class="actions">
    <Button variant="primary" href={localHref(lang, 'signaler/')} iconName="envelope"
      >{t.reportLink}</Button
    >
    <Button variant="ghost" href={FORUM_URL} rel="noreferrer" iconName="external">{t.forum}</Button>
  </div>
</div>

<style>
  .sheet-body {
    display: grid;
    gap: var(--space-8);
  }
  section p {
    max-inline-size: var(--measure);
    font-family: var(--font-read);
    font-size: var(--step-read);
    line-height: var(--leading-read);
  }
  section {
    display: grid;
    gap: var(--space-3);
  }
  h2 {
    font-size: var(--step-2);
    color: var(--ink);
  }
  .updated {
    font-size: var(--step--1);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-block-start: var(--space-8);
  }
</style>
