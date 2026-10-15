import { describe, expect, it, vi } from 'vitest';
import {
  AttachmentQueue,
  fitScale,
  fitsAsIs,
  imageFiles,
  type AttachmentItem,
  type AttachmentLimits,
  type UploadResult,
} from './attachments';

const LIMITS: AttachmentLimits = {
  max: 3,
  bytes: 2 * 1024 * 1024,
  side: 8192,
  pixels: 40_000_000,
  types: ['image/png', 'image/jpeg', 'image/webp'],
};

const png = (name = 'a.png', size = 10) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });

/** Attend que les promesses en cours (préparation, envoi) soient résolues. */
const settle = () => new Promise((r) => setTimeout(r, 0));

function setup(upload: (blob: Blob) => Promise<UploadResult>, now = () => 1_000) {
  const removed: string[] = [];
  let items: AttachmentItem[] = [];
  let n = 0;
  const queue = new AttachmentQueue({
    limits: LIMITS,
    upload,
    remove: async (id) => {
      removed.push(id);
    },
    prepare: async (file) => ({ ok: true, blob: file }),
    onchange: (next) => (items = next),
    now,
    createUrl: () => `blob:test/${++n}`,
    revokeUrl: () => undefined,
  });
  return { queue, removed, items: () => items };
}

const receipt = (id: string, expiresAt = 3_600_000) => ({
  ok: true as const,
  receipt: { id, expiresAt, width: 10, height: 10, bytes: 10 },
});

describe('AttachmentQueue', () => {
  it('envoie chaque image, garde l’ordre, ignore au-delà de 3', async () => {
    let i = 0;
    const upload = vi.fn(async () => receipt(`id-${++i}`));
    const { queue, items } = setup(upload);
    expect(queue.add([png('1.png'), png('2.png')])).toBe(2);
    expect(items().map((x) => x.status)).toEqual(['preparing', 'preparing']);
    await settle();
    expect(items().map((x) => x.status)).toEqual(['ready', 'ready']);
    expect(queue.ids).toEqual(['id-1', 'id-2']);
    expect(queue.add([png('3.png'), png('4.png')])).toBe(1);
    await settle();
    expect(queue.ids).toHaveLength(3);
    expect(upload).toHaveBeenCalledTimes(3);
  });

  it('échec d’envoi : erreur affichable, puis nouvel essai réussi', async () => {
    const upload = vi
      .fn<(b: Blob) => Promise<UploadResult>>()
      .mockResolvedValueOnce({ ok: false, error: 'offline' })
      .mockResolvedValueOnce(receipt('ok-1'));
    const { queue, items } = setup(upload);
    queue.add([png()]);
    await settle();
    expect(items()[0]).toMatchObject({ status: 'error', error: 'offline' });
    expect(queue.ids).toEqual([]);
    queue.retry(items()[0]!.key);
    await settle();
    expect(queue.ids).toEqual(['ok-1']);
  });

  it('retrait : DELETE de la pièce envoyée ; retirée pendant l’envoi, supprimée à l’arrivée', async () => {
    let resolve!: (r: UploadResult) => void;
    const upload = vi
      .fn<(b: Blob) => Promise<UploadResult>>()
      .mockResolvedValueOnce(receipt('first'))
      .mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    const { queue, items, removed } = setup(upload);
    queue.add([png()]);
    await settle();
    queue.remove(items()[0]!.key);
    await settle();
    expect(removed).toEqual(['first']);
    expect(items()).toEqual([]);

    queue.add([png()]);
    await settle();
    expect(items()[0]!.status).toBe('uploading');
    queue.remove(items()[0]!.key);
    resolve(receipt('late'));
    await settle();
    expect(removed).toEqual(['first', 'late']);
    expect(queue.ids).toEqual([]);
  });

  it('pièce expirée (ou presque) : renvoyée avant le signalement', async () => {
    let t = 1_000;
    let i = 0;
    const upload = vi.fn(async () => receipt(`id-${++i}`, t + 3_600_000));
    const { queue } = setup(upload, () => t);
    queue.add([png()]);
    await settle();
    expect(await queue.fresh()).toEqual(['id-1']);
    t += 3_550_000; // 58 min 20 s plus tard : moins de 2 min de marge.
    expect(await queue.fresh()).toEqual(['id-2']);
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('abandon : vignettes libérées et pièces supprimées ; après envoi, rien n’est supprimé', async () => {
    const a = setup(async () => receipt('kept'));
    a.queue.add([png()]);
    await settle();
    a.queue.clear();
    expect(a.removed).toEqual([]);
    expect(a.items()).toEqual([]);

    const b = setup(async () => receipt('dropped'));
    b.queue.add([png()]);
    await settle();
    b.queue.dispose(true);
    await settle();
    expect(b.removed).toEqual(['dropped']);
  });

  it('préparation refusée : erreur de type, aucun envoi', async () => {
    const upload = vi.fn(async () => receipt('x'));
    const queue = new AttachmentQueue({
      limits: LIMITS,
      upload,
      remove: async () => undefined,
      prepare: async () => ({ ok: false, error: 'type' }),
      onchange: () => undefined,
    });
    queue.add([new File(['x'], 'a.txt', { type: 'image/x-unknown' })]);
    await settle();
    expect(queue.items[0]).toMatchObject({ status: 'error', error: 'type', src: '' });
    expect(upload).not.toHaveBeenCalled();
  });
});

describe('réduction des images', () => {
  it('fitScale : côté et surface plafonnés, jamais agrandi', () => {
    expect(fitScale(1920, 1080, LIMITS)).toBe(1);
    expect(fitScale(16384, 4096, LIMITS)).toBeCloseTo(0.5, 5);
    const s = fitScale(8000, 8000, LIMITS);
    expect(8000 * s * (8000 * s)).toBeLessThanOrEqual(40_000_000 + 1);
    expect(fitScale(1000, 1000, LIMITS, 0.5)).toBe(0.5);
  });

  it('fitsAsIs : type, poids et dimensions', () => {
    expect(fitsAsIs('image/png', 1000, 800, 600, LIMITS)).toBe(true);
    expect(fitsAsIs('image/gif', 1000, 800, 600, LIMITS)).toBe(false);
    expect(fitsAsIs('image/png', 3 * 1024 * 1024, 800, 600, LIMITS)).toBe(false);
    expect(fitsAsIs('image/png', 1000, 9000, 600, LIMITS)).toBe(false);
  });

  it('imageFiles : seulement les images d’un presse-papiers', () => {
    const img = png();
    const data = {
      items: [
        { kind: 'string', type: 'text/plain', getAsFile: () => null },
        { kind: 'file', type: 'image/png', getAsFile: () => img },
        { kind: 'file', type: 'application/pdf', getAsFile: () => new File([], 'x.pdf') },
      ],
      files: [],
    } as unknown as DataTransfer;
    expect(imageFiles(data)).toEqual([img]);
    expect(imageFiles(null)).toEqual([]);
  });
});
