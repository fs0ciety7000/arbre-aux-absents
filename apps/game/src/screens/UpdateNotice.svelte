<script lang="ts">
  import { Badge, Button, Icon } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { notesFor } from '../platform/update';
  import { messages } from '../messages.fr';

  /**
   * Invite de mise à jour (D18, DESIGN §13.12) : fiche non bloquante de l'écran titre (`title`)
   * ou bloc d'Options › Données (`options`, sans « Plus tard »). Jamais de focus volé : le joueur
   * y arrive au clavier ou à la manette comme au reste du menu.
   */
  interface Props {
    variant?: 'title' | 'options';
  }
  let { variant = 'title' }: Props = $props();

  const app = getApp();
  const u = app.updates;
  const m = $derived(messages.update);
  const offer = $derived(u.offer);
  const notes = $derived(offer ? notesFor(offer.notes, app.lang) : null);
  const pct = $derived(u.progress === null ? null : Math.round(u.progress * 100));
  const heading = $derived(
    !offer ? '' : offer.action === 'install' ? m.title(offer.version) : m.titleDownload,
  );
  const hint = $derived(
    !offer
      ? ''
      : offer.action === 'install'
        ? m.installHint
        : offer.url?.endsWith('.apk')
          ? m.downloadHint
          : m.linkHint,
  );
  /** Une partie est ouverte (Options depuis la pause) : rien ne s'installe d'ici. */
  const inGame = $derived(app.game !== null);
  const headingId = $derived(`update-${variant}`);
</script>

{#if offer}
  <section
    class="update"
    class:in-options={variant === 'options'}
    class:mv-rise={variant === 'title'}
    style:--i="9"
    aria-labelledby={headingId}
    data-testid="update-notice"
  >
    <p class="kicker">
      <Badge tone="accent" variant="solid" iconName="sparkle">{m.kicker}</Badge>
    </p>
    <h2 id={headingId} class="title">{heading}</h2>
    {#if offer.action === 'download'}
      <p class="version num">{m.versionDetail(offer.version)}</p>
    {/if}
    {#if notes}
      <details class="notes">
        <summary>{m.notesLabel}</summary>
        <p class="notes-text">{notes}</p>
      </details>
    {/if}

    {#if u.busy}
      <div class="progress" role="status">
        <span>{u.status === 'installing' ? m.installing : m.downloading(pct)}</span>
        <progress
          max="100"
          value={u.status === 'installing' ? 100 : (pct ?? undefined)}
          aria-label={m.progressLabel}
        ></progress>
      </div>
    {:else if variant === 'options' && inGame && offer.action === 'install'}
      <p class="hint">{m.inGame}</p>
    {:else}
      <p class="hint">{hint}</p>
      <div class="actions">
        <Button
          variant="primary"
          iconName={offer.action === 'install' ? 'sparkle' : 'external'}
          onclick={() => void u.apply(() => app.saveProfile())}
          >{offer.action === 'install' ? m.install : m.download}</Button
        >
        {#if variant === 'title'}
          <Button variant="ghost" onclick={() => u.later()}>{m.later}</Button>
        {/if}
      </div>
    {/if}
    {#if u.error === 'install' || u.error === 'open'}
      <p class="error" role="alert">
        <Icon name="danger" />
        {u.error === 'install' ? m.failedInstall : m.failedOpen}
      </p>
    {/if}
  </section>
{/if}

<style>
  .update {
    display: grid;
    gap: var(--space-2);
    max-width: 24rem;
    padding: var(--space-4);
    border: 1px solid var(--line-strong);
    border-inline-start: 3px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--surface-2);
    box-shadow: var(--shadow-2);
    color: var(--text);
  }
  .update.in-options {
    max-width: none;
    box-shadow: none;
  }
  .kicker,
  .title,
  .version,
  .hint,
  .error {
    margin: 0;
  }
  .title {
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: var(--weight-medium);
    line-height: 1.2;
  }
  .version {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .notes summary {
    display: flex;
    align-items: center;
    min-block-size: var(--hit);
    color: var(--accent);
    cursor: pointer;
  }
  .notes summary:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  /* Texte brut des notes (aucun HTML interprété), retours à la ligne conservés. */
  .notes-text {
    margin: 0;
    max-block-size: 12rem;
    overflow-y: auto;
    font-family: var(--font-read);
    font-size: var(--step--1);
    white-space: pre-line;
    color: var(--text-muted);
  }
  .hint {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .progress {
    display: grid;
    gap: var(--space-1);
    font-size: var(--step--1);
  }
  progress {
    inline-size: 100%;
    block-size: var(--space-2);
    accent-color: var(--accent);
  }
  .error {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    color: var(--danger);
  }
</style>
