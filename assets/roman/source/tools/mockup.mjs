// Maquette 3D (bonus) : node tools/mockup.mjs <finals> <out.html>
import { writeFileSync, readFileSync } from 'node:fs';
const [fin, out] = process.argv.slice(2);
const tokens = readFileSync('/home/user/arbre-aux-absents/packages/ui/src/styles/tokens.css', 'utf8');
const front = `${fin}/arbre-aux-absents_1re-de-couv_140x210_300dpi.png`;
const spine = `${fin}/../tmp-spine.png`;
const k = 3.1; // px par mm
const W = 140 * k, H = 210 * k, D = 20 * k;
writeFileSync(out, `<!doctype html><meta charset="utf-8"><style>${tokens}
:root{color-scheme:light}
html,body{margin:0;width:1600px;height:1100px;overflow:hidden}
body{background:radial-gradient(ellipse 60% 70% at 46% 42%, var(--raw-wood-500), var(--raw-wood-700) 70%, var(--raw-night-950));}
.grain{position:absolute;inset:0;background:repeating-linear-gradient(176deg, transparent 0 9px, oklch(0.3 0.04 40 / .12) 9px 10px, transparent 10px 23px);}
.glow{position:absolute;inset:0;background:radial-gradient(circle at 44% 36%, var(--lamp-pool), transparent 45%)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, transparent 45%, var(--vignette) 100%)}
.scene{position:absolute;inset:0;perspective:2400px;perspective-origin:50% 20%}
.book{position:absolute;left:${800 - W / 2}px;top:${560 - H / 2}px;width:${W}px;height:${H}px;transform-style:preserve-3d;
  transform:rotateX(48deg) rotateZ(-24deg)}
.f{position:absolute;backface-visibility:hidden}
.front{inset:0;background:url('${front}') center/100% 100%;transform:translateZ(${D}px);box-shadow:inset 0 0 0 .5px oklch(0 0 0 / .25)}
.front::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg, oklch(1 0 0 / .14), transparent 40%, oklch(0 0 0 / .1));}
.spine{left:0;top:0;width:${D}px;height:${H}px;background:url('${spine}') center/100% 100%;transform-origin:left;transform:rotateY(-90deg) translateX(-${D}px);transform:translateZ(${D}px) rotateY(90deg) scaleX(-1);transform-origin:left center}
.edge-r{top:0;left:${W}px;width:${D}px;height:${H}px;transform-origin:left center;transform:rotateY(90deg);
  background:repeating-linear-gradient(90deg, var(--raw-paper-aged) 0 1.2px, var(--raw-paper-stain) 1.2px 1.8px);box-shadow:inset 0 0 6px oklch(0 0 0 / .25)}
.edge-b{left:0;top:${H}px;width:${W}px;height:${D}px;transform-origin:top center;transform:rotateX(-90deg);
  background:repeating-linear-gradient(0deg, var(--raw-paper-aged) 0 1.2px, var(--raw-paper-stain) 1.2px 1.8px);box-shadow:inset 0 0 8px oklch(0 0 0 / .3)}
.shadow{position:absolute;left:-30px;top:-10px;width:${W + 90}px;height:${H + 70}px;background:oklch(0.12 0.03 260 / .55);filter:blur(22px);transform:translate(26px,30px)}
</style><div class="grain"></div><div class="glow"></div>
<div class="scene"><div class="book"><div class="shadow"></div><div class="f edge-r"></div><div class="f edge-b"></div><div class="f front"></div></div></div>
<div class="vig"></div>`);
