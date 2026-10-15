<!--
  « Signaler un problème » (DESIGN §13.8, ARCHITECTURE §8) : formulaire de l'Office sur papier.
  Chargé à la demande (jamais au premier affichage). Catégorie, description, contact facultatif,
  sauvegarde anonymisée sur case cochée ; aperçu du JSON **réel** envoyé. Reçu : tampon, numéro,
  lien de suivi, référence gardée dans le profil (« Mes signalements »). Échec (hors ligne, 503,
  429, délai) : « Copier le rapport » et « Forum itch.io », sans jamais perdre le texte saisi.
-->
<script lang="ts">
  import {
    REPORT_CATEGORIES,
    REPORT_LIMITS,
    SaveStateSchema,
    type ReportCategory,
    type ReportReceipt,
    type SaveState,
  } from '@arbre/contract';
  import {
    Button,
    Dialog,
    DymoLabel,
    Icon,
    LANGUAGE_NAMES,
    Select,
    Stamp,
    TextField,
    Toggle,
    pushToast,
  } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { version } from '../../package.json';
  import { edition as builtEdition } from '../generated/cases';
  import { intlLocale, messages } from '../i18n/index.svelte';
  import { announcer } from '../lib/game/announcer.svelte';
  import type { ReportRequest } from '../lib/game/app.svelte';
  import { getApp } from '../lib/game/context';
  import { initialFocus } from '../lib/game/initial-focus';
  import { copyText, openLink } from '../lib/report/actions';
  import { anonymiseSave } from '../lib/report/anonymise';
  import { FORUM_URL, followUrlFor, submitReport, type ApiFailure } from '../lib/report/client';
  import {
    addReportRef,
    buildSubmission,
    formatDelay,
    gameDiagnostics,
    missingChars,
    refSummary,
    reportText,
  } from '../lib/report/diagnostics';

  interface Props {
    request: ReportRequest;
  }
  let { request }: Props = $props();
  const app = getApp();
  const m = messages.bugReport;

  /**
   * Texte de départ : le brouillon d'un formulaire fermé sans envoi, sinon (écran d'erreur) le
   * code et le message de l'erreur ; toujours modifiable par le joueur.
   */
  function initialDraft() {
    return request.error ? null : app.reportDraft;
  }
  const draft = initialDraft();
  function initialDescription(): string {
    const e = request.error;
    return e ? m.errorPrefill(e.code, e.message) : (draft?.description ?? '');
  }

  let open = $state(true);
  let category = $state<ReportCategory>(draft?.category ?? 'bug');
  let description = $state(initialDescription());
  let contact = $state(draft?.contact ?? '');
  /** Pot de miel : un humain ne le voit pas, il reste vide. */
  let website = $state('');
  let attach = $state(false);
  let phase = $state<'form' | 'sending' | 'sent'>('form');
  let receipt = $state.raw<ReportReceipt | null>(null);
  let failure = $state.raw<ApiFailure | null>(null);
  let copyFallback = $state(false);

  const openedAt = Date.now();
  /** Instant et fenêtre de l'aperçu (relus à chaque saisie, à l'ouverture de l'aperçu). */
  let now = $state(Date.now());
  let screen = $state(readScreen());

  function readScreen() {
    return typeof window === 'undefined'
      ? { w: 0, h: 0, dpr: 1 }
      : { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 };
  }
  function refresh() {
    now = Date.now();
    screen = readScreen();
  }

  // Sauvegarde à joindre : la partie en cours, sinon la dernière partie enregistrée.
  let storedSave = $state.raw<SaveState | null>(null);
  onMount(() => {
    const last = app.lastSave;
    if (app.game || !last) return;
    let alive = true;
    app.saveStore.load(last.slot, last.caseId ?? undefined).then(
      (raw) => {
        const parsed = SaveStateSchema.safeParse(raw);
        if (alive && parsed.success) storedSave = parsed.data as SaveState;
      },
      () => undefined,
    );
    return () => {
      alive = false;
    };
  });
  const sourceSave = $derived<SaveState | null>(app.game ? app.game.state : storedSave);
  const anonymised = $derived(attach && sourceSave ? anonymiseSave(sourceSave) : null);

  const categoryOptions = $derived(
    REPORT_CATEGORIES.map((c) => ({ value: c, label: m.categories[c] })),
  );
  const missing = $derived(missingChars(description));

  const submission = $derived.by(() => {
    const game = app.game?.content;
    const joined = attach ? sourceSave : null;
    const diagnostics = gameDiagnostics({
      appVersion: version,
      edition: game?.edition ?? joined?.edition ?? builtEdition,
      platform: app.platform?.kind ?? 'web',
      userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
      locale: app.lang,
      width: screen.w,
      height: screen.h,
      dpr: screen.dpr,
      caseId: game?.id ?? joined?.caseId,
      contentHash: game?.contentHash ?? joined?.contentHash,
      settings: app.settings,
      save: anonymised?.save,
    });
    return buildSubmission({
      category,
      description,
      contact,
      locale: app.lang,
      diagnostics,
      website,
      elapsedMs: now - openedAt,
    });
  });
  const preview = $derived(JSON.stringify(submission, null, 2));

  /** Ligne lisible au-dessus de l'aperçu : « Version 1.1.0 · Démo · Android · English · … ». */
  const previewLine = $derived.by(() => {
    const d = submission.diagnostics;
    const caseTitle = d.caseId ? app.findCase(d.caseId)?.content.meta.title : undefined;
    return [
      messages.menu.version(d.appVersion),
      messages.newGame.edition(d.edition),
      m.platforms[app.platform?.kind ?? 'web'],
      LANGUAGE_NAMES[d.locale].name,
      caseTitle ?? d.caseId,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  const saveNote = $derived.by(() => {
    if (!attach) return null;
    if (!sourceSave) return m.attachSaveNone;
    if (!anonymised) return m.saveTooLarge;
    const parts = [m.saveStripped(anonymised.notes, anonymised.queries)];
    if (anonymised.trimmedSearches > 0 || anonymised.droppedHighlights > 0) {
      parts.push(m.saveTrimmed);
    }
    return parts.join(' ');
  });

  const failureText = $derived.by(() => {
    const f = failure;
    if (!f) return '';
    switch (f.kind) {
      case 'offline':
        return m.failure.offline;
      case 'timeout':
        return m.failure.timeout;
      case 'disabled':
        return m.failure.disabled;
      case 'rateLimited':
        return f.retryAfterSec !== null
          ? m.failure.rateLimited(formatDelay(f.retryAfterSec, intlLocale()))
          : m.failure.rateLimitedLater;
      case 'invalid':
        return m.failure.invalid;
      case 'tooLarge':
        return m.failure.tooLarge;
      default:
        return m.failure.unavailable;
    }
  });
  const refused = $derived(failure?.kind === 'invalid' || failure?.kind === 'tooLarge');
  const followUrl = $derived(receipt ? followUrlFor(receipt.token, app.lang) : '');
  const copyable = $derived(
    reportText(submission, m.text, m.categories[submission.category] ?? submission.category),
  );

  async function send() {
    if (missing > 0 || phase !== 'form') return;
    refresh();
    const body = $state.snapshot(submission);
    phase = 'sending';
    failure = null;
    copyFallback = false;
    const res = await submitReport(body);
    if (res.ok) {
      receipt = res.value;
      phase = 'sent';
      app.setReports(
        addReportRef(app.reports, {
          ticket: res.value.ticket,
          token: res.value.token,
          createdAt: Date.now(),
          summary: refSummary(m.categories[body.category], body.description),
        }),
      );
      announcer.say(m.receipt.announce(res.value.ticket));
      return;
    }
    phase = 'form';
    failure = res.failure;
    pushToast({ tone: 'warning', title: m.failure.toast, message: failureText });
  }

  async function copyReport() {
    if (await copyText(copyable)) {
      copyFallback = false;
      pushToast({ tone: 'success', title: m.failure.copied, timeout: 3000 });
    } else {
      copyFallback = true;
    }
  }

  function selectAll(node: HTMLTextAreaElement) {
    node.focus();
    node.select();
  }

  /** Fermé sans envoi : le texte saisi est gardé pour la prochaine ouverture (session). */
  function closed() {
    app.reportDraft =
      phase === 'sent' || missingChars(description) === REPORT_LIMITS.descriptionMin
        ? null
        : { category, description, contact };
    app.closeReport();
  }

  function showMine() {
    open = false;
    app.openMyReports();
  }
</script>

<Dialog
  bind:open
  title={m.entry}
  kicker={m.kicker}
  surface="paper"
  size="l"
  mobile="fullscreen"
  dismissible={false}
  onclose={closed}
>
  {#if phase === 'sent' && receipt}
    <div class="receipt" use:initialFocus={'.open-follow button, .open-follow a'}>
      <h3 class="receipt-title">{m.receipt.title}</h3>
      <div class="stamp" aria-hidden="true">
        <Stamp text={m.receipt.stamp} size="l" rotate={-8} animate />
      </div>
      <p class="number">
        <span class="caps">{m.receipt.number}</span>
        <DymoLabel text={receipt.ticket} tone="red" tilt={-1.5} />
      </p>
      <p>{m.receipt.keep}</p>
      <p class="follow">
        <span class="caps">{m.receipt.followLabel}</span>
        <span class="ink-type url">{followUrl}</span>
      </p>
      <div class="open-follow">
        <Button
          variant="secondary"
          iconName="external"
          onclick={() => openLink(app.platform, followUrl)}>{m.receipt.open}</Button
        >
        <Button variant="ghost" iconName="list" onclick={showMine}>{m.mine}</Button>
      </div>
    </div>
  {:else}
    <form
      class="form"
      novalidate
      oninput={refresh}
      onsubmit={(e) => e.preventDefault()}
      use:initialFocus={'select'}
    >
      <Select label={m.categoryLabel} options={categoryOptions} bind:value={category} />
      <div class="description">
        <TextField
          label={m.descriptionLabel}
          multiline
          rows={4}
          maxlength={REPORT_LIMITS.descriptionMax}
          hint={m.descriptionHint}
          bind:value={description}
        />
        {#if missing > 0}
          <p id="report-missing" class="missing">{m.descriptionMissing(missing)}</p>
        {/if}
      </div>
      <TextField
        label={m.contactLabel}
        maxlength={REPORT_LIMITS.contact}
        hint={m.contactHint}
        autocomplete="off"
        bind:value={contact}
      />
      <Toggle
        label={m.attachSave}
        description={m.attachSaveHint}
        showState
        bind:checked={attach}
        onchange={refresh}
      />
      {#if saveNote}<p class="note" role="status">{saveNote}</p>{/if}

      <!-- Pot de miel (anti-robot) : hors écran, hors tabulation, ignoré des lecteurs d'écran. -->
      <div class="visually-hidden" aria-hidden="true">
        <label for="report-website">{m.honeypot}</label>
        <input
          id="report-website"
          name="website"
          type="text"
          tabindex="-1"
          autocomplete="off"
          bind:value={website}
        />
      </div>

      <details class="preview" ontoggle={refresh}>
        <summary>{m.previewSummary}</summary>
        <p class="preview-line">{previewLine}</p>
        <!-- Zone défilante (16rem) : atteignable au clavier pour la lire en entier. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre class="ink-type json" tabindex="0" aria-label={m.previewSummary}>{preview}</pre>
        <p class="note">{m.previewNote}</p>
      </details>

      {#if failure}
        <div class="failure" role="alert">
          <p class="lead">
            <Icon name="warning" />
            {refused ? m.failure.leadRefused : m.failure.lead}
          </p>
          <p>{failureText}</p>
          <p class="note">{m.failure.help}</p>
          <div class="row">
            <Button variant="secondary" iconName="list" onclick={copyReport}
              >{m.failure.copy}</Button
            >
            <Button
              variant="ghost"
              iconName="external"
              onclick={() => openLink(app.platform, FORUM_URL)}>{m.failure.forum}</Button
            >
          </div>
          {#if copyFallback}
            <label class="copy-area">
              <span>{m.failure.copyFailed}</span>
              <textarea readonly rows="8" aria-label={m.failure.copyArea} use:selectAll
                >{copyable}</textarea
              >
            </label>
          {/if}
        </div>
      {/if}
    </form>
  {/if}

  {#snippet actions()}
    {#if phase === 'sent'}
      <Button variant="primary" onclick={() => (open = false)}>{messages.close}</Button>
    {:else}
      <Button variant="ghost" onclick={() => (open = false)}>{messages.cancel}</Button>
      <Button
        variant="primary"
        iconName="envelope"
        loading={phase === 'sending'}
        disabled={missing > 0}
        aria-describedby={missing > 0 ? 'report-missing' : undefined}
        onclick={() => void send()}>{failure ? messages.retry : m.submit}</Button
      >
    {/if}
  {/snippet}
</Dialog>

<style>
  .form,
  .receipt {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }
  .description {
    display: grid;
    gap: var(--space-1);
  }
  .missing,
  .note {
    margin: 0;
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .preview {
    min-inline-size: 0;
  }
  .preview summary {
    display: flex;
    align-items: center;
    min-block-size: var(--hit);
    cursor: pointer;
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    font-size: var(--step--1);
  }
  .preview summary:focus-visible,
  .json:focus-visible,
  .copy-area textarea:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .preview-line {
    margin: var(--space-2) 0;
    font-size: var(--step--1);
  }
  .json {
    max-block-size: 16rem;
    overflow-x: hidden;
    overflow-y: auto;
    margin: 0;
    padding: var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-xs);
    font-size: var(--step--1);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .failure {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--radius-xs);
    background: var(--surface-2);
  }
  .failure p {
    margin: 0;
  }
  .lead {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    color: var(--warning);
    font-weight: var(--weight-medium);
  }
  .row,
  .open-follow {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .copy-area {
    display: grid;
    gap: var(--space-1);
    font-size: var(--step--1);
  }
  .copy-area textarea {
    inline-size: 100%;
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text);
    background: var(--surface-1);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-xs);
    padding: var(--space-2);
  }
  .receipt p {
    margin: 0;
  }
  .receipt-title {
    margin: 0;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-2);
    line-height: var(--leading-display);
  }
  .stamp {
    display: flex;
    justify-content: center;
    min-block-size: 5rem;
    align-items: center;
  }
  .number,
  .follow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
  }
  .caps {
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .url {
    overflow-wrap: anywhere;
    user-select: all;
  }
</style>
