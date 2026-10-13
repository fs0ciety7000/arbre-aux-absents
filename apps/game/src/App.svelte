<script lang="ts">
  import { messages } from './messages.fr';
</script>

<main>
  <h1>{messages.title}</h1>
  <p class="tagline">{messages.tagline}</p>
  <p class="muted">{messages.placeholder}</p>
  <footer class="muted">{messages.credits}</footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--color-canvas);
    color: var(--color-text);
    font-family: var(--font-body);
  }
  main {
    min-height: 100dvh;
    display: grid;
    place-content: center;
    gap: var(--space-2);
    padding: var(--space-8) var(--space-4);
    text-align: center;
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2rem, 6vw, 3.5rem);
  }
  .tagline {
    max-width: var(--measure);
    margin: 0 auto;
  }
  .muted {
    color: var(--color-text-muted);
  }
</style>
