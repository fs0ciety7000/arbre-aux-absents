<!--
  Signaler un problème (DESIGN §13.8, §14.6 ; ARCHITECTURE §8) : le formulaire de l'Office posé
  sur une feuille, diagnostics du site seulement (plateforme `site`, langue, fenêtre). Page
  hydratée : le formulaire reste désactivé tant que le JS n'a pas pris la main ; sans JS, le
  `<noscript>` renvoie vers le forum itch.io. Le texte saisi n'est jamais perdu en cas d'échec.
-->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    Button,
    DymoLabel,
    Icon,
    PaperSheet,
    Select,
    Stamp,
    TextField,
    ToastRegion,
    pushToast,
  } from '@arbre/ui';
  import type { ReportCategory, ReportReceipt, ReportSubmission } from '@arbre/contract';
  import Seo from '#lib/components/Seo.svelte';
  import { localHref } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import { submitReport, type ApiFailure } from '#lib/report/client';
  import { FORUM_URL } from '#lib/report/config';
  import { CATEGORIES, LIMITS } from '#lib/report/constants';
  import {
    buildSubmission,
    fill,
    formatDelay,
    missingChars,
    reportText,
    siteDiagnostics,
  } from '#lib/report/payload';
  import type { PageProps } from './$types';

  // Page hydratée : les textes arrivent par `data` (une langue), jamais par les catalogues.
  let { data }: PageProps = $props();
  const t = $derived(data.t);
  const lang = $derived(data.lang);

  const categoryOptions = $derived(
    CATEGORIES.map((value) => ({ value, label: data.categories[value] })),
  );

  let ready = $state(false);
  let openedAt = 0;
  let now = $state(0);
  let category = $state<ReportCategory>('bug');
  let description = $state('');
  let contact = $state('');
  let website = $state('');
  let sending = $state(false);
  let failure = $state<ApiFailure | null>(null);
  let receipt = $state<ReportReceipt | null>(null);
  let previewOpen = $state(false);
  let copyFallback = $state<string | null>(null);
  let userAgent = $state('');
  let innerWidth = $state(0);
  let innerHeight = $state(0);
  let devicePixelRatio = $state(1);
  let receiptHeading: HTMLElement | undefined = $state();
  let failureBox: HTMLElement | undefined = $state();

  onMount(() => {
    openedAt = Date.now();
    now = openedAt;
    userAgent = navigator.userAgent;
    ready = true;
  });

  // L'aperçu montre aussi le temps passé (`elapsedMs`) : rafraîchi chaque seconde, aperçu ouvert.
  $effect(() => {
    if (!previewOpen) return;
    now = Date.now();
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  const missing = $derived(missingChars(description));
  const diagnostics = $derived(
    siteDiagnostics({
      appVersion: data.appVersion,
      locale: lang,
      userAgent,
      width: innerWidth,
      height: innerHeight,
      dpr: devicePixelRatio,
    }),
  );
  const build = (elapsedMs: number): ReportSubmission =>
    buildSubmission({
      category,
      description,
      contact,
      locale: lang,
      diagnostics,
      website,
      elapsedMs,
    });
  /** Le JSON réel qui partira (DESIGN §13.8 : aperçu exact, recalculé à chaque saisie). */
  const preview = $derived(JSON.stringify(build(Math.max(0, now - openedAt)), null, 2));
  const previewLine = $derived(
    fill(t.previewLine, {
      version: data.appVersion,
      language: data.languageName,
      w: diagnostics.viewport.w,
      h: diagnostics.viewport.h,
    }),
  );

  // Lien affiché et copié : celui du service, déjà dans la langue du signalement (ARCHITECTURE §8).
  // « Ouvrir le suivi » reste un lien relatif (même origine, préproduction comprise).
  const followUrl = $derived(receipt?.followUrl ?? '');

  /** Raison d'un échec, en clair (429 : délai de `Retry-After`). */
  function reason(f: ApiFailure): string {
    switch (f.kind) {
      case 'offline':
        return t.failure.offline;
      case 'timeout':
        return t.failure.timeout;
      case 'disabled':
        return t.failure.disabled;
      case 'rateLimited':
        return f.retryAfterSec === null
          ? t.failure.rateLimitedLater
          : fill(t.failure.rateLimited, { delay: formatDelay(f.retryAfterSec, lang) });
      case 'tooLarge':
        return t.failure.tooLarge;
      case 'invalid':
      case 'notFound':
        return t.failure.invalid;
      default:
        return t.failure.unavailable;
    }
  }
  const refused = (f: ApiFailure) =>
    f.kind === 'invalid' || f.kind === 'tooLarge' || f.kind === 'notFound';

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!ready || sending || missing > 0) return;
    sending = true;
    failure = null;
    copyFallback = null;
    // Le service ignore un envoi plus rapide que 3 s (anti-robot) : on attend ce délai au besoin.
    const wait = LIMITS.minElapsedMs + 100 - (Date.now() - openedAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const result = await submitReport(build(Date.now() - openedAt));
    sending = false;
    if (result.ok) {
      receipt = result.value;
      await tick();
      receiptHeading?.focus();
      return;
    }
    failure = result.failure;
    pushToast({ tone: 'warning', title: t.failure.toast, message: reason(result.failure) });
    await tick();
    failureBox?.focus();
  }

  /** Rapport à coller sur le forum : sans contact ni pot de miel (le forum est public). */
  function copyText() {
    return reportText(build(Date.now() - openedAt), t.text, data.categories[category]);
  }

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      copyFallback = null;
      pushToast({ tone: 'success', title: done });
    } catch {
      copyFallback = text;
      pushToast({ tone: 'warning', title: t.failure.copyFailed });
    }
  }

  function selectAll(event: FocusEvent) {
    const range = document.createRange();
    range.selectNodeContents(event.currentTarget as Node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  function another() {
    receipt = null;
    description = '';
    contact = '';
    failure = null;
    openedAt = Date.now();
  }
</script>

<svelte:window bind:innerWidth bind:innerHeight bind:devicePixelRatio />

<Seo title={data.seo.title} description={data.seo.description} path="signaler/" />

<header class="container-narrow page-head">
  <p class="kicker">{t.kicker}</p>
  <h1>{t.title}</h1>
  <p class="lede">{t.lede}</p>
</header>

<div class="container-narrow">
  <noscript>
    <p class="notice">
      {t.noscript}
      <a href={FORUM_URL} rel="external noreferrer">{t.forum}</a>
    </p>
  </noscript>

  <PaperSheet tone="new" fastener="clip" as="section">
    <div class="sheet-body">
      {#if receipt}
        <div class="receipt">
          <Stamp text={t.receipt.stamp} tone="established" animate rotate={-8} />
          <h2 bind:this={receiptHeading} tabindex="-1">{t.receipt.title}</h2>
          <p class="number">
            <span class="visually-hidden">{t.receipt.number}</span>
            <DymoLabel text={receipt.ticket} tone="red" tilt={-1.5} />
          </p>
          <p class="keep">{t.receipt.keep}</p>
          <p class="follow">
            <span class="label">{t.receipt.followLabel}</span>
            <span class="ink-type url">{followUrl}</span>
          </p>
          <div class="actions">
            <Button
              variant="primary"
              href={localHref(lang, 'suivi/', receipt.token)}
              rel="noreferrer"
              iconName="external">{t.receipt.open}</Button
            >
            <Button
              variant="secondary"
              iconName="clip"
              onclick={() => copy(followUrl, t.receipt.linkCopied)}>{t.receipt.copyLink}</Button
            >
            <Button variant="ghost" onclick={another}>{t.receipt.another}</Button>
          </div>
        </div>
      {:else}
        <form {onsubmit} novalidate>
          <fieldset disabled={!ready}>
            <legend class="visually-hidden">{t.title}</legend>
            <Select
              id="report-category"
              label={t.categoryLabel}
              options={categoryOptions}
              bind:value={category}
            />
            <TextField
              id="report-description"
              label={t.descriptionLabel}
              hint={t.descriptionHint}
              multiline
              rows={4}
              maxlength={LIMITS.descriptionMax}
              bind:value={description}
            />
            <div class="contact">
              <TextField
                id="report-contact"
                label={t.contactLabel}
                hint={t.contactHint}
                maxlength={LIMITS.contact}
                autocomplete="email"
                bind:value={contact}
              />
              <p class="privacy"><Rich text={t.contactPrivacy} /></p>
            </div>
            <!-- Pot de miel : hors écran, hors tabulation, ignoré des lecteurs d'écran. -->
            <div class="visually-hidden" aria-hidden="true">
              <label for="report-website">{t.honeypot}</label>
              <input
                id="report-website"
                name="website"
                type="text"
                tabindex="-1"
                autocomplete="off"
                bind:value={website}
              />
            </div>

            <details class="preview" bind:open={previewOpen}>
              <summary>{t.previewSummary}</summary>
              <p class="preview-line">{previewLine}</p>
              <!-- Zone défilante (16rem) : atteignable au clavier pour la lire en entier. -->
              <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
              <pre class="ink-type" tabindex="0" aria-label={t.previewSummary}>{preview}</pre>
              <p class="preview-note">{t.previewNote}</p>
            </details>

            <div class="actions">
              <Button
                type="submit"
                variant="primary"
                iconName="envelope"
                loading={sending}
                disabled={missing > 0}
                aria-describedby={missing > 0 ? 'report-missing' : undefined}
                >{sending ? t.sending : t.submit}</Button
              >
            </div>
            {#if missing > 0}
              <p id="report-missing" class="missing">
                {fill(t.descriptionMissing, { n: missing })}
              </p>
            {/if}
          </fieldset>
        </form>

        {#if failure}
          <div
            class="failure"
            bind:this={failureBox}
            tabindex="-1"
            role="group"
            aria-labelledby="report-failure"
          >
            <p id="report-failure" class="failure-lead">
              <Icon name="warning" size="1.1rem" />
              {refused(failure) ? t.failure.leadRefused : t.failure.lead}
            </p>
            <p>{reason(failure)}</p>
            <p class="help">{t.failure.help}</p>
            <div class="actions">
              <Button
                variant="secondary"
                iconName="clip"
                onclick={() => copy(copyText(), t.failure.copied)}>{t.failure.copy}</Button
              >
              <Button variant="ghost" href={FORUM_URL} rel="noreferrer" iconName="external"
                >{t.forum}</Button
              >
            </div>
            {#if copyFallback}
              <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
              <pre
                class="ink-type copy-area"
                tabindex="0"
                aria-label={t.failure.copyArea}
                onfocus={selectAll}>{copyFallback}</pre>
            {/if}
          </div>
        {/if}
      {/if}
      <p class="visually-hidden" aria-live="polite">
        {receipt ? fill(t.receipt.announce, { ticket: receipt.ticket }) : ''}
      </p>
    </div>
  </PaperSheet>

  <p class="from-game">{t.fromGame}</p>
</div>

<ToastRegion />

<style>
  .page-head {
    padding-block-end: var(--space-8);
  }
  .notice {
    margin-block-end: var(--space-6);
    padding: var(--space-4);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-s);
  }
  .sheet-body {
    display: grid;
    gap: var(--space-6);
  }
  fieldset {
    display: grid;
    gap: var(--space-6);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .contact {
    display: grid;
    gap: var(--space-2);
  }
  .privacy,
  .preview-note,
  .missing,
  .help {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .preview {
    display: grid;
    gap: var(--space-3);
  }
  .preview summary {
    display: flex;
    align-items: center;
    min-block-size: var(--hit);
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    cursor: pointer;
    border-radius: var(--radius-s);
  }
  .preview-line {
    margin-block: var(--space-2);
    font-family: var(--font-type);
    font-size: var(--step--1);
  }
  pre {
    max-block-size: 16rem;
    margin: 0;
    padding: var(--space-3);
    overflow-y: auto;
    overflow-x: hidden;
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-s);
    font-size: var(--step--1);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  .failure {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-s);
    background: var(--surface-2);
  }
  .failure-lead {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--weight-semibold);
  }
  .receipt {
    display: grid;
    justify-items: start;
    gap: var(--space-4);
  }
  .receipt h2 {
    font-size: var(--step-3);
  }
  .receipt h2:focus {
    outline: none;
  }
  .number {
    margin: 0;
  }
  .follow {
    display: grid;
    gap: var(--space-1);
    max-inline-size: 100%;
  }
  .follow .label {
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .url {
    font-size: var(--step--1);
    overflow-wrap: anywhere;
  }
  .from-game {
    margin-block-start: var(--space-6);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
</style>
