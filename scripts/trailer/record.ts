/**
 * Tournage des plans de jeu de la bande-annonce : le vrai jeu (build web), une vraie partie
 * (`save.ts`), piloté par Playwright à un rythme humain, filmé au ralenti (voir lib.ts).
 *
 *   npx tsx scripts/trailer/record.ts --dist <copie de apps/game/dist> [--only lettre,carte]
 *
 * Chaque prise écrit `WORK/takes/<nom>/` (images) et `WORK/clips/<nom>.mp4` (30 i/s), plus
 * `WORK/clips/<nom>.json` (repères de montage, en secondes dans le plan).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import {
  Actor,
  CURSOR_SCRIPT,
  REPO,
  Recorder,
  WORK,
  ensureDir,
  framesToClip,
  serve,
  slowClockScript,
} from './lib';

const { values } = parseArgs({
  options: {
    dist: { type: 'string' },
    only: { type: 'string' },
    port: { type: 'string', default: '4391' },
    rate: { type: 'string', default: '0.25' },
  },
});
if (!values.dist) throw new Error('--dist <dossier du build web du jeu> est requis');
const RATE = Number(values.rate);
const PORT = Number(values.port);
const BASE = `http://127.0.0.1:${PORT}/`;
const only = values.only ? new Set(values.only.split(',')) : null;

const SAVE_FILE = join(ensureDir(WORK), 'save.json');
execFileSync('npx', ['tsx', join(REPO, 'scripts/trailer/save.ts'), '--out', SAVE_FILE], {
  cwd: REPO,
  stdio: 'inherit',
});
const SAVE = JSON.parse(readFileSync(SAVE_FILE, 'utf8')) as {
  state: unknown;
  summary: unknown;
  profile: unknown;
};

interface Shape {
  viewport: { width: number; height: number };
  scale: number;
  /** Taille de sortie (px). */
  out: { width: number; height: number };
}
const LANDSCAPE: Shape = {
  viewport: { width: 1440, height: 810 },
  scale: 4 / 3,
  out: { width: 1920, height: 1080 },
};
/** Même mise en page, rendue en 2880 × 1620 : le montage peut s'approcher du Lecteur sans flou. */
const LANDSCAPE_HI: Shape = {
  viewport: { width: 1440, height: 810 },
  scale: 2,
  out: { width: 2880, height: 1620 },
};
const PORTRAIT: Shape = {
  viewport: { width: 540, height: 960 },
  scale: 2,
  out: { width: 1080, height: 1920 },
};

interface Session {
  ctx: BrowserContext;
  page: Page;
  actor: Actor;
}

