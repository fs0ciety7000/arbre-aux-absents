<!--
  Tickets ouverts (DESIGN §14.6 ; ARCHITECTURE §8) : registre public lu au chargement depuis
  GET /v1/tickets. Une ligne par ticket ouvert (numéro, sujet, catégorie, source, dates, tampon du
  statut) sur une feuille de registre ; jamais le texte du joueur : le sujet est le titre relu par
  l'équipe s'il est public, sinon la catégorie. Chargement, liste vide, erreur, hors ligne et 429
  traités ; sans JS, le `<noscript>` renvoie vers le forum itch.io.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Loader, PaperSheet, Stamp, UI_STRINGS } from '@arbre/ui';
  import type { OpenTicket, OpenTicketStatus } from '@arbre/contract';
  import Seo from '#lib/components/Seo.svelte';
  import { localHref } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import { getOpenTickets, type ApiFailure } from '#lib/report/client';
  import { FORUM_URL } from '#lib/report/config';
  import { LIMITS, OPEN_STATUSES } from '#lib/report/constants';
  import { fill, formatDate, formatDelay } from '#lib/report/payload';
  import type { PageProps } from './$types';

  // Page hydratée : les textes arrivent par `data` (une langue), jamais par les catalogues.
  let { data }: PageProps = $props();
  const t = $derived(data.t);
  const lang = $derived(data.lang);
  const statusText = $derived(UI_STRINGS[lang].ticket.status);

  type State =
    | { kind: 'boot' }
    | { kind: 'loading' }
    | { kind: 'error'; failure: ApiFailure }
    | { kind: 'ready'; tickets: OpenTicket[] };
  let view = $state<State>({ kind: 'boot' });

  async function load() {
    view = { kind: 'loading' };
    const result = await getOpenTickets(lang);
    view = result.ok
      ? { kind: 'ready', tickets: result.value }
      : { kind: 'error', failure: result.failure };
  }

  onMount(() => {
    void load();
  });

  function errorText(failure: ApiFailure): string {
    if (failure.kind === 'offline' || failure.kind === 'timeout') return t.offline;
    if (failure.kind === 'rateLimited' && failure.retryAfterSec !== null)
      return fill(t.rateLimited, { delay: formatDelay(failure.retryAfterSec, lang) });
    return t.error;
  }

  function countOf(tickets: OpenTicket[], status: OpenTicketStatus): number {
    return tickets.filter((x) => x.status === status).length;
  }

  const date = (at: number) => formatDate(at, lang);

  /** Ligne de métadonnées : catégorie (si un titre la remplace), source, envoi, mise à jour. */
  function metaOf(ticket: OpenTicket): string {
    return [
      ticket.title ? t.categories[ticket.category] : null,
      t.sources[ticket.source],
      fill(t.created, { date: date(ticket.createdAt) }),
      ticket.updatedAt > ticket.createdAt
        ? fill(t.updated, { date: date(ticket.updatedAt) })
        : null,
    ]
      .filter((x): x is string => x !== null)
      .join(' · ');
  }
</script>

<Seo title={data.seo.title} description={data.seo.description} path="tickets/" />

<header class="container page-head">
  <p class="kicker">{t.kicker}</p>
  <h1>{t.title}</h1>
  <p class="lede">{t.lede}</p>
  <div class="actions">
    <Button variant="secondary" href={localHref(lang, 'signaler/')} iconName="envelope"
      >{t.reportLink}</Button
    >
    <Button variant="ghost" href={localHref(lang, 'problemes-connus/')}>{t.knownLink}</Button>
  </div>
</header>

<section class="container" aria-labelledby="tickets-list">
  <h2 id="tickets-list" class="visually-hidden">{t.listLabel}</h2>
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
        <p>{errorText(view.failure)}</p>
        <div class="actions">
          <Button variant="primary" onclick={load}>{t.retry}</Button>
          <Button variant="ghost" href={FORUM_URL} rel="noreferrer" iconName="external"
            >{t.forum}</Button
          >
        </div>
      </div>
    {:else if view.kind === 'ready'}
      {@const tickets = view.tickets}
      {#if tickets.length === 0}
        <p class="state empty">{t.empty}</p>
      {:else}
        <div class="summary">
          <p class="total">
            {tickets.length === 1 ? t.countOne : fill(t.countMany, { n: tickets.length })}
          </p>
          <dl class="counts" aria-label={t.countsLabel}>
            {#each OPEN_STATUSES as status (status)}
              <div>
                <dt>{statusText[status]}</dt>
                <dd>{countOf(tickets, status)}</dd>
              </div>
            {/each}
          </dl>
          {#if tickets.length >= LIMITS.openTickets}
            <p class="muted">{fill(t.capped, { n: LIMITS.openTickets })}</p>
          {/if}
        </div>

        <PaperSheet tone="paper" as="div">
          <ol class="ledger" aria-label={t.listLabel}>
            {#each tickets as ticket, i (ticket.ticket)}
              {@const category = t.categories[ticket.category]}
              <li class="row">
                <p class="number ink-type">
                  <span class="visually-hidden">{t.ticketLabel}</span>
                  {ticket.ticket}
                </p>
                <div class="body">
                  <h3 class="subject">{ticket.title ?? category}</h3>
                  <p class="meta ink-type">{metaOf(ticket)}</p>
                </div>
                <div class="status">
                  <Stamp
                    text={statusText[ticket.status]}
                    tone="ink"
                    size="s"
                    rotate={i % 2 ? 3 : -4}
                    label={fill(t.statusLabel, { status: statusText[ticket.status] })}
                  />
                </div>
              </li>
            {/each}
          </ol>
        </PaperSheet>
      {/if}
      <p class="yours"><Rich text={t.yours} /></p>
    {/if}
  </div>
</section>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
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
  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2) var(--space-6);
    margin-block-end: var(--space-6);
  }
  .total {
    font-family: var(--font-label);
    font-size: var(--step-1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .counts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-5);
    margin: 0;
  }
  .counts div {
    display: flex;
    gap: var(--space-2);
  }
  .counts dt {
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .counts dd {
    margin: 0;
    font-family: var(--font-type);
  }
  .muted {
    color: var(--text-muted);
  }
  .ledger {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    container-type: inline-size;
  }
  .row {
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-4);
    border-block-end: var(--border) dashed var(--line-strong);
  }
  .row:last-child {
    border-block-end: 0;
  }
  .number {
    font-weight: 700;
  }
  .body {
    display: grid;
    gap: var(--space-1);
    min-inline-size: 0;
  }
  .subject {
    margin: 0;
    font-size: var(--step-1);
    overflow-wrap: anywhere;
  }
  .meta {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .status {
    justify-self: end;
  }
  /* Feuille étroite : numéro et tampon sur une ligne, le sujet dessous. */
  @container (max-width: 34rem) {
    .row {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas: 'number status' 'body body';
    }
    .number {
      grid-area: number;
    }
    .status {
      grid-area: status;
    }
    .body {
      grid-area: body;
    }
  }
  .yours {
    max-inline-size: var(--measure);
    margin-block-start: var(--space-8);
    color: var(--text-muted);
  }
</style>
