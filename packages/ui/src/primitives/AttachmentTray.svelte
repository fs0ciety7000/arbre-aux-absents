<!--
	Captures jointes à un formulaire (DESIGN.md §9.38) : bouton « Ajouter une capture » (fichier),
	dépôt (glisser-déposer sur le plateau) ; le collage (Ctrl+V) est branché par le formulaire
	(`imageFiles`). Une vignette « photo d'archive » par image, avec son état (préparation, envoi,
	jointe, erreur en clair), « Réessayer » et « Retirer ». La file d'envoi (`AttachmentQueue`)
	vit dans l'application : ce composant n'affiche que ses `items`.
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  import { hasFiles, imageFiles, type AttachmentItem } from '../attachments';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import IconButton from './IconButton.svelte';
  import Loader from './Loader.svelte';

  interface Props {
    items: AttachmentItem[];
    max: number;
    /** Fichiers choisis ou déposés ; rend le nombre d'images retenues. */
    onadd: (files: File[]) => number;
    onremove: (key: string) => void;
    onretry?: (key: string) => void;
    disabled?: boolean;
    /** Remplace le libellé par défaut. */
    label?: string;
    hint?: string;
    id?: string;
  }

  let {
    items,
    max,
    onadd,
    onremove,
    onretry,
    disabled = false,
    label,
    hint,
    id = `tray-${Math.random().toString(36).slice(2, 8)}`,
  }: Props = $props();
  const ui = getUiStrings();
  const t = $derived(ui.attachments);

  let input: HTMLInputElement | undefined = $state();
  let dragging = $state(false);
  let notice = $state('');
  const full = $derived(items.length >= max);
  const RETRYABLE = new Set(['rateLimited', 'disabled', 'offline', 'timeout', 'unavailable']);

  /** Ajoute des fichiers et dit ce qui a été écarté (au-delà du maximum, autre chose qu'une image). */
  export function addFiles(files: File[], skipped = 0) {
    if (disabled) return;
    const images = files.filter((f) => f.type.startsWith('image/'));
    const notImages = files.length - images.length + skipped;
    const taken = images.length ? onadd(images) : 0;
    const ignored = images.length - taken;
    notice =
      ignored > 0 ? t.ignored(ignored, max) : notImages > 0 && taken === 0 ? t.errors.type : '';
  }

  function pick() {
    if (full) {
      notice = t.full(max);
      return;
    }
    input?.click();
  }

  function onchange() {
    const files = Array.from(input?.files ?? []);
    if (input) input.value = '';
    addFiles(files);
  }

  function ondragover(e: DragEvent) {
    if (disabled || !hasFiles(e.dataTransfer)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    dragging = true;
  }

  function ondragleave(e: DragEvent) {
    const next = e.relatedTarget as Node | null;
    if (!next || !(e.currentTarget as Node).contains(next)) dragging = false;
  }

  function ondrop(e: DragEvent) {
    if (!hasFiles(e.dataTransfer)) return;
    e.preventDefault();
    dragging = false;
    const images = imageFiles(e.dataTransfer);
    const all = Array.from(e.dataTransfer?.files ?? []);
    addFiles(images, Math.max(0, all.length - images.length));
  }

  function stateText(item: AttachmentItem): string {
    if (item.status === 'error') return t.errors[item.error ?? 'unavailable'];
    return t.status[item.status];
  }
</script>

<div
  class="tray"
  class:dragging
  role="group"
  aria-labelledby="{id}-label"
  aria-describedby="{id}-hint"
  {ondragover}
  {ondragleave}
  {ondrop}
>
  <p id="{id}-label" class="label">{label ?? t.label}</p>
  <p id="{id}-hint" class="hint">{hint ?? t.hint(max)}</p>

  {#if items.length > 0}
    <ul class="tiles">
      {#each items as item, i (item.key)}
        <li class="tile" data-status={item.status}>
          <div class="thumb">
            {#if item.src}
              <img src={item.src} alt={t.alt(i + 1)} />
            {:else}
              <span class="placeholder" aria-hidden="true"><Icon name="photo" size="2rem" /></span>
            {/if}
            <span class="remove">
              <IconButton
                icon="close"
                variant="secondary"
                label={t.remove(i + 1, item.name)}
                tooltip={false}
                onclick={() => onremove(item.key)}
              />
            </span>
          </div>
          <div class="state">
            {#if item.status === 'preparing' || item.status === 'uploading'}
              <Loader label={stateText(item)} showLabel delay={0} />
            {:else if item.status === 'error'}
              <span class="error" role="status"
                ><Icon name="warning" size="1rem" /> {stateText(item)}</span
              >
            {:else}
              <span class="ok" role="status"
                ><Icon name="check" size="1rem" /> {stateText(item)}</span
              >
            {/if}
          </div>
          {#if item.status === 'error' && onretry && item.src && RETRYABLE.has(item.error ?? '')}
            <Button variant="ghost" onclick={() => onretry(item.key)}>{t.retry}</Button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <div class="add">
    <Button variant="secondary" iconName="photo" disabled={disabled || full} onclick={pick}
      >{t.add}</Button
    >
    <span class="count num" aria-live="polite">{t.count(items.length, max)}</span>
  </div>
  <input
    bind:this={input}
    class="file"
    type="file"
    accept="image/png,image/jpeg,image/webp,image/*"
    multiple
    tabindex="-1"
    aria-hidden="true"
    {onchange}
  />
  {#if dragging}<p class="drop" aria-hidden="true">{t.drop}</p>{/if}
  <p class="notice" role="status">{notice}</p>
</div>

<style>
  .tray {
    position: relative;
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
    padding: var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-s);
  }
  .tray.dragging {
    border-color: var(--accent);
    background: var(--accent-tint);
  }
  .label {
    margin: 0;
    font-size: var(--step-0);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }
  .hint,
  .count,
  .notice,
  .state {
    margin: 0;
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .notice:empty {
    display: none;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 7.5rem), 1fr));
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Vignette : tirage photo à bord blanc, posé de travers (un sur deux dans l'autre sens). */
  .tile {
    display: grid;
    align-content: start;
    gap: var(--space-1);
    min-inline-size: 0;
    padding: var(--space-1) var(--space-1) var(--space-2);
    background: var(--surface-1);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-1);
    transform: rotate(-0.6deg);
  }
  .tile:nth-child(even) {
    transform: rotate(0.6deg);
  }
  .tile[data-status='error'] {
    border-color: var(--danger);
  }
  .thumb {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: var(--radius-xs);
    background: var(--surface-2);
  }
  .thumb img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
  .placeholder {
    display: grid;
    place-items: center;
    block-size: 100%;
    color: var(--text-muted);
  }
  .remove {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
  }
  .state :global(.loader) {
    font-size: var(--step--1);
  }
  .error,
  .ok {
    display: inline-flex;
    align-items: flex-start;
    gap: var(--space-1);
  }
  .error {
    color: var(--danger);
    font-weight: var(--weight-semibold);
  }
  .ok {
    color: var(--text);
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
  }
  .file {
    display: none;
  }
  .drop {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    border-radius: inherit;
    background: var(--accent-tint);
    color: var(--text);
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    pointer-events: none;
  }
  @media (forced-colors: active) {
    .tray.dragging {
      border-color: Highlight;
    }
  }
</style>