/** Contexte neuf : ralenti, curseur, partie injectée, puis Titre → Continuer → Bureau. */
async function open(browser: Browser, shape: Shape): Promise<Session> {
  const ctx = await browser.newContext({
    viewport: shape.viewport,
    deviceScaleFactor: shape.scale,
    locale: 'fr-FR',
    reducedMotion: 'no-preference',
    colorScheme: 'dark',
    // Le jeu a une CSP stricte : le curseur de tournage injecte une feuille de style.
    bypassCSP: true,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`  [page] ${e.message}`));
  await page.goto(BASE);
  await page.evaluate(
    async ({ state, summary, profile }) => {
      const db = await new Promise<IDBDatabase>((ok, ko) => {
        const r = indexedDB.open('arbre-aux-absents', 1);
        r.onupgradeneeded = () => {
          if (!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv');
        };
        r.onsuccess = () => ok(r.result);
        r.onerror = () => ko(r.error);
      });
      await new Promise<void>((ok, ko) => {
        const tx = db.transaction('kv', 'readwrite');
        const st = tx.objectStore('kv');
        st.put(JSON.stringify(state), 'save:slot-1');
        st.put(JSON.stringify(summary), 'summary:slot-1');
        st.put(JSON.stringify(profile), 'profile');
        tx.oncomplete = () => ok();
        tx.onerror = () => ko(tx.error);
      });
      db.close();
    },
    { state: SAVE.state, summary: SAVE.summary, profile: SAVE.profile },
  );
  await ctx.addInitScript(slowClockScript(RATE));
  await ctx.addInitScript(CURSOR_SCRIPT);
  await page.reload();
  const skip = page.getByRole('button', { name: 'Passer' }).first();
  const cont = page.getByRole('button', { name: /Continuer/ });
  await skip.or(cont).first().waitFor({ timeout: 60_000 });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await cont.click({ timeout: 60_000 });
  await page.getByRole('main', { name: 'Bureau' }).waitFor({ timeout: 60_000 });
  const actor = new Actor(page, RATE, {
    x: shape.viewport.width * 0.42,
    y: shape.viewport.height * 0.62,
  });
  await page.mouse.move(actor.x, actor.y);
  await actor.wait(2500);
  return { ctx, page, actor };
}

/** Onglet du volet latéral ou de la chemise, hors champ (clic direct). */
async function tab(page: Page, name: RegExp): Promise<void> {
  await page.getByRole('tab', { name }).first().click();
}

async function showCap(page: Page): Promise<void> {
  await tab(page, /^Arbre/);
  const slot = page.locator('[data-tree-view] [data-slot="c11"]');
  await slot.scrollIntoViewIfNeeded();
}

async function film(
  s: Session,
  name: string,
  shape: Shape,
  body: (rec: Recorder, a: Actor) => Promise<void>,
): Promise<void> {
  const dir = join(WORK, 'takes', name);
  rmSync(dir, { recursive: true, force: true });
  const rec = await Recorder.attach(s.ctx, s.page, dir, RATE);
  await s.actor.wait(400);
  await rec.start(shape.out);
  await s.actor.wait(300);
  rec.mark('start');
  await body(rec, s.actor);
  rec.mark('end');
  await s.actor.wait(300);
  const frames = await rec.stop();
  const clips = ensureDir(join(WORK, 'clips'));
  const from = rec.marks.start ?? 0;
  const to = rec.marks.end ?? frames.at(-1)!.t;
  framesToClip(frames, join(clips, `${name}.mp4`), { from, to, ...shape.out });
  const marks = Object.fromEntries(
    Object.entries(rec.marks).map(([k, v]) => [k, Math.round((v - from) * 1000) / 1000]),
  );
  writeFileSync(join(clips, `${name}.json`), JSON.stringify(marks, null, 1));
  const fps = frames.length / Math.max(0.001, frames.at(-1)!.t - frames[0]!.t);
  console.log(
    `  ${name} : ${(to - from).toFixed(1)} s, ${frames.length} images (${fps.toFixed(0)} i/s de scène)`,
  );
}

// ---------------------------------------------------------------------------------------------
// Prises

type Take = (browser: Browser) => Promise<void>;
const TAKES: Record<string, Take> = {};

/** La lettre de Maaren (Lecteur), ouverte depuis le Catalogue ; mots-clés soulignés. */
TAKES.lettre = async (browser) => {
  const s = await open(browser, LANDSCAPE_HI);
  const { page } = s;
  await showCap(page);
  await tab(page, /^Catalogue/);
  await s.actor.wait(1500);
  const panel = page.getByRole('tabpanel', { name: 'Catalogue' });
  const fiche = panel.getByRole('button', { name: /Lettre de Maaren au capitaine/ }).first();
  await fiche.waitFor();
  await film(s, 'lettre', LANDSCAPE_HI, async (rec, a) => {
    await a.moveTo(a.x + 120, a.y - 60, 700);
    await a.click(fiche, { fx: 0.45, fy: 0.3 });
    rec.mark('open');
    await a.wait(1600);
    const reader = page.getByRole('tabpanel', { name: 'Lecteur' });
    const kw = reader.getByRole('button', { name: 'Firmin Varenque', exact: true }).first();
    await a.moveTo(a.x - 40, a.y - 120, 900);
    await a.wait(300);
    // Défilement lent jusqu'à la suscription (le capitaine Firmin Varenque, souligné).
    const box = await kw.boundingBox();
    const target = page.viewportSize()!.height * 0.52;
    if (box) await a.wheel(Math.max(0, box.y - target), 1800);
    await a.wait(300);
    rec.mark('scrolled');
    await a.hover(kw, 0.55, 0.6, 900);
    rec.mark('kw');
    await a.wait(1600);
    await a.wheel(260, 1500);
    await a.wait(900);
  });
  await s.ctx.close();
};

/** Catalogue : « Tenna Orrvik », la fiche trouvée, son visage posé dans l'arbre, le métier, le tampon. */
TAKES.tenna = async (browser) => {
  const s = await open(browser, LANDSCAPE_HI);
  const { page } = s;
  await showCap(page);
  await tab(page, /^Catalogue/);
  await s.actor.wait(1200);
  const panel = page.getByRole('tabpanel', { name: 'Catalogue' });
  const field = panel.getByRole('textbox', { name: 'Requête' });
  await field.fill('');
  await film(s, 'tenna', LANDSCAPE_HI, async (rec, a) => {
    await a.click(field, { fx: 0.3 });
    await a.wait(300);
    rec.mark('type');
    await a.type('Tenna Orrvik', 115);
    await a.wait(350);
    await a.click(panel.getByRole('button', { name: 'Consulter' }), { fx: 0.4 });
    rec.mark('results');
    await a.wait(1500);
    const fiche = panel.getByRole('button', { name: /La receveuse des postes/ }).first();
    await a.click(fiche, { fx: 0.4, fy: 0.35 });
    rec.mark('photo');
    await a.wait(2200);
    const reader = page.getByRole('tabpanel', { name: 'Lecteur' });
    const face = reader
      .locator('button.face')
      .filter({ hasText: /lunettes rondes/ })
      .first();
    // Défilement jusqu'aux « Visages de ce document ».
    const box = await face.boundingBox();
    const target = page.viewportSize()!.height * 0.5;
    await a.moveTo(a.x + 10, a.y + 80, 600);
    if (box) await a.wheel(Math.max(0, box.y - target), 2200);
    await a.wait(400);
    rec.mark('faces');
    await a.click(face, { fx: 0.3, fy: 0.3 });
    rec.mark('take');
    await a.wait(700);
    const slot = page.locator('[data-tree-view] [data-slot="c11"]');
    await a.click(slot, { fx: 0.5, fy: 0.5, settle: 350 });
    rec.mark('drop');
    await a.wait(1300);
    // Le métier, par la fiche de la case.
    await a.click(slot, { fx: 0.5, fy: 0.75 });
    const sheet = page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });
    await sheet.waitFor();
    rec.mark('sheet');
    await a.wait(900);
    await a.click(sheet.getByRole('button', { name: /^Métier\b/ }).first(), { fx: 0.3 });
    const picker = page.getByRole('dialog', { name: /^Choisir/ });
    await picker.waitFor();
    await a.wait(900);
    await a.click(picker.getByRole('option', { name: /^Receveuse des postes/ }).first(), {
      fx: 0.25,
    });
    rec.mark('picked');
    await a.wait(700);
    await page.keyboard.press('Escape');
    rec.mark('closed');
    const reveal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Continuer' }) });
    await reveal.first().waitFor({ timeout: 20_000 });
    rec.mark('reveal');
    await a.moveTo(a.x - 140, a.y + 40, 900);
    await a.wait(2600);
    await a.click(reveal.first().getByRole('button', { name: 'Continuer' }));
    rec.mark('stamp');
    await a.wait(3200);
  });
  await s.ctx.close();
};

