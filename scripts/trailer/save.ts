/**
 * Sauvegarde de tournage de la bande-annonce (scripts/trailer) : une partie réelle de l'affaire
 * « Succession Varenque », jouée par le moteur pur en suivant le parcours du solveur, arrêtée
 * dès que le prologue et trois cases du Cap sont plaçables. Rien de tardif n'est rempli :
 * prologue établi, Cap à moitié (Firmin, Maaren, Aldrik établis à l'écran ; Tenna nommée, son
 * visage et son métier restent à poser devant la caméra).
 *
 * Sortie : JSON { state, summary, profile } sur stdout (ou --out <fichier>).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  DEFAULT_SETTINGS,
  type Action,
  type CompiledCase,
  type Profile,
  type SaveState,
} from '@arbre/contract';
import { engine } from '@arbre/engine';
import { checkContentRoot, resolveRoot } from '@arbre/content-tools';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CASE = 'succession-varenque';
const { values } = parseArgs({
  options: { out: { type: 'string' }, verbose: { type: 'boolean' } },
});

const casePath = join(REPO, `apps/game/src/generated/case.full.fr.${CASE}.json`);
const c = ((): CompiledCase => {
  try {
    return JSON.parse(readFileSync(casePath, 'utf8')) as CompiledCase;
  } catch {
    throw new Error(`affaire ${CASE} introuvable (npm run content:build ?)`);
  }
})();

interface Person {
  id: string;
  given: string[];
  family: string[];
  occupation: string;
  portrait: string;
}
const family = JSON.parse(
  readFileSync(join(REPO, `content/cases/${CASE}/family.json`), 'utf8'),
) as { persons: Person[] };
const tree = JSON.parse(readFileSync(join(REPO, `content/cases/${CASE}/tree.json`), 'utf8')) as {
  slots: { id: string; person: string }[];
};
const personOf = (slot: string): Person => {
  const pid = tree.slots.find((s) => s.id === slot)?.person;
  const p = family.persons.find((x) => x.id === pid);
  if (!p) throw new Error(`case ${slot} sans personne`);
  return p;
};
const answer = (slot: string) => {
  const p = personOf(slot);
  return {
    given: p.given[0]!,
    family: p.family[0]!,
    portrait: p.portrait,
    occupation: p.occupation,
  };
};

/** Prologue entier, puis deux cases du Cap (le seuil est 3 : le groupe reste ouvert). */
const FULL = ['c01', 'c02', 'c05', 'c03', 'c04'];
/** Aldrik : nommé seulement. */
const NAMED_TOO = 'c10';
/** Tenna : nommée seulement ; visage et métier sont posés à l'écran. */
const NAMED = 'c11';
/** Lucien (l'Atelier) : nommé, pour une case « entamée ». */
const STARTED = 'c07';

let at = Date.UTC(2026, 9, 10, 19, 0, 0);
const tick = () => (at += 47_000);

function apply(s: SaveState, a: Action): SaveState {
  const t = engine.applyAction(s, a, c!);
  return t.state;
}

/** Vrai si toutes les réponses voulues sont plaçables dans l'état `s`. */
function ready(s: SaveState): boolean {
  let t = s;
  for (const slot of [...FULL, NAMED, NAMED_TOO]) {
    const r = engine.applyAction(t, { type: 'setSlot', slot, patch: answer(slot), at }, c!);
    if (r.events.some((e) => e.type === 'rejected')) return false;
    t = r.state;
  }
  return true;
}

const root = await resolveRoot(undefined);
const result = await checkContentRoot(root);
const solved = result.cases.find((k) => k.id === CASE)?.solve;
if (!solved) throw new Error('solveur : affaire non résolue');

let s = engine.newGame(c, { slot: 'slot-1', mode: 'standard' as SaveState['mode'], at });
s = engine.settle(s, c).state;
let steps = 0;
const skipped: string[] = [];
for (const st of solved.steps.slice(1)) {
  if (ready(s)) break;
  const a = st.action;
  if (a.type === 'lock') continue;
  steps++;
  const before = Object.keys(s.secrets).length;
  const prev = s;
  if (a.type === 'read') s = apply(s, { type: 'openDocument', id: a.id, at: tick() });
  else if (a.type === 'visit') s = apply(s, { type: 'visitPlace', id: a.id, at: tick() });
  else if (a.type === 'search') {
    const kw = c.keywords[a.id];
    s = apply(s, { type: 'search', query: kw?.label ?? a.id, at: tick() });
  }
  // Aucun secret découvert dans la partie filmée (pas de divulgation, même dans le Journal).
  if (Object.keys(s.secrets).length > before) {
    s = prev;
    skipped.push(`${a.type} ${a.id}`);
  }
}
if (!ready(s)) throw new Error('parcours épuisé avant que les cases soient plaçables');

for (const slot of FULL) {
  for (const [k, v] of Object.entries(answer(slot))) {
    s = apply(s, { type: 'setSlot', slot, patch: { [k]: v }, at: tick() });
  }
}
const t = answer(NAMED);
s = apply(s, {
  type: 'setSlot',
  slot: NAMED,
  patch: { given: t.given, family: t.family },
  at: tick(),
});
const al = answer(NAMED_TOO);
s = apply(s, { type: 'setSlot', slot: NAMED_TOO, patch: { given: al.given }, at: tick() });
const l = answer(STARTED);
const started = engine.applyAction(
  s,
  { type: 'setSlot', slot: STARTED, patch: { given: l.given }, at: tick() },
  c,
);
if (!started.events.some((e) => e.type === 'rejected')) s = started.state;

s = { ...s, elapsedMs: 2 * 3600_000 + 17 * 60_000 };
const summary = engine.summarize(s, c);
const info = {
  steps,
  skipped,
  read: Object.keys(s.read).length,
  unlocked: Object.keys(s.unlocked).length,
  locked: Object.keys(s.locked),
  secrets: Object.keys(s.secrets),
  revealed: s.revealedSlots,
  tree: s.tree,
};
if (values.verbose) console.error(JSON.stringify(info, null, 1));
// Profil : tutoriel passé (« J'ai déjà joué ») et succès déjà obtenus, pour qu'aucune
// notification ne couvre l'image pendant le tournage.
const profile: Profile = {
  schemaVersion: 1,
  settings: structuredClone(DEFAULT_SETTINGS) as Profile['settings'],
  achievements: Object.fromEntries(c.achievements.map((a) => [a.id, at])),
  completed: {},
  tutorial: { done: true, seen: [] },
};
const out = JSON.stringify({ state: s, summary, profile });
if (values.out) writeFileSync(values.out, out);
else console.log(out);
