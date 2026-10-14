/**
 * Montage final : plans (`WORK/clips`), fondus enchaînés, cadrages, musique du jeu, normalisation
 * à −16 LUFS (EBU R128, crête vraie ≤ −1,5 dBTP), affiche et planche-contact.
 *
 *   npx tsx scripts/trailer/assemble.ts [--cut landscape|vertical|all]
 *
 * Sorties (OUT) : trailer-1080p.mp4, trailer-vertical-1080x1920.mp4, trailer-poster.jpg,
 * planche.jpg. Mesures (durée, poids, sonie) dans `WORK/mesures.json`.
 */
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { FPS, OUT, WORK, ensureDir, ffmpeg, ffmpegStderr, probeDuration } from './lib';
import {
  LANDSCAPE_CUT,
  VERTICAL_CUT,
  starts,
  totalDuration,
  type Cut,
  type Shot,
} from './timeline';

const { values } = parseArgs({ options: { cut: { type: 'string', default: 'all' } } });
const CLIPS = join(WORK, 'clips');
const SEGS = ensureDir(join(WORK, 'segments'));
ensureDir(OUT);

/** Un plan, découpé, recadré, à la taille de sortie. */
function segment(cut: Cut, shot: Shot, i: number): string {
  const out = join(SEGS, `${cut.name}-${String(i).padStart(2, '0')}.mp4`);
  const src = join(CLIPS, `${shot.clip}.mp4`);
  const dur = shot.to - shot.from;
  const n = Math.round(dur * FPS);
  const W = cut.width;
  const H = cut.height;
  let vf: string;
  if (shot.crop?.mode === 'push') {
    // Approche douce (cosinus) du plein cadre vers la fenêtre `crop`, sur une source doublée
    // (le recadrage au pixel entier devient invisible).
    const c = shot.crop;
    const p = `((1-cos(PI*min(on/${n - 1},1)))/2)`;
    vf =
      `scale=5760:3240:flags=lanczos,` +
      `zoompan=z='1/(1-${p}*${(1 - c.w / 2880).toFixed(5)})':x='${p}*${c.x * 2}':y='${p}*${c.y * 2}'` +
      `:d=1:s=${W}x${H}:fps=${FPS}`;
  } else if (shot.crop?.mode === 'hold') {
    const c = shot.crop;
    const h = Math.round((c.w * 9) / 16);
    vf = `crop=${c.w}:${h}:${c.x}:${c.y},scale=${W}:${H}:flags=lanczos`;
  } else {
    vf = `scale=${W}:${H}:flags=lanczos`;
  }
  ffmpeg(
    [
      '-ss',
      shot.from.toFixed(3),
      '-t',
      dur.toFixed(3),
      '-i',
      src,
      '-vf',
      `${vf},fps=${FPS},setsar=1,format=yuv420p`,
      '-frames:v',
      String(n),
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '12',
      out,
    ],
    { quiet: true },
  );
  return out;
}

function loudness(file: string): { I: number; TP: number; LRA: number } {
  const err = ffmpegStderr(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const summary = err.slice(err.lastIndexOf('Summary:'));
  const num = (re: RegExp) => Number(re.exec(summary)?.[1] ?? NaN);
  return {
    I: num(/I:\s+(-?[\d.]+) LUFS/),
    TP: num(/Peak:\s+(-?[\d.]+) dBFS/),
    LRA: num(/LRA:\s+(-?[\d.]+) LU/),
  };
}

function mixAudio(cut: Cut, dur: number): string {
  const dir = join(WORK, 'audio');
  const pre = join(dir, `${cut.name}-mix.wav`);
  const fadeOut = 3.2;
  ffmpeg(
    [
      '-i',
      join(dir, `${cut.name}-music.wav`),
      '-i',
      join(dir, `${cut.name}-sfx.wav`),
      '-filter_complex',
      `[0:a]afade=t=in:d=1.6:curve=qsin,afade=t=out:st=${(dur - fadeOut).toFixed(2)}:d=${fadeOut}:curve=qsin[m];` +
        `[1:a]volume=2.0[s];[m][s]amix=inputs=2:normalize=0:duration=first,atrim=0:${dur.toFixed(3)}[a]`,
      '-map',
      '[a]',
      '-c:a',
      'pcm_f32le',
      '-ar',
      '48000',
      pre,
    ],
    { quiet: true },
  );
  // Normalisation en deux passes (mode linéaire : aucune compression audible).
  const err = ffmpegStderr([
    '-i',
    pre,
    '-af',
    'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
    '-f',
    'null',
    '-',
  ]);
  const json = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1)) as Record<
    string,
    string
  >;
  const out = join(dir, `${cut.name}-master.wav`);
  ffmpeg(
    [
      '-i',
      pre,
      '-af',
      `loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:measured_I=${json.input_i}:measured_TP=${json.input_tp}` +
        `:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}:offset=${json.target_offset},` +
        `alimiter=limit=0.84:attack=5:release=80:level=false,aresample=48000`,
      '-c:a',
      'pcm_s24le',
      out,
    ],
    { quiet: true },
  );
  return out;
}

