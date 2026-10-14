// Façade de vidéo (DESIGN §14.5), en amélioration progressive.
// Injecté en ligne dans <head> de l'accueil par hooks.server.ts (empreinte dans la CSP).
// - Sans JS : la façade est un lien vers la vidéo sur YouTube.
// - Avec JS : le lien devient un bouton ; au clic (ou Entrée / Espace), il est remplacé par le
//   lecteur `data-yt-embed` (youtube-nocookie.com) : rien n'est demandé à YouTube avant.
// - Ctrl / Cmd / Maj / clic du milieu : comportement normal du lien (nouvel onglet).
(function () {
  /** @param {HTMLAnchorElement} link */
  function play(link) {
    var src = link.getAttribute('data-yt-embed');
    if (!src) return;
    var frame = document.createElement('iframe');
    frame.src = src;
    frame.title = link.getAttribute('data-yt-title') || '';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.className = link.getAttribute('data-yt-class') || '';
    frame.tabIndex = -1;
    link.replaceWith(frame);
    frame.focus();
  }

  function start() {
    document.querySelectorAll('a[data-yt-embed]').forEach(function (el) {
      var link = /** @type {HTMLAnchorElement} */ (el);
      link.setAttribute('role', 'button');
      link.addEventListener('click', function (e) {
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        play(link);
      });
      link.addEventListener('keydown', function (e) {
        if (e.key !== ' ') return;
        e.preventDefault();
        play(link);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
