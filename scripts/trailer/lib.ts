/**
 * Outils communs de la bande-annonce (scripts/trailer) : chemins, ffmpeg, petit serveur statique,
 * enregistreur d'écran (screencast CDP au ralenti), curseur visible et gestes « humains ».
 *
 * Principe du tournage : la page est **ralentie** d'un facteur `SLOW` (horloges JS, rAF, minuteries
 * et animations CSS/WAAPI via le domaine CDP `Animation`), le script agit au même ralenti, puis les
 * images (horodatées) sont remises à l'échelle du temps réel. Chromium sans écran ne livre qu'une
 * vingtaine d'images par seconde à 1080p : ralenti × 4, cela fait ~80 i/s utiles, rééchantillonnées
 * à 30 i/s constantes.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrowserContext, CDPSession, Locator, Page } from '@playwright/test';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
/** Fichiers intermédiaires (images, plans, pistes), jamais versionnés. */
export const WORK = resolve(process.env.TRAILER_WORK ?? join(REPO, 'node_modules/.cache/trailer'));
/** Livrables. */
export const OUT = resolve(
  process.env.TRAILER_OUT ?? '/mnt/project-files/arbre-aux-absents/trailer',
);
export const FPS = 30;
export const FFMPEG = process.env.FFMPEG ?? '/usr/bin/ffmpeg';
export const FFPROBE = process.env.FFPROBE ?? '/usr/bin/ffprobe';

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function ffmpeg(args: string[], opts: { quiet?: boolean } = {}): string {
  const out = execFileSync(FFMPEG, ['-hide_banner', '-y', ...args], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (!opts.quiet && out.trim()) console.log(out.trim());
  return out;
}

/** ffmpeg en capturant stderr (mesures : ebur128, loudnorm, volumedetect). */
export function ffmpegStderr(args: string[]): string {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', ...args], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) throw new Error(`ffmpeg : ${r.stderr.slice(-2000)}`);
  return r.stderr;
}

export function probeDuration(file: string): number {
  return Number(
    execFileSync(
      FFPROBE,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
      { encoding: 'utf8' },
    ).trim(),
  );
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

/** Serveur statique minimal (copie du build du jeu, jamais le dossier partagé du dépôt). */
export function serve(root: string, port: number): Promise<Server> {
  const base = resolve(root);
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    let file = normalize(join(base, url));
    if (!file.startsWith(base)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

// ---------------------------------------------------------------------------------------------
// Ralenti

/**
 * Script injecté avant le jeu : horloges et minuteries ralenties d'un facteur `rate` (< 1).
 * Les animations CSS/WAAPI sont ralenties à part (CDP `Animation.setPlaybackRate`).
 */
export function slowClockScript(rate: number): string {
  return `(() => {
  const R = ${rate};
  const perf = performance.now.bind(performance);
  const t0 = perf();
  const d0 = Date.now();
  const RealDate = Date;
  performance.now = () => t0 + (perf() - t0) * R;
  const now = () => d0 + (perf() - t0) * R;
  class SlowDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(now()); else super(...a); }
    static now() { return now(); }
  }
  window.Date = SlowDate;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => cb(t0 + (ts - t0) * R));
  const st = window.setTimeout.bind(window);
  const si = window.setInterval.bind(window);
  window.setTimeout = (f, ms = 0, ...a) => st(f, (Number(ms) || 0) / R, ...a);
  window.setInterval = (f, ms = 0, ...a) => si(f, (Number(ms) || 0) / R, ...a);
})();`;
}

/** Curseur visible (la flèche à l'encre du jeu, DESIGN §9.0) et un halo safran discret au clic. */
export const CURSOR_SCRIPT = String.raw`(() => {
  const SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M3.2 2.3l.5 20.6 5.3-5.1 3.6 7.9 3.4-1.5-3.5-7.7 7.4-.5z' fill='%23182039' stroke='%23f7efdc' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M5.2 6.5l.2 10.8' stroke='%23f2b33d' stroke-width='1.2' stroke-linecap='round' opacity='.85'/%3E%3C/svg%3E";
  const install = () => {
    if (document.getElementById('trailer-cursor')) return;
    const st = document.createElement('style');
    st.textContent = '#trailer-cursor{position:fixed;left:0;top:0;width:40px;height:40px;margin:-2.5px 0 0 -3.75px;pointer-events:none;z-index:2147483647;background:url("' + SVG + '") no-repeat 0 0/40px 40px;filter:drop-shadow(0 2px 3px rgb(0 0 0/.45));transform:translate(var(--x,-100px),var(--y,-100px));opacity:var(--o,1);transition:opacity .4s}' +
      '#trailer-cursor.down{background-size:36px 36px;background-position:1px 1px}' +
      '.trailer-ring{position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:2px solid oklch(0.84 0.155 80/.9);pointer-events:none;z-index:2147483646;animation:trailer-ring .55s cubic-bezier(.2,.7,.3,1) forwards}' +
      '@keyframes trailer-ring{from{transform:translate(var(--x),var(--y)) scale(.3);opacity:.95}to{transform:translate(var(--x),var(--y)) scale(1.15);opacity:0}}' +
      '*{cursor:none!important}';
    document.documentElement.appendChild(st);
    const c = document.createElement('div');
    c.id = 'trailer-cursor';
    document.documentElement.appendChild(c);
    const set = (e) => { c.style.setProperty('--x', e.clientX + 'px'); c.style.setProperty('--y', e.clientY + 'px'); };
    addEventListener('pointermove', set, true);
    addEventListener('mousemove', set, true);
    addEventListener('pointerdown', (e) => {
      set(e); c.classList.add('down');
      const r = document.createElement('div');
      r.className = 'trailer-ring';
      r.style.setProperty('--x', e.clientX + 'px'); r.style.setProperty('--y', e.clientY + 'px');
      document.documentElement.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    }, true);
    addEventListener('pointerup', () => c.classList.remove('down'), true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.__trailerCursor = (show) => { const c = document.getElementById('trailer-cursor'); if (c) c.style.setProperty('--o', show ? '1' : '0'); };
})();`;

// ---------------------------------------------------------------------------------------------
// Enregistreur

export interface Frame {
  /** Temps « réel » de la scène (s), ralenti déjà compensé. */
  t: number;
  file: string;
}

/**
 * Screencast CDP d'une page ralentie. `mark()` pose des repères (temps de scène) pour le montage.
 */
export class Recorder {
  #cdp: CDPSession;
  #dir: string;
  #rate: number;
  #raw: { ts: number; file: string }[] = [];
  #t0 = 0;
  #n = 0;
  #pending: Promise<unknown>[] = [];
  marks: Record<string, number> = {};

  private constructor(cdp: CDPSession, dir: string, rate: number) {
    this.#cdp = cdp;
    this.#dir = dir;
    this.#rate = rate;
  }

  static async attach(
    ctx: BrowserContext,
    page: Page,
    dir: string,
    rate: number,
  ): Promise<Recorder> {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: rate });
    return new Recorder(cdp, ensureDir(dir), rate);
  }

  async start(size: { width: number; height: number }): Promise<void> {
    this.#t0 = Date.now() / 1000;
    this.#cdp.on('Page.screencastFrame', (f) => {
      const file = join(this.#dir, `f${String(this.#n++).padStart(6, '0')}.jpg`);
      writeFileSync(file, Buffer.from(f.data, 'base64'));
      this.#raw.push({ ts: f.metadata.timestamp ?? Date.now() / 1000, file });
      this.#pending.push(
        this.#cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}),
      );
    });
    await this.#cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 93,
      maxWidth: size.width,
      maxHeight: size.height,
      everyNthFrame: 1,
    });
  }

  /** Temps de scène écoulé depuis `start` (s). */
  now(): number {
    return (Date.now() / 1000 - this.#t0) * this.#rate;
  }

  mark(name: string): void {
    this.marks[name] = this.now();
  }

  async stop(): Promise<Frame[]> {
    await this.#cdp.send('Page.stopScreencast');
    await Promise.all(this.#pending);
    const raw = [...this.#raw].sort((a, b) => a.ts - b.ts);
    return raw.map((r) => ({ t: Math.max(0, (r.ts - this.#t0) * this.#rate), file: r.file }));
  }
}

/**
 * Images horodatées → plan vidéo à 30 i/s constantes (H.264 quasi sans perte, intermédiaire).
 * `from`/`to` en temps de scène ; la dernière image tient jusqu'à `to`.
 */
export function framesToClip(
  frames: Frame[],
  out: string,
  opts: { from?: number; to: number; width: number; height: number },
): void {
  const from = opts.from ?? 0;
  const kept: Frame[] = [];
  for (const f of frames) {
    if (f.t <= from) kept[0] = { t: from, file: f.file };
    else if (f.t < opts.to) kept.push(f);
  }
  if (kept.length === 0) throw new Error(`aucune image pour ${out}`);
  const lines: string[] = [];
  for (let i = 0; i < kept.length; i++) {
    const next = i + 1 < kept.length ? kept[i + 1]!.t : opts.to;
    lines.push(
      `file '${kept[i]!.file}'`,
      `duration ${Math.max(0.001, next - kept[i]!.t).toFixed(4)}`,
    );
  }
  lines.push(`file '${kept.at(-1)!.file}'`);
  const list = out.replace(/\.mp4$/, '.txt');
  writeFileSync(list, lines.join('\n') + '\n');
  ffmpeg(
    [
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      list,
      '-vf',
      `fps=${FPS}:start_time=0,scale=${opts.width}:${opts.height}:flags=lanczos,format=yuv420p`,
      '-t',
      (opts.to - from).toFixed(3),
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '12',
      '-r',
      String(FPS),
      out,
    ],
    { quiet: true },
  );
}

// ---------------------------------------------------------------------------------------------
// Gestes

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Acteur : un pointeur et un clavier au ralenti, à un rythme humain. */
export class Actor {
  page: Page;
  rate: number;
  x: number;
  y: number;

  constructor(page: Page, rate: number, start = { x: 900, y: 600 }) {
    this.page = page;
    this.rate = rate;
    this.x = start.x;
    this.y = start.y;
  }

  /** Attente en temps de scène. */
  async wait(sceneMs: number): Promise<void> {
    await this.page.waitForTimeout(sceneMs / this.rate);
  }

  /** Déplacement courbe et amorti, durée en temps de scène (proportionnelle à la distance). */
  async moveTo(x: number, y: number, sceneMs?: number): Promise<void> {
    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.hypot(dx, dy);
    const ms = sceneMs ?? Math.min(1100, 380 + dist * 0.75);
    const steps = Math.max(8, Math.round((ms / 1000) * 60));
    // Légère courbe : point de contrôle décalé perpendiculairement.
    const bend = Math.min(60, dist * 0.12);
    const cx = this.x + dx / 2 - (dy / (dist || 1)) * bend;
    const cy = this.y + dy / 2 + (dx / (dist || 1)) * bend;
    const x0 = this.x;
    const y0 = this.y;
    const stepMs = ms / steps / this.rate;
    for (let i = 1; i <= steps; i++) {
      const t = ease(i / steps);
      const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x;
      const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y;
      await this.page.mouse.move(px, py);
      await this.page.waitForTimeout(stepMs);
    }
    this.x = x;
    this.y = y;
  }

  /** Centre (un peu décalé) d'un élément. */
  async pointOf(target: Locator, fx = 0.5, fy = 0.5): Promise<{ x: number; y: number }> {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error('élément invisible');
    return { x: box.x + box.width * fx, y: box.y + box.height * fy };
  }

  async hover(target: Locator, fx = 0.5, fy = 0.5, sceneMs?: number): Promise<void> {
    const p = await this.pointOf(target, fx, fy);
    await this.moveTo(p.x, p.y, sceneMs);
  }

  async click(target?: Locator, opts: { fx?: number; fy?: number; settle?: number } = {}) {
    if (target) await this.hover(target, opts.fx, opts.fy);
    await this.wait(opts.settle ?? 160);
    await this.page.mouse.down();
    await this.wait(90);
    await this.page.mouse.up();
  }

  async type(text: string, perCharMs = 120): Promise<void> {
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      const jitter = ((ch.charCodeAt(0) * 37) % 60) - 30;
      await this.wait(perCharMs + jitter + (ch === ' ' ? 90 : 0));
    }
  }

  async wheel(dy: number, sceneMs = 600, dx = 0): Promise<void> {
    const steps = Math.max(6, Math.round(sceneMs / 40));
    for (let i = 0; i < steps; i++) {
      await this.page.mouse.wheel(dx / steps, dy / steps);
      await this.wait(sceneMs / steps);
    }
  }
}