function assemble(cut: Cut): Record<string, unknown> {
  console.log(`montage « ${cut.name} »`);
  const segs = cut.shots.map((s, i) => segment(cut, s, i));
  const st = starts(cut);
  const dur = totalDuration(cut);
  const inputs = segs.flatMap((s) => ['-i', s]);
  let graph = '';
  let last = '[0:v]';
  for (let i = 1; i < segs.length; i++) {
    const tag = i === segs.length - 1 ? '[x]' : `[v${i}]`;
    graph += `${last}[${i}:v]xfade=transition=fade:duration=${cut.xfade}:offset=${st[i]!.toFixed(3)}${tag};`;
    last = tag;
  }
  graph += `[x]fade=t=in:st=0:d=0.9,fade=t=out:st=${(dur - 1.4).toFixed(2)}:d=1.4,format=yuv420p[v]`;
  const audio = mixAudio(cut, dur);
  const file = join(OUT, `${cut.name}.mp4`);
  ffmpeg(
    [
      ...inputs,
      '-i',
      audio,
      '-filter_complex',
      graph,
      '-map',
      '[v]',
      '-map',
      `${segs.length}:a`,
      '-t',
      dur.toFixed(3),
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '17',
      '-maxrate',
      '9M',
      '-bufsize',
      '18M',
      '-profile:v',
      'high',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      '-g',
      String(FPS * 2),
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-movflags',
      '+faststart',
      '-metadata',
      'title=L’Arbre aux absents — bande-annonce',
      '-metadata',
      'artist=CM Interactive, CM Creative Lab',
      file,
    ],
    { quiet: true },
  );
  const loud = loudness(file);
  const size = statSync(file).size;
  const real = probeDuration(file);
  console.log(
    `  ${file} : ${real.toFixed(2)} s, ${(size / 1024 / 1024).toFixed(1)} Mo, ${loud.I} LUFS, crête ${loud.TP} dBTP, LRA ${loud.LRA} LU`,
  );
  return { file, duration: real, bytes: size, loudness: loud, starts: st };
}

const results: Record<string, unknown> = {};
const doL = values.cut !== 'vertical';
const doV = values.cut !== 'landscape';
if (doL) results.landscape = assemble(LANDSCAPE_CUT);
if (doV) results.vertical = assemble(VERTICAL_CUT);

if (doL) {
  const main = join(OUT, `${LANDSCAPE_CUT.name}.mp4`);
  // Affiche : l'art clé, le titre encré (fin du plan d'ouverture).
  ffmpeg(
    ['-ss', '6.6', '-i', main, '-frames:v', '1', '-q:v', '2', join(OUT, 'trailer-poster.jpg')],
    {
      quiet: true,
    },
  );
  // Planche-contact : 12 images réparties sur le film.
  const d = probeDuration(main);
  const step = d / 12;
  ffmpeg(
    [
      '-i',
      main,
      '-vf',
      `fps=1/${step.toFixed(4)}:start_time=${(step / 2).toFixed(3)},scale=640:360:flags=lanczos,` +
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='%{pts\\:hms}':x=12:y=h-30:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6,` +
        `tile=4x3:padding=8:margin=8:color=0x101a33`,
      '-frames:v',
      '1',
      '-q:v',
      '3',
      join(OUT, 'planche.jpg'),
    ],
    { quiet: true },
  );
}
const prev = (() => {
  try {
    return JSON.parse(readFileSync(join(WORK, 'mesures.json'), 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
})();
writeFileSync(join(WORK, 'mesures.json'), JSON.stringify({ ...prev, ...results }, null, 1));