/** La carte gravée de la Velmarche : survol des lieux. */
TAKES.carte = async (browser) => {
  const s = await open(browser, LANDSCAPE_HI);
  const { page } = s;
  await tab(page, /^Carte/);
  await tab(page, /^Catalogue/);
  await s.actor.wait(2500);
  await film(s, 'carte', LANDSCAPE_HI, async (rec, a) => {
    const map = page.locator('.map-panel').first();
    const box = (await map.boundingBox())!;
    await a.moveTo(box.x + box.width * 0.55, box.y + box.height * 0.55, 1200);
    await a.wait(500);
    const place = page.getByRole('button', { name: /Cap et phare de Tennok/i }).first();
    if (await place.isVisible().catch(() => false)) {
      await a.hover(place, 0.5, 0.5, 1600);
      rec.mark('tennok');
      await a.wait(1200);
    }
    const town = page.getByRole('button', { name: /^Aubrelieu/i }).first();
    if (await town.isVisible().catch(() => false)) {
      await a.hover(town, 0.5, 0.5, 1600);
      rec.mark('aubrelieu');
      await a.wait(1400);
    }
    await a.moveTo(box.x + box.width * 0.75, box.y + box.height * 0.7, 1400);
    await a.wait(800);
  });
  await s.ctx.close();
};

