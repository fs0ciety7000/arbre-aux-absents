/**
 * Musique de la bande-annonce : la musique générative du jeu (humeurs « Titre » et « Bureau »,
 * ambiance de pluie, tampon et accord de l'« Établi »), rendue hors ligne dans Chromium
 * (OfflineAudioContext) avec les modules audio du jeu, aux repères de `timeline.ts`.
 *
 *   npx tsx scripts/trailer/audio.ts [--seed 1974] [--cut landscape|vertical|all]
 *
 * Sortie : `WORK/audio/<cut>-music.wav` et `<cut>-sfx.wav` (stéréo, 48 kHz, flottant 32 bits),
 * mixés et normalisés par `assemble.ts`.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import type { RenderJob } from './audio-entry';
import { REPO, WORK, ensureDir } from './lib';
import { LANDSCAPE_CUT, VERTICAL_CUT, starts, totalDuration, type Cut } from './timeline';

const { values } = parseArgs({
  options: { seed: { type: 'string', default: '1974' }, cut: { type: 'string', default: 'all' } },
});
const SR = 48_000;

function jobFor(cut: Cut, seed: number): RenderJob {
  const st = starts(cut);
  const shotStart = (i: number) => st[i]!;
  return {
    duration: totalDuration(cut) + 0.6,
    sampleRate: SR,
    seed,
    moods: cut.moods.map((m) => ({ at: shotStart(m.shot), mood: m.mood, layers: m.layers })),
    sfx: cut.sfx.map((e) => ({
      at: shotStart(e.shot) + (e.at - cut.shots[e.shot]!.from),
      name: e.name,
    })),
  };
}

/** WAV stéréo en flottant 32 bits (format 3). */
function wav(file: string, left: Float32Array, right: Float32Array, sr: number): void {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 8);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 8, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(3, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 8, 28);
  buf.writeUInt16LE(8, 32);
  buf.writeUInt16LE(32, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) {
    buf.writeFloatLE(left[i]!, 44 + i * 8);
    buf.writeFloatLE(right[i]!, 48 + i * 8);
  }
  writeFileSync(file, buf);
}

const bundle = await build({
  entryPoints: [join(REPO, 'scripts/trailer/audio-entry.ts')],
  bundle: true,
  format: 'iife',
  write: false,
  target: 'chrome120',
  logLevel: 'error',
});
const code = bundle.outputFiles[0]!.text;

const browser = await chromium.launch();
const dir = ensureDir(join(WORK, 'audio'));
try {
  const cuts =
    values.cut === 'landscape'
      ? [LANDSCAPE_CUT]
      : values.cut === 'vertical'
        ? [VERTICAL_CUT]
        : [LANDSCAPE_CUT, VERTICAL_CUT];
  for (const cut of cuts) {
    const page = await browser.newPage();
    await page.addScriptTag({ content: code });
    const job = jobFor(cut, Number(values.seed));
    const chans = (await page.evaluate(
      (j) =>
        (
          globalThis as unknown as { renderTrailerAudio: (j: RenderJob) => Promise<string[]> }
        ).renderTrailerAudio(j),
      job,
    )) as string[];
    const f = chans.map((b64) => {
      const b = Buffer.from(b64, 'base64');
      return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
    });
    wav(join(dir, `${cut.name}-music.wav`), f[0]!, f[1]!, SR);
    wav(join(dir, `${cut.name}-sfx.wav`), f[2]!, f[3]!, SR);
    await page.close();
    console.log(`  ${cut.name} : ${job.duration.toFixed(1)} s, graine ${job.seed}`);
  }
} finally {
  await browser.close();
}
