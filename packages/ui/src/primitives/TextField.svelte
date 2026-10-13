<!--
	Champ de saisie (DESIGN.md §9.7) : requête du Catalogue (`typewriter`), notes
	(`multiline` + compteur), filtres. Libellé toujours visible, aide et erreur reliées.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'size'> {
    label: string;
    value?: string;
    hint?: string;
    error?: string;
    multiline?: boolean;
    rows?: number;
    /** Affiche le compteur « n / max » si défini. */
    maxlength?: number;
    variant?: 'default' | 'typewriter';
    iconName?: IconName;
    /** Libellé masqué visuellement (reste accessible). */
    hideLabel?: boolean;
    end?: Snippet;
    id?: string;
  }

  let {
    label,
    value = $bindable(''),
    hint,
    error,
    multiline = false,
    rows = 4,
    maxlength,
    variant = 'default',
    iconName,
    hideLabel = false,
    end,
    id = `field-${Math.random().toString(36).slice(2, 8)}`,
    class: className = '',
    ...rest
  }: Props = $props();

  const describedBy = $derived(
    [hint && `${id}-hint`, error && `${id}-error`, maxlength && `${id}-count`]
      .filter(Boolean)
      .join(' ') || undefined,
  );
  const count = $derived(value?.length ?? 0);
</script>

<div class="field {variant} {className}" class:invalid={Boolean(error)}>
  <label for={id} class="label" class:visually-hidden={hideLabel}>{label}</label>
  <div class="control" class:multiline>
    {#if iconName}<span class="icon"><Icon name={iconName} /></span>{/if}
    {#if multiline}
      <textarea
        {id}
        bind:value
        {rows}
        {maxlength}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        data-verb="write"
        placeholder={rest.placeholder}
        disabled={rest.disabled}
        required={rest.required}
        name={rest.name}></textarea>
    {:else}
      <input
        {...rest}
        {id}
        bind:value
        {maxlength}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        data-verb="write"
      />
    {/if}
    {#if end}<span class="end">{@render end()}</span>{/if}
  </div>
  <div class="below">
    {#if error}
      <p id="{id}-error" class="error"><Icon name="warning" size="1rem" /> {error}</p>
    {:else if hint}
      <p id="{id}-hint" class="hint">{hint}</p>
    {/if}
    {#if maxlength}
      <p id="{id}-count" class="count num" aria-live="polite">
        <span class="visually-hidden">Caractères : </span>{count} / {maxlength}
      </p>
    {/if}
  </div>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  .label {
    font-size: var(--step-0);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }
  .control {
    position: relative;
    display: flex;
    align-items: center;
    min-height: var(--hit);
    background: var(--surface-2);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-inset);
  }
  .control:has(:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  /* v2 : au focus, un trait d'encre se tire sous le champ (de gauche à droite) */
  .control::after {
    content: '';
    position: absolute;
    inset-inline: var(--space-2);
    inset-block-end: 3px;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--dur-slow) var(--ease-ink);
    pointer-events: none;
  }
  .control:focus-within::after {
    transform: scaleX(1);
  }
  .multiline {
    align-items: stretch;
  }
  input,
  textarea {
    flex: 1;
    min-width: 0;
    min-height: var(--hit);
    padding: var(--space-2) var(--space-3);
    border: 0;
    background: transparent;
    color: var(--text);
    font-size: var(--step-0);
    line-height: var(--leading-ui);
    outline: none;
  }
  textarea {
    resize: vertical;
    font-family: var(--font-read);
    line-height: var(--leading-read);
  }
  input::placeholder,
  textarea::placeholder {
    color: var(--text-muted);
    opacity: 1;
  }
  .icon {
    display: inline-flex;
    padding-inline-start: var(--space-3);
    color: var(--text-muted);
  }
  .end {
    display: inline-flex;
    padding-inline-end: var(--space-1);
  }
  .typewriter input,
  .typewriter textarea {
    font-family: var(--font-type);
    letter-spacing: var(--tracking-label);
  }
  .typewriter input {
    caret-color: var(--accent);
  }
  .below {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: 0;
  }
  .hint,
  .count {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .count {
    margin-inline-start: auto;
  }
  .error {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    color: var(--danger);
  }
  .invalid .control {
    border-color: var(--danger);
    border-width: var(--border-strong);
  }
  input:disabled,
  textarea:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (forced-colors: active) {
    .control {
      border-color: FieldText;
    }
  }
</style>
