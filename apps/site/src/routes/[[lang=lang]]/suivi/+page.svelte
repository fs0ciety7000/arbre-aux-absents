<!--
  Fiche de suivi d'un signalement (DESIGN §14.6, §9.36 ; ARCHITECTURE §8, D10). Le jeton est dans
  le fragment (`/suivi/#<jeton>`) : jamais envoyé au serveur du site, retiré de l'historique dès
  la lecture (`history.replaceState`), envoyé au service seulement dans `Authorization: Bearer`.
  Réponses de l'équipe rendues en texte brut (jamais de HTML). Aucun Referer (nginx + meta).
-->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    Button,
    Dialog,
    DymoLabel,
    Loader,
    Panel,
    PaperSheet,
    TicketStatus,
    ToastRegion,
    pushToast,
  } from '@arbre/ui';
  import type { TicketView } from '@arbre/contract';
  import Seo from '#lib/components/Seo.svelte';
  import { localHref } from '#lib/i18n/app';
  import { deleteTicket, getTicket, tokenFromHash, type ApiFailure } from '#lib/report/client';
  import { FORUM_URL } from '#lib/report/config';
  import { fill, formatDate, formatDelay } from '#lib/report/payload';
  import type { PageProps } from './$types';

  // Page hydratée : les textes arrivent par `data` (une langue), jamais par les catalogues.
  let { data }: PageProps = $props();
  const t = $derived(data.t);
  const lang = $derived(data.lang);

  type State =
    | { kind: 'boot' }
    | { kind: 'loading' }
    | { kind: 'missing' }
    | { kind: 'notFound' }
    | { kind: 'error'; failure: ApiFailure }
    | { kind: 'ready'; ticket: TicketView }
    | { kind: 'deleted' };

  let view = $state<State>({ kind: 'boot' });
  /** Jeton gardé en mémoire seulement (ni URL, ni stockage). */
  let token: string | null = null;
  let confirmOpen = $state(false);
  let deleting = $state(false);
  let heading: HTMLElement | undefined = $state();

  async function load() {
    if (!token) {
      view = { kind: 'missing' };
      return;
    }
    view = { kind: 'loading' };
    const result = await getTicket(token);
    if (result.ok) view = { kind: 'ready', ticket: result.value };
    else if (result.failure.kind === 'notFound') view = { kind: 'notFound' };
    else view = { kind: 'error', failure: result.failure };
  }

  /** Lit le jeton du fragment, puis l'efface de la barre d'adresse et de l'historique. */
  function readHash() {
    token = tokenFromHash(location.hash);
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    void load();
  }

  onMount(readHash);

  // Lien de suivi ouvert alors que la page est déjà affichée (seul le fragment change). Les
  // ancres de la page (lien d'évitement `#contenu`) ne sont pas des jetons : on les laisse.
  function onhashchange() {
    if (tokenFromHash(location.hash)) readHash();
  }

  // Le focus suit les changements d'état (suppression, erreur) : sur le titre de la fiche.
  $effect(() => {
    if (view.kind === 'deleted' || view.kind === 'notFound' || view.kind === 'error')
      void tick().then(() => heading?.focus());
  });

  // Confirmation : focus initial sur « Garder » (DESIGN §13.9).
  $effect(() => {
    if (!confirmOpen) return;
    void tick().then(() => document.getElementById('follow-keep')?.focus());
  });

  async function remove() {
    if (!token || deleting) return;
    deleting = true;
    const result = await deleteTicket(token);
    deleting = false;
    confirmOpen = false;
    if (result.ok || result.failure.kind === 'notFound') {
      token = null;
      view = { kind: 'deleted' };
    } else {
      pushToast({ tone: 'warning', title: t.deleteFailed });
    }
  }

  const date = (at: number) => formatDate(at, lang);

  function errorText(f: ApiFailure): string {
    if (f.kind === 'rateLimited' && f.retryAfterSec !== null) {
      return fill(t.error.rateLimited, { delay: formatDelay(f.retryAfterSec, lang) });
    }
    return f.kind === 'offline' ? t.error.offline : t.error.text;
  }
</script>

<svelte:window {onhashchange} />

<svelte:head>
  <!-- Le jeton est dans le fragment : aucun Referer, page hors des moteurs (pages.ts). -->
  <meta name="referrer" content="no-referrer" />
  <meta name="robots" content="noindex" />
</svelte:head>

<Seo title={data.seo.title} description={data.seo.description} path="suivi/" />

<header class="container-narrow page-head">
  <p class="kicker">{t.kicker}</p>
  <h1>{t.title}</h1>
</header>

