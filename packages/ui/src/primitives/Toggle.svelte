<!--
	Interrupteur (DESIGN.md §9.10), rôle « switch ». L'état se lit sans la couleur :
	position du curseur + glyphe (coche / trait) + texte « Activé / Désactivé » optionnel.
-->
<script lang="ts">
  interface Props {
    label: string;
    checked?: boolean;
    description?: string;
    disabled?: boolean;
    /** Affiche « Activé / Désactivé » à côté de l'interrupteur. */
    showState?: boolean;
    onchange?: (checked: boolean) => void;
    id?: string;
    class?: string;
  }

  let {
    label,
    checked = $bindable(false),
    description,
    disabled = false,
    showState = false,
    onchange,
    id = `toggle-${Math.random().toString(36).slice(2, 8)}`,
    class: className = '',
  }: Props = $props();

  function toggle() {
    checked = !checked;
    onchange?.(checked);
  }
</script>

<div class="toggle {className}">
  <div class="texts">
    <span id="{id}-label" class="label">{label}</span>
    {#if description}<span id="{id}-desc" class="desc">{description}</span>{/if}
  </div>
  <button
    {id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby="{id}-label"
    aria-describedby={description ? `${id}-desc` : undefined}
    {disabled}
    class="switch"
    onclick={toggle}
  >
    {#if showState}<span class="state" aria-hidden="true">{checked ? 'Activé' : 'Désactivé'}</span
      >{/if}
    <span class="track" aria-hidden="true">
      <span class="thumb">
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#if checked}<path d="M3.5 8.5l3 3 6-7" />{:else}<path d="M4 8h8" />{/if}
        </svg>
      </span>
    </span>
  </button>
</div>

<style>
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: var(--hit);
  }
  .texts {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .label {
    font-weight: var(--weight-medium);
  }
  .desc {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .switch {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--hit);
    min-width: var(--hit);
    padding: 0 var(--space-1);
    border: 0;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-pill);
  }
  .switch:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .switch:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .state {
    font-size: var(--step--1);
    min-width: 5.5em;
    text-align: end;
  }
  .track {
    position: relative;
    display: inline-block;
    width: 3.25rem;
    height: 2rem;
    border-radius: var(--radius-pill);
    background: var(--surface-3);
    border: var(--border-strong) solid var(--line-strong);
  }
  .thumb {
    position: absolute;
    inset-block-start: 2px;
    inset-inline-start: 2px;
    width: 1.5rem;
    height: 1.5rem;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--text-muted);
    color: var(--surface-1);
    transition: transform var(--dur-base) var(--ease-out);
  }
  [aria-checked='true'] .track {
    background: var(--accent);
    border-color: var(--accent);
  }
  [aria-checked='true'] .thumb {
    transform: translateX(1.25rem);
    background: var(--accent-contrast);
    color: var(--accent);
  }
  :global([dir='rtl']) [aria-checked='true'] .thumb {
    transform: translateX(-1.25rem);
  }
  @media (forced-colors: active) {
    .track {
      border-color: ButtonText;
    }
    [aria-checked='true'] .track {
      background: Highlight;
    }
  }
</style>
