<!--
  En-tête du site v2 (DESIGN §5.4, §14.1) : titre du jeu (Wordmark « header »), navigation en
  Oswald capitales, une seule action safran. Transparent : sur l'accueil il se pose sur l'art clé.
  Sous 64 rem, la navigation passe dans un menu <details> (sans JS, clavier natif).
-->
<script lang="ts">
  import { page } from '$app/state';
  import { Button, Icon, LanguageSwitch, Wordmark } from '@arbre/ui';
  import { resolve } from '$app/paths';
  import { localHref, localPath } from '#lib/i18n/app';
  import { SITE_LOCALES, parsePagePath, type SitePath } from '#lib/i18n/pages';
  import type { ChromeStrings } from '#lib/i18n/index';

  /** Textes de l'habillage (load du layout). */
  let { t }: { t: ChromeStrings } = $props();

  // Pages de signalement (lot B4) : dans le pied de page seulement. À 64 rem, la navigation large
  // occupe déjà toute la place (mesuré : ~760 px disponibles, ~770 px pris) ; un lien de plus
  // déborderait. On y accède aussi depuis le jeu (Signaler, Mes signalements).
  const links = ['le-monde/', 'artbook/', 'charte/', 'presse/', 'credits/'] as const;

  const lang = $derived(t.lang);
  /** Page localisée en cours ; ailleurs (404, /design/), le sélecteur mène à l'accueil. */
  const here = $derived<SitePath>(
    page.route.id?.startsWith('/[[lang=lang]]')
      ? (parsePagePath(page.url.pathname)?.path ?? '')
      : '',
  );
  const hrefs = $derived(Object.fromEntries(SITE_LOCALES.map((l) => [l, localHref(l, here)])));
  const current = (path: SitePath) => page.url.pathname === localHref(lang, path);
  const home = $derived(current(''));
</script>

<header class="site-header" class:over-art={home}>
  <div class="inner">
    <a class="home" href={resolve(localPath(lang, ''))} aria-current={home ? 'page' : undefined}>
      <Wordmark size="header" as="span" />
      <span class="visually-hidden">{t.header.homeSuffix}</span>
    </a>

    <div class="tools">
      <nav class="wide" aria-label={t.header.nav}>
        <ul>
          {#each links as link (link)}
            <li>
              <a
                href={resolve(localPath(lang, link))}
                aria-current={current(link) ? 'page' : undefined}>{t.header.links[link]}</a
              >
            </li>
          {/each}
        </ul>
        <Button variant="primary" href={localHref(lang, 'le-monde/')} iconName="map"
          >{t.header.exploreMap}</Button
        >
      </nav>

      <details class="narrow">
        <summary>
          <Icon name="menu" size="1.25rem" />
          <span class="menu-label">{t.header.menu}</span>
        </summary>
        <nav class="sheet blotter" aria-label={t.header.nav}>
          <ul>
            {#each links as link (link)}
              <li>
                <a
                  href={resolve(localPath(lang, link))}
                  aria-current={current(link) ? 'page' : undefined}>{t.header.links[link]}</a
                >
              </li>
            {/each}
          </ul>
          <Button variant="primary" block href={localHref(lang, 'le-monde/')} iconName="map"
            >{t.header.exploreMap}</Button
          >
        </nav>
      </details>

      <!-- Changer de langue, c'est changer de page : même slug sous /en/ (DESIGN §9.35, §14.6). -->
      <LanguageSwitch value={lang} locales={SITE_LOCALES} {hrefs} short class="lang-switch" />
    </div>
  </div>
</header>

<style>
  .site-header {
    position: relative;
    z-index: var(--z-header);
  }
  .over-art {
    /* L'art clé du héros remonte sous l'en-tête (DESIGN §14.1), voilé en haut pour le texte. */
    margin-block-end: calc(var(--site-header-h) * -1 - var(--space-4));
    background: linear-gradient(to bottom, var(--scrim-art), transparent);
  }
  .inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
    max-inline-size: calc(var(--container) + var(--space-16));
    min-block-size: calc(var(--site-header-h) + var(--space-4));
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
  .home :global(.wordmark) {
    gap: 0;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .wide {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  ul {
    display: flex;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  nav a:not(:global(.btn)) {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--hit);
    padding-inline: var(--space-3);
    border-radius: var(--radius-s);
    font-family: var(--font-label);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    text-decoration: none;
    color: var(--text-muted);
  }
  nav a:not(:global(.btn)):hover {
    color: var(--accent);
  }
  nav a[aria-current='page'] {
    color: var(--text);
    text-decoration: underline;
    text-decoration-color: var(--brand);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.5em;
  }
  .narrow {
    display: none;
    position: relative;
  }
  summary {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: var(--hit);
    padding-inline: var(--space-3);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--surface-1);
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    color: var(--accent);
  }
  details[open] summary {
    border-color: var(--accent);
  }
  .sheet {
    position: absolute;
    inset-inline-end: 0;
    inset-block-start: calc(100% + var(--space-2));
    display: grid;
    gap: var(--space-4);
    inline-size: min(18rem, calc(100vw - 2 * var(--gutter)));
    padding: var(--space-4);
  }
  .sheet ul {
    display: grid;
  }
  .sheet a:not(:global(.btn)) {
    inline-size: 100%;
    min-block-size: var(--hit-l);
  }
  @media (max-width: 63.9375rem) {
    .wide {
      display: none;
    }
    .narrow {
      display: block;
    }
  }
  /* Téléphone : titre, menu et langue tiennent sur une ligne ; « Menu » reste le nom du bouton. */
  @media (max-width: 29.9375rem) {
    .inner,
    .tools {
      gap: var(--space-2);
    }
    .menu-label {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
</style>