<div class="container-narrow">
  <noscript>
    <p class="notice">
      {t.noscript}
      <a href={FORUM_URL} rel="external noreferrer">{t.forum}</a>
    </p>
  </noscript>

  {#if view.kind === 'boot'}
    <!-- Prérendu : rien à montrer avant la lecture du fragment. -->
  {:else if view.kind === 'loading'}
    <div class="loading"><Loader label={t.loading} showLabel /></div>
  {:else if view.kind === 'ready'}
    {@const ticket = view.ticket}
    <PaperSheet tone="paper" fastener="pin" as="article">
      <div class="sheet-body">
        <header class="ticket-head">
          <p class="number">
            <span class="visually-hidden">{t.ticketLabel}</span>
            <DymoLabel text={ticket.ticket} tone="red" tilt={-1.5} />
          </p>
          <p class="ink-type meta">
            {data.categories[ticket.category]} · {fill(t.created, { date: date(ticket.createdAt) })}
            {#if ticket.updatedAt > ticket.createdAt}
              · {fill(t.updated, { date: date(ticket.updatedAt) })}
            {/if}
          </p>
        </header>

        <TicketStatus
          status={ticket.status}
          fixedIn={ticket.fixedIn}
          closedReason={ticket.closedReason}
          animate
        />

        <section class="replies" aria-labelledby="follow-replies">
          <h2 id="follow-replies">{t.repliesHeading}</h2>
          {#if ticket.replies.length === 0}
            <p class="muted">{t.noReplies}</p>
          {:else}
            <ol>
              {#each ticket.replies as reply, i (i)}
                <li>
                  <PaperSheet tone="new" tilt={i % 2 ? 0.6 : -0.6} as="figure">
                    <p class="ink-type reply-date">{fill(t.replyDate, { date: date(reply.at) })}</p>
                    <!-- Texte brut : aucune interprétation HTML ni Markdown. -->
                    <blockquote class="reply">{reply.text}</blockquote>
                  </PaperSheet>
                </li>
              {/each}
            </ol>
          {/if}
        </section>

        <footer class="ticket-foot">
          <p class="muted note">{t.tokenNote}</p>
          <Button variant="ghost" href={localHref(lang, 'tickets/')}>{t.ticketsLink}</Button>
          <Button variant="danger" iconName="trash" onclick={() => (confirmOpen = true)}
            >{t.delete}</Button
          >
        </footer>
      </div>
    </PaperSheet>

    <Dialog bind:open={confirmOpen} title={t.confirm.title} surface="paper" size="s">
      <p>{t.confirm.text}</p>
      {#snippet actions()}
        <Button id="follow-keep" variant="secondary" onclick={() => (confirmOpen = false)}
          >{t.confirm.keep}</Button
        >
        <Button variant="danger" iconName="trash" loading={deleting} onclick={remove}
          >{deleting ? t.deleting : t.confirm.confirm}</Button
        >
      {/snippet}
    </Dialog>
  {:else}
    {@const panel =
      view.kind === 'deleted'
        ? t.deleted
        : view.kind === 'notFound'
          ? t.notFound
          : view.kind === 'missing'
            ? t.missing
            : { title: t.error.title, text: errorText(view.failure) }}
    <Panel title={panel.title} surface="paper" as="section" scroll={false}>
      <div class="state">
        <p bind:this={heading} tabindex="-1">{panel.text}</p>
        <div class="actions">
          {#if view.kind === 'error'}
            <Button variant="primary" onclick={load}>{t.error.retry}</Button>
            <Button variant="ghost" href={FORUM_URL} rel="noreferrer" iconName="external"
              >{t.forum}</Button
            >
          {:else}
            <Button variant="primary" href={localHref(lang, 'signaler/')} iconName="envelope"
              >{t.reportLink}</Button
            >
            <Button variant="ghost" href={localHref(lang, 'problemes-connus/')}
              >{t.knownLink}</Button
            >
            <Button variant="ghost" href={localHref(lang, 'tickets/')}>{t.ticketsLink}</Button>
          {/if}
        </div>
      </div>
    </Panel>
  {/if}
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
  .loading {
    display: flex;
    justify-content: center;
    padding-block: var(--space-12);
  }
  .sheet-body {
    display: grid;
    gap: var(--space-8);
    container-type: inline-size;
  }
  .ticket-head {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
  }
  .number {
    margin: 0;
  }
  .meta {
    font-size: var(--step--1);
  }
  .replies {
    display: grid;
    gap: var(--space-4);
  }
  .replies h2 {
    font-size: var(--step-2);
  }
  .replies ol {
    display: grid;
    gap: var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .reply-date {
    margin-block-end: var(--space-2);
    font-size: var(--step--1);
  }
  .reply {
    margin: 0;
    font-family: var(--font-read);
    font-size: var(--step-read);
    line-height: var(--leading-read);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .ticket-foot {
    display: grid;
    justify-items: start;
    gap: var(--space-4);
    padding-block-start: var(--space-4);
    border-block-start: var(--border) dashed var(--line-strong);
  }
  .muted {
    color: var(--text-muted);
  }
  .note {
    font-size: var(--step--1);
  }
  .state {
    display: grid;
    gap: var(--space-4);
  }
  .state p:focus {
    outline: none;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
</style>
