<!--
	Liste déroulante native stylée (DESIGN.md §9.8) : options, tri, filtres simples.
	Pour choisir un candidat (prénom, nom, métier), utiliser Combobox.
-->
<script lang="ts" module>
  export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import Icon from './Icon.svelte';

  interface Props extends Omit<HTMLSelectAttributes, 'value'> {
    label: string;
    options: SelectOption[];
    value?: string;
    hint?: string;
    hideLabel?: boolean;
    id?: string;
  }

  let {
    label,
    options,
    value = $bindable(''),
    hint,
    hideLabel = false,
    id = `select-${Math.random().toString(36).slice(2, 8)}`,
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<div class="field {className}">
  <label for={id} class="label" class:visually-hidden={hideLabel}>{label}</label>
  <div class="control">
    <select {...rest} {id} bind:value aria-describedby={hint ? `${id}-hint` : undefined}>
      {#each options as o (o.value)}
        <option value={o.value} disabled={o.disabled}>{o.label}</option>
      {/each}
    </select>
    <span class="chevron"><Icon name="chevron-down" /></span>
  </div>
  {#if hint}<p id="{id}-hint" class="hint">{hint}</p>{/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  .label {
    font-weight: var(--weight-semibold);
  }
  .control {
    position: relative;
    display: flex;
    align-items: center;
  }
  select {
    appearance: none;
    width: 100%;
    min-height: var(--hit);
    padding: var(--space-2) calc(var(--space-3) + 1.5rem) var(--space-2) var(--space-3);
    background: var(--surface-2);
    color: var(--text);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    font-size: var(--step-0);
    cursor: pointer;
  }
  select:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  option {
    background: var(--surface-1);
    color: var(--text);
  }
  .chevron {
    position: absolute;
    inset-inline-end: var(--space-3);
    pointer-events: none;
    color: var(--text-muted);
    display: inline-flex;
  }
  .hint {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
