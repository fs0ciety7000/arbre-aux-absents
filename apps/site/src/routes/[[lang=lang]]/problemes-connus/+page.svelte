<!--
  Problèmes connus (DESIGN §14.6 ; ARCHITECTURE §8) : registre lu au chargement depuis
  GET /v1/known-issues (titres relus par l'équipe, texte brut), fiches bristol triées par mise à
  jour, chacune avec le dernier tampon de sa frise. Chargement, liste vide et erreur traités ;
  sans JS, le `<noscript>` renvoie vers le forum itch.io.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card, Loader, Stamp, UI_STRINGS } from '@arbre/ui';
  import type { KnownIssue } from '@arbre/contract';
  import Seo from '#lib/components/Seo.svelte';
  import { localHref } from '#lib/i18n/app';
  import { getKnownIssues } from '#lib/report/client';
  import { FORUM_URL } from '#lib/report/config';
  import { fill, formatDate } from '#lib/report/payload';
  import type { PageProps } from './$types';

  // Page hydratée : les textes arrivent par `data` (une langue), jamais par les catalogues.
  let { data }: PageProps = $props();
  const t = $derived(data.t);
  const lang = $derived(data.lang);
  const ticketText = $derived(UI_STRINGS[lang].ticket);

  type State =
    | { kind: 'boot' }
    | { kind: 'loading' }
    | { kind: 'error' }
    | { kind: 'ready'; issues: KnownIssue[] };
  let view = $state<State>({ kind: 'boot' });

  async function load() {
    view = { kind: 'loading' };
    const result = await getKnownIssues(lang);
    view = result.ok ? { kind: 'ready', issues: result.value } : { kind: 'error' };
  }

  onMount(() => {
    void load();
  });

  /** Dernier tampon de la frise (§9.36) : « Corrigé v1.2.0 » au violet, sinon l'encre. */
  function stampOf(issue: KnownIssue) {
    if (issue.status === 'fixed') {
      return {
        text: issue.fixedIn ? ticketText.fixedIn(issue.fixedIn) : ticketText.status.fixed,
        tone: 'established' as const,
      };
    }
    return { text: ticketText.status[issue.status], tone: 'ink' as const };
  }
</script>

<Seo title={data.seo.title} description={data.seo.description} path="problemes-connus/" />

<header class="container page-head">
  <p class="kicker">{t.kicker}</p>
  <h1>{t.title}</h1>
  <p class="lede">{t.lede}</p>
  <Button variant="secondary" href={localHref(lang, 'signaler/')} iconName="envelope"
    >{t.reportLink}</Button
  >
</header>

<section class="container" aria-labelledby="known-list">
  <h2 id="known-list" class="visually-hidden">{t.listLabel}</h2>
  <noscript>
    <p class="notice">
      {t.noscript}
      <a href={FORUM_URL} rel="external noreferrer">{t.forum}</a>
    </p>
  </noscript>

  <div aria-live="polite" aria-busy={view.kind === 'loading' || view.kind === 'boot'}>
    {#if view.kind === 'loading'}
      <div class="loading"><Loader label={t.loading} showLabel /></div>
    {:else if view.kind === 'error'}
      <div class="state">
        <p>{t.error}</p>
        <div class="actions">
          <Button variant="primary" onclick={load}>{t.retry}</Button>
          <Button variant="ghost" href={FORUM_URL} rel="noreferrer" iconName="external"
            >{t.forum}</Button
          >
        </div>
      </div>
    {:else if view.kind === 'ready'}
      {#if view.issues.length === 0}
        <p class="state empty">{t.empty}</p>
      {:else}
        <ul class="issues">
          {#each view.issues as issue, i (issue.ticket)}
            {@const stamp = stampOf(issue)}
            <li>
              <Card
                variant="index"
                title={issue.title}
                kicker={issue.ticket}
                meta={fill(t.updated, { date: formatDate(issue.updatedAt, lang) })}
                tilt={i % 2 ? 0.5 : -0.5}
              >
                <div class="stamp">
                  <Stamp text={stamp.text} tone={stamp.tone} size="s" rotate={i % 2 ? 3 : -4} />
                </div>
              </Card>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</section>

<style>
  .notice {
    margin-block-end: var(--space-6);
    padding: var(--space-4);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-s);
  }
  .loading {
    display: flex;
    justify-content: center;
    padding-block: var(--space-12);
  }
  .state {
    display: grid;
    justify-items: start;
    gap: var(--space-4);
    max-inline-size: var(--measure);
  }
  .empty {
    font-family: var(--font-read);
    font-size: var(--step-read);
    color: var(--text-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  .issues {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
    gap: var(--space-8) var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .stamp {
    padding-block: var(--space-3) var(--space-1);
  }
</style>
