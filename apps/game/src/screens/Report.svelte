<!--
  « Signaler un problème » (DESIGN §13.8, ARCHITECTURE §8) : formulaire de l'Office sur papier.
  Chargé à la demande (jamais au premier affichage). Catégorie, description, contact facultatif,
  sauvegarde anonymisée sur case cochée ; aperçu du JSON **réel** envoyé. Reçu : tampon, numéro,
  lien de suivi, référence gardée dans le profil (« Mes signalements »). Échec (hors ligne, 503,
  429, délai) : « Copier le rapport » et « Forum itch.io », sans jamais perdre le texte saisi.
  Description en Markdown (barre d'outils, aperçu, DESIGN §9.37) ; captures d'écran (fichier,
  collage, dépôt ; envoyées une à une avant le signalement, §9.38) ; « Informations envoyées ».
  Pas de capture automatique de l'écran du jeu : aucun moyen léger et fiable (DESIGN §13.8).
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
    AttachmentTray,
    Button,
    Dialog,
    DymoLabel,
    Icon,
    LANGUAGE_NAMES,
    MarkdownField,
    Select,
    Stamp,
    TextField,
    Toggle,
    imageFiles,
    pushToast,
    type AttachmentItem,
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
  import {
    LIMITS as ATTACHMENTS,
    createAttachmentQueue,
    missingAttachments,
  } from '../lib/report/attachments';
  import { FORUM_URL, followUrlFor, submitReport, type ApiFailure } from '../lib/report/client';
  import {
    addReportRef,
    buildSubmission,
    fitSubmission,
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
  /** Captures d'écran : file d'envoi (une requête par image, avant le signalement). */
  let attachments = $state.raw<AttachmentItem[]>([]);
  let tray: ReturnType<typeof AttachmentTray> | undefined = $state();
  /** Captures envoyées mais absentes du reçu (expirées ou refusées entre-temps). */
  let attachmentsMissing = $state(0);
  const queue = createAttachmentQueue({
    website: () => website,
    onchange: (items) => (attachments = items),
  });
  const attachmentIds = $derived(
    attachments.flatMap((a) => (a.status === 'ready' && a.receipt ? [a.receipt.id] : [])),
  );
  const uploading = $derived(
    attachments.some((a) => a.status === 'preparing' || a.status === 'uploading'),
  );
  // Formulaire refermé sans envoi : les captures déjà envoyées sont supprimées du service.
  onMount(() => () => queue.dispose(phase !== 'sent'));

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

  /** Corps borné en octets UTF-8 : sauvegarde retirée si elle fait dépasser 64 Ko. */
  const fitted = $derived.by(() => {
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
    return fitSubmission(
      buildSubmission({
        category,
        description,
        contact,
        locale: app.lang,
        diagnostics,
        website,
        elapsedMs: now - openedAt,
        attachments: attachmentIds,
      }),
    );
  });
  const submission = $derived(fitted.submission);
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

  /** « Informations envoyées » : ce qui part avec le signalement, en clair. */
  const sentInfo = $derived.by(() => {
    const d = submission.diagnostics;
    const s = m.sentInfo;
    return [
      { label: s.version, value: `${d.appVersion} · ${messages.newGame.edition(d.edition)}` },
      { label: s.platform, value: m.platforms[app.platform?.kind ?? 'web'] },
      { label: s.os, value: d.os ?? s.unknown },
      { label: s.browser, value: d.browser ?? s.unknown },
      { label: s.language, value: LANGUAGE_NAMES[d.locale].name },
      { label: s.screen, value: `${d.viewport.w} × ${d.viewport.h}` },
    ];
  });

  const saveNote = $derived.by(() => {
    if (!attach) return null;
    if (!sourceSave) return m.attachSaveNone;
    if (!anonymised) return m.saveTooLarge;
    if (fitted.saveDropped) return m.saveDroppedForSize;
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
    if (missing > 0 || uploading || phase !== 'form') return;
    phase = 'sending';
    failure = null;
    copyFallback = false;
    // Captures expirées (plus d'une heure) ou sur le point de l'être : renvoyées d'abord.
    if (attachments.length) await queue.fresh();
    refresh();
    const body = $state.snapshot(submission);
    const res = await submitReport(body);
    if (res.ok) {
      receipt = res.value;
      attachmentsMissing = missingAttachments(body.attachments?.length ?? 0, res.value.attachments);
      phase = 'sent';
      queue.clear();
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

  /** Une image collée (capture d'écran) est jointe ; du texte se colle normalement. */
  function onpaste(e: ClipboardEvent) {
    const files = imageFiles(e.clipboardData);
    if (files.length === 0) return;
    if (!Array.from(e.clipboardData?.types ?? []).includes('text/plain')) e.preventDefault();
    tray?.addFiles(files);
  }

  function selectAll(node: HTMLTextAreaElement) {
    node.focus();
    node.select();
  }

  /** Fermé sans envoi : le texte saisi est gardé pour la prochaine ouverture (session). */
  function closed() {
    queue.dispose(phase !== 'sent');
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
      {#if attachmentsMissing > 0}
        <p class="note warn" role="status">
          <Icon name="warning" />
          {m.receipt.attachmentsMissing(attachmentsMissing)}
        </p>
      {/if}
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
      {onpaste}
      onsubmit={(e) => e.preventDefault()}
      use:initialFocus={'select'}
    >
      <Select label={m.categoryLabel} options={categoryOptions} bind:value={category} />
      <div class="description">
        <MarkdownField
          id="report-description"
          label={m.descriptionLabel}
          rows={5}
          maxlength={REPORT_LIMITS.descriptionMax}
          hint={m.descriptionHint}
          describedby={missing > 0 ? 'report-missing' : undefined}
          bind:value={description}
        />
        {#if missing > 0}
          <p id="report-missing" class="missing">{m.descriptionMissing(missing)}</p>
        {/if}
        {#if uploading}
          <p id="report-busy" class="missing">{m.attachmentsBusy}</p>
        {/if}
      </div>
      <AttachmentTray
        bind:this={tray}
        items={attachments}
        max={ATTACHMENTS.max}
        disabled={phase === 'sending'}
        onadd={(files) => queue.add(files)}
        onremove={(key) => queue.remove(key)}
        onretry={(key) => queue.retry(key)}
      />
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

      <section class="sent-info" aria-labelledby="report-sent-info">
        <h3 id="report-sent-info" class="caps">{m.sentInfo.title}</h3>
        <dl>
          {#each sentInfo as row (row.label)}
            <div>
              <dt>{row.label}</dt>
              <dd class="ink-type">{row.value}</dd>
            </div>
          {/each}
        </dl>
      </section>

      <details class="preview" ontoggle={refresh}>
        <summary>{m.previewSummary}</summary>
        <p class="preview-line">{previewLine}</p>
        <!-- Zone défilante (16rem) : atteignable au clavier pour la lire en entier. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre class="ink-type json" tabindex="0" aria-label={m.previewSummary}>{preview}</pre>
        {#if fitted.saveDropped}<p class="note">{m.saveDroppedForSize}</p>{/if}
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
        disabled={missing > 0 || uploading}
        aria-describedby={missing > 0 ? 'report-missing' : uploading ? 'report-busy' : undefined}
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
  .sent-info {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-xs);
  }
  .sent-info h3 {
    margin: 0;
    font-weight: var(--weight-medium);
  }
  .sent-info dl {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
    gap: var(--space-1) var(--space-4);
    margin: 0;
    font-size: var(--step--1);
  }
  .sent-info dl > div {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--space-2);
    min-inline-size: 0;
  }
  .sent-info dt {
    color: var(--text-muted);
  }
  .sent-info dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .warn {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
    color: var(--text);
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
