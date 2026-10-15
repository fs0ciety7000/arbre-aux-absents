<!--
  Feuille de suivi d'un signalement (DESIGN §13.9, §9.36) : frise `TicketStatus`, réponses de
  l'équipe (texte brut), « Ouvrir sur le site » et « Supprimer mon signalement » (confirmation,
  focus initial sur « Garder »). Hors ligne : la frise garde le dernier statut connu, « vu le … ».
  Introuvable (supprimé, expiré) : « Retirer de la liste ».
-->
<script lang="ts">
  import type { ReportRef, TicketView } from '@arbre/contract';
  import {
    Button,
    Dialog,
    DymoLabel,
    Icon,
    Loader,
    PaperSheet,
    TicketStatus,
    pushToast,
  } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { intlLocale, messages } from '../i18n/index.svelte';
  import { announcer } from '../lib/game/announcer.svelte';
  import { getApp } from '../lib/game/context';
  import { formatDateTime, formatDay } from '../lib/game/format';
  import { initialFocus } from '../lib/game/initial-focus';
  import { openLink } from '../lib/report/actions';
  import { deleteTicket, followUrlFor, getTicket, type ApiFailure } from '../lib/report/client';
  import { formatDelay, removeReportRef } from '../lib/report/diagnostics';
  import { forgetStatus, readStatuses, rememberStatus } from '../lib/report/status-cache';

  interface Props {
    report: ReportRef;
    onclose: () => void;
  }
  let { report, onclose }: Props = $props();
  const app = getApp();
  const m = messages.bugReport;
  const t = messages.bugReport.ticket;

  let open = $state(true);
  let loading = $state(true);
  let view = $state.raw<TicketView | null>(null);
  let failure = $state.raw<ApiFailure | null>(null);
  let confirmOpen = $state(false);
  let deleting = $state(false);
  const known = $derived(readStatuses()[report.ticket]);

  async function load() {
    loading = true;
    const res = await getTicket(report.token);
    loading = false;
    if (res.ok) {
      view = res.value;
      failure = null;
      rememberStatus(
        res.value,
        Date.now(),
        app.reports.map((r) => r.ticket),
      );
    } else {
      failure = res.failure;
    }
  }
  onMount(() => {
    void load();
  });

  const notFound = $derived(failure?.kind === 'notFound');
  const status = $derived(view ?? (notFound ? undefined : known));
  const failureText = $derived.by(() => {
    const f = failure;
    if (!f || f.kind === 'notFound') return '';
    if (f.kind === 'rateLimited' && f.retryAfterSec !== null) {
      return t.rateLimited(formatDelay(f.retryAfterSec, intlLocale()));
    }
    return t.offline;
  });

  function forget() {
    app.setReports(removeReportRef(app.reports, report.ticket));
    forgetStatus(report.ticket);
    open = false;
  }

  async function remove() {
    deleting = true;
    const res = await deleteTicket(report.token);
    deleting = false;
    if (res.ok || res.failure.kind === 'notFound') {
      confirmOpen = false;
      pushToast({ tone: 'success', title: t.deleted, timeout: 3000 });
      announcer.say(t.deleted);
      forget();
      return;
    }
    pushToast({ tone: 'warning', title: t.deleteFailed });
  }
</script>

<Dialog
  bind:open
  title={t.title(report.ticket)}
  kicker={t.kicker}
  surface="paper"
  size="m"
  mobile="fullscreen"
  {onclose}
>
  <div class="sheet" use:initialFocus={'.actions-row button'}>
    <p class="head">
      <DymoLabel text={report.ticket} tone="red" tilt={-1.5} />
      <span class="ink-type meta"
        >{view ? m.categories[view.category] : report.summary} · {m.sentOn(
          formatDay(report.createdAt),
        )}</span
      >
    </p>

    {#if status}
      <TicketStatus
        status={status.status}
        fixedIn={status.fixedIn}
        closedReason={status.closedReason}
        animate={view !== null}
      />
    {/if}

    {#if loading}
      <div class="muted"><Loader label={t.loading} showLabel delay={0} /></div>
    {:else if view}
      <p class="muted">{t.updated(formatDateTime(view.updatedAt))}</p>
    {:else if notFound}
      <p class="notice" role="status"><Icon name="info" /> {t.notFound}</p>
    {:else}
      <p class="notice" role="status">
        <Icon name="warning" />
        <span>
          {failureText}
          {#if known}<span class="muted">({t.seen(formatDay(known.seenAt))})</span>{/if}
        </span>
      </p>
      {#if !known}<p class="muted">{t.unknown}</p>{/if}
    {/if}

    {#if view}
      <section class="replies" aria-labelledby="ticket-replies">
        <h3 id="ticket-replies">{t.replies}</h3>
        {#if view.replies.length === 0}
          <p class="muted">{t.noReplies}</p>
        {:else}
          {#each view.replies as r, i (i)}
            <PaperSheet tone="new" tilt={i % 2 ? 0.4 : -0.4}>
              <p class="ink-type date">{t.replyDate(formatDateTime(r.at))}</p>
              <blockquote class="reply">{r.text}</blockquote>
            </PaperSheet>
          {/each}
        {/if}
      </section>
    {/if}

    <div class="actions-row">
      {#if notFound}
        <Button variant="secondary" iconName="trash" onclick={forget}>{t.forget}</Button>
      {:else}
        <Button
          variant="secondary"
          iconName="external"
          onclick={() => openLink(app.platform, followUrlFor(report.token, app.lang))}
          >{t.openSite}</Button
        >
        {#if failure && !loading}
          <Button variant="ghost" onclick={() => void load()}>{messages.retry}</Button>
        {/if}
        <Button variant="danger" iconName="trash" onclick={() => (confirmOpen = true)}
          >{t.remove}</Button
        >
      {/if}
    </div>
  </div>
</Dialog>

<Dialog bind:open={confirmOpen} title={t.confirmTitle} description={t.confirmText} size="s">
  {#snippet actions()}
    <span class="confirm" use:initialFocus={'button'}>
      <Button onclick={() => (confirmOpen = false)}>{t.keep}</Button>
    </span>
    <Button variant="danger" loading={deleting} onclick={() => void remove()}>{t.confirm}</Button>
  {/snippet}
</Dialog>

<style>
  .sheet {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }
  .sheet p {
    margin: 0;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
  }
  .meta {
    font-size: var(--step--1);
    overflow-wrap: anywhere;
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .notice {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
  }
  .replies {
    display: grid;
    gap: var(--space-3);
  }
  h3 {
    margin: 0;
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .date {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .reply {
    margin: var(--space-2) 0 0;
    font-family: var(--font-read);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .actions-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .confirm {
    display: contents;
  }
</style>
