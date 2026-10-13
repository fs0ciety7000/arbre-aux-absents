<!-- En-tête du site : logo-titre et navigation (DESIGN §5.4). Aucun JS : la liste passe à la
     ligne sur téléphone. -->
<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Wordmark from './Wordmark.svelte';

  const links = [
    { path: 'le-monde/', label: 'Le monde' },
    { path: 'artbook/', label: 'Artbook' },
    { path: 'charte/', label: 'Charte' },
    { path: 'presse/', label: 'Presse' },
    { path: 'credits/', label: 'Crédits' },
  ] as const;

  const current = (path: string) => page.url.pathname === `/${path}`;
</script>

<header class="site-header">
  <div class="inner">
    <a class="home" href={resolve('/')} aria-current={current('') ? 'page' : undefined}>
      <Wordmark size="s" />
      <span class="visually-hidden">, accueil</span>
    </a>
    <nav aria-label="Navigation principale">
      <ul>
        {#each links as link (link.path)}
          <li>
            <a href={resolve(link.path)} aria-current={current(link.path) ? 'page' : undefined}
              >{link.label}</a
            >
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</header>

<style>
  .site-header {
    position: relative;
    z-index: var(--z-header);
    border-block-end: var(--border) solid var(--line);
    background: var(--canvas);
  }
  .inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2) var(--space-6);
    max-inline-size: var(--container);
    min-block-size: calc(var(--hit) + var(--space-5)); /* 64 px (DESIGN §5.4) */
    margin-inline: auto;
    padding: var(--space-2) var(--gutter);
  }
  .home {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--hit);
    color: var(--text);
    text-decoration: none;
    border-radius: var(--radius-s);
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  nav a {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--hit);
    padding-inline: var(--space-3);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-label);
    text-decoration: none;
  }
  nav a:hover {
    color: var(--text);
    background: var(--surface-2);
  }
  nav a[aria-current='page'] {
    color: var(--accent);
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.45em;
  }
  @media (max-width: 37.4375rem) {
    .inner {
      padding-block: var(--space-3);
    }
    nav {
      inline-size: 100%;
    }
    ul {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-1);
      margin-inline: calc(var(--space-3) * -1);
    }
    nav a {
      inline-size: 100%;
    }
  }
</style>
