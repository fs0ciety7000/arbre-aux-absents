// Mouvement au défilement du site (DESIGN §8.8), en amélioration progressive.
// Injecté en ligne dans <head> par hooks.server.ts (aucune requête, empreinte dans la CSP) :
// c'est le seul JavaScript des pages prérendues sans hydratation.
// - Sans JS, ou en mouvement réduit, ou sans IntersectionObserver : rien n'est masqué, rien ne
//   bouge au défilement (la classe `sr` n'est jamais posée).
// - [data-sr] : distribué à l'entrée dans la vue (data-reveal="in", motion.css) ; rang : --i.
// - [data-play] : les animations CSS du bloc (InkReveal…) attendent son entrée dans la vue.
// - [data-tilt] : inclinaison 3D au pointeur souris (--tilt-x / --tilt-y, ≤ data-tilt degrés).
(function () {
  var root = document.documentElement;
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('sr');

  function start() {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          if (el.hasAttribute('data-sr')) el.setAttribute('data-reveal', 'in');
          if (el.hasAttribute('data-play')) el.setAttribute('data-play', 'in');
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    document.querySelectorAll('[data-sr],[data-play]').forEach(function (el) {
      io.observe(el);
    });

    /** @param {EventTarget | null} target */
    function tiltOf(target) {
      var t = target instanceof Element ? target.closest('[data-tilt]') : null;
      return t instanceof HTMLElement ? t : null;
    }

    var frame = 0;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var el = tiltOf(e.target);
      if (!el) return;
      var card = el;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        var r = card.getBoundingClientRect();
        var max = Number(card.getAttribute('data-tilt')) || 4;
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--tilt-x', (-y * max).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (x * max).toFixed(2) + 'deg');
      });
    });
    document.addEventListener('pointerout', function (e) {
      var t = tiltOf(e.target);
      if (!t || (e.relatedTarget instanceof Node && t.contains(e.relatedTarget))) return;
      cancelAnimationFrame(frame);
      t.style.removeProperty('--tilt-x');
      t.style.removeProperty('--tilt-y');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