/** L'arbre : vue d'ensemble dézoomée, cases établies et tampons. */
TAKES.arbre = async (browser) => {
  const s = await open(browser, LANDSCAPE);
  const { page } = s;
  await tab(page, /^Arbre/);
  await tab(page, /^Journal/);
  const zoomOut = page.getByRole('button', { name: /Zoom arrière|Dézoomer|Réduire/i }).first();
  for (let i = 0; i < 3; i++)
    if (await zoomOut.isVisible().catch(() => false)) await zoomOut.click();
  await s.actor.wait(2000);
  await film(s, 'arbre', LANDSCAPE, async (rec, a) => {
    const wrap = page.locator('[data-tree-view="graph"]').first();
    const box = (await wrap.boundingBox())!;
    const y = box.y + box.height * 0.45;
    await a.moveTo(box.x + box.width * 0.7, y, 1000);
    await a.wait(300);
    await page.mouse.down();
    rec.mark('drag');
    await a.moveTo(box.x + box.width * 0.3, y + 30, 4200);
    await page.mouse.up();
    await a.wait(1200);
  });
  await s.ctx.close();
};

/** Téléphone (format vertical) : la case de Tenna, son métier, le tampon « Établi ». */
TAKES.mobile = async (browser) => {
  const s = await open(browser, PORTRAIT);
  const { page } = s;
  // Au doigt : pas de flèche, seulement l'anneau du toucher.
  await page.evaluate('window.__trailerCursor && window.__trailerCursor(false)');
  await page.locator('.gen-dot').nth(1).click();
  const slot = page.locator('[data-tree-view] [data-slot="c11"]').first();
  await slot.waitFor();
  // Hors champ : le visage de Tenna est déjà posé (vu au Catalogue dans le plan large).
  await slot.click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });
  await sheet
    .getByRole('button', { name: /^Portrait\b/ })
    .first()
    .click();
  const picker = page.getByRole('dialog', { name: /^Choisir/ });
  await picker
    .getByRole('button', { name: /lunettes rondes, taches de rousseur, fichu/ })
    .first()
    .click();
  await picker.waitFor({ state: 'hidden' });
  await page.keyboard.press('Escape');
  await sheet.waitFor({ state: 'hidden' });
  await slot.scrollIntoViewIfNeeded();
  await s.actor.wait(1500);
  await film(s, 'mobile', PORTRAIT, async (rec, a) => {
    await a.wait(600);
    await a.click(slot, { fx: 0.5, fy: 0.75 });
    await sheet.waitFor();
    rec.mark('sheet');
    await a.wait(900);
    await a.click(sheet.getByRole('button', { name: /^Métier\b/ }).first(), { fx: 0.3 });
    await picker.waitFor();
    await a.wait(700);
    await a.click(picker.getByRole('option', { name: /^Receveuse des postes/ }).first(), {
      fx: 0.25,
    });
    rec.mark('picked');
    await a.wait(600);
    await page.keyboard.press('Escape');
    const reveal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Continuer' }) });
    await reveal.first().waitFor({ timeout: 20_000 });
    rec.mark('reveal');
    await a.wait(2200);
    await a.click(reveal.first().getByRole('button', { name: 'Continuer' }));
    rec.mark('stamp');
    await a.wait(3000);
  });
  await s.ctx.close();
};

const browser = await chromium.launch();
const server = await serve(values.dist, PORT);
try {
  for (const [name, take] of Object.entries(TAKES)) {
    if (only && !only.has(name)) continue;
    console.log(`prise « ${name} »`);
    await take(browser);
  }
} finally {
  await browser.close();
  server.close();
}
