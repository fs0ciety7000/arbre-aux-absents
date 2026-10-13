<!--
	Curseur de valeur (DESIGN.md §9.11) : volumes, taille du texte (crans), vitesse.
	<input type="range"> natif (clavier, lecteurs d'écran, manette) + valeur affichée.
-->
<script lang="ts">
  interface Mark {
    value: number;
    label: string;
  }
  interface Props {
    label: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    /** Formatage de la valeur affichée et annoncée (aria-valuetext). */
    format?: (v: number) => string;
    /** Crans nommés affichés sous la piste. */
    marks?: Mark[];
    hint?: string;
    disabled?: boolean;
    onchange?: (v: number) => void;
    id?: string;
    class?: string;
  }

  let {
    label,
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    format = (v: number) => String(v),
    marks,
    hint,
    disabled = false,
    onchange,
    id = `slider-${Math.random().toString(36).slice(2, 8)}`,
    class: className = '',
  }: Props = $props();

  const pct = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);
  const text = $derived(format(value));
</script>

<div class="slider {className}">
  <div class="top">
    <label for={id} class="label">{label}</label>
    <output for={id} class="value num">{text}</output>
  </div>
  <input
    {id}
    type="range"
    {min}
    {max}
    {step}
    {disabled}
    bind:value
    aria-valuetext={text}
    aria-describedby={hint ? `${id}-hint` : undefined}
    style:--fill="{pct}%"
    onchange={() => onchange?.(value)}
  />
  {#if marks?.length}
    <div class="marks" aria-hidden="true">
      {#each marks as m (m.value)}
        <span style:--at="{((m.value - min) / (max - min)) * 100}%" class:on={m.value === value}
          >{m.label}</span
        >
      {/each}
    </div>
  {/if}
  {#if hint}<p id="{id}-hint" class="hint">{hint}</p>{/if}
</div>

<style>
  .slider {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .label {
    font-weight: var(--weight-medium);
  }
  .value {
    color: var(--text-muted);
  }
  input {
    appearance: none;
    width: 100%;
    height: var(--hit);
    margin: 0;
    background: transparent;
    cursor: pointer;
  }
  input:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
    border-radius: var(--radius-s);
  }
  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  input::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: var(--radius-pill);
    background: linear-gradient(to right, var(--accent) var(--fill), var(--surface-3) var(--fill));
    border: 1px solid var(--line-strong);
  }
  input::-moz-range-track {
    height: 6px;
    border-radius: var(--radius-pill);
    background: var(--surface-3);
    border: 1px solid var(--line-strong);
  }
  input::-moz-range-progress {
    height: 6px;
    border-radius: var(--radius-pill);
    background: var(--accent);
  }
  input::-webkit-slider-thumb {
    appearance: none;
    width: 1.5rem;
    height: 1.5rem;
    margin-top: calc(-0.75rem + 2px);
    border-radius: var(--radius-pill);
    background: var(--text);
    border: 3px solid var(--accent);
    box-shadow: var(--shadow-1);
    transition: transform var(--dur-base) var(--ease-snap);
  }
  /* v2 : le curseur grossit quand on le saisit */
  input:active::-webkit-slider-thumb {
    transform: scale(1.18);
  }
  input:active::-moz-range-thumb {
    transform: scale(1.18);
  }
  input::-moz-range-thumb {
    transition: transform var(--dur-base) var(--ease-snap);
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--radius-pill);
    background: var(--text);
    border: 3px solid var(--accent);
    box-shadow: var(--shadow-1);
  }
  .marks {
    position: relative;
    height: 1.5em;
    margin-inline: 0.75rem;
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .marks span {
    position: absolute;
    inset-inline-start: var(--at);
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .marks .on {
    color: var(--text);
    font-weight: var(--weight-semibold);
  }
  .hint {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  @media (forced-colors: active) {
    input::-webkit-slider-runnable-track {
      background: ButtonText;
    }
  }
</style>
