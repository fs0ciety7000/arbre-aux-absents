import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReportReceipt } from '@arbre/contract';
import { ReportReceiptSchema } from '@arbre/contract';
import { initDatabase } from '../src/db';
import type { FetchLike } from '../src/github';
import type { ReportServer } from '../src/server';
import { createReportServer } from '../src/server';
import { Clock, FakeGitHub, ORIGIN, post, submission, testConfig } from './helpers';

/**
 * File `pending` (ARCHITECTURE §8, D13) : une suppression demandée pendant qu'un passage de la
 * file est en cours doit être respectée, même pour un ticket déjà sélectionné par ce passage.
 */

interface Gated {
  app: ReportServer;
  base: string;
  gh: FakeGitHub;
  clock: Clock;
  /** Créations GitHub retenues (POST /issues) tant que `release()` n'est pas appelé. */
  held: () => number;
  hold: () => void;
  release: () => void;
  close(): Promise<void>;
}

let g: Gated | undefined;
afterEach(async () => {
  g?.release();
  await g?.close();
  g = undefined;
});

async function startGated(): Promise<Gated> {
  const gh = new FakeGitHub();
  const clock = new Clock();
  const db = initDatabase(new DatabaseSync(':memory:'));
  let holding = false;
  let waiting: (() => void)[] = [];
  const fetch: FetchLike = async (input, init) => {
    if (holding && init?.method === 'POST') {
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    return gh.fetch(input, init);
  };
  const app = createReportServer({ config: testConfig(), db, fetch, now: clock.now });
  const port = await app.listen(0, '127.0.0.1');
  return {
    app,
    base: `http://127.0.0.1:${port}`,
    gh,
    clock,
    held: () => waiting.length,
    hold: () => {
      holding = true;
    },
    release: () => {
      holding = false;
      const w = waiting;
      waiting = [];
      for (const r of w) r();
    },
    async close() {
      await app.close();
      db.close();
    },
  };
}

async function submit(base: string, description: string): Promise<ReportReceipt> {
  // Clés de débit distinctes : trois joueurs différents.
  const res = await post(base, submission({ description }), {
    'CF-Connecting-IP': `203.0.113.${description.length}`,
  });
  expect(res.status).toBe(201);
  return ReportReceiptSchema.parse(await res.json()) as ReportReceipt;
}

describe('file pending et suppression', () => {
  it('DELETE pendant un passage de la file : le ticket déjà sélectionné n’est jamais créé sur GitHub', async () => {
    g = await startGated();
    // GitHub en panne : trois signalements attendent dans la file.
    g.gh.failure = 503;
    const texts = [
      'Premier signalement : la carte ne se déplie plus du tout.',
      'Deuxième signalement : le lecteur reste blanc après la loupe.',
      'Troisième signalement, à supprimer : contient une donnée personnelle.',
    ];
    const receipts: ReportReceipt[] = [];
    for (const d of texts) {
      receipts.push(await submit(g.base, d));
      await g.app.service.drain();
    }
    expect(g.app.service.pendingCount()).toBe(3);

    // GitHub revient, lentement : le passage prend les trois tickets, deux créations en vol
    // (concurrence 2), le troisième attend son tour.
    const failed = g.gh.calls.length; // essais refusés (503) : rien n'a été créé
    g.gh.failure = null;
    g.clock.advance(60_000);
    g.hold();
    const pass = g.app.service.drain();
    await expect.poll(() => g!.held()).toBe(2);

    // Le joueur supprime son troisième signalement pendant ce temps.
    const del = await fetch(`${g.base}/v1/tickets/current`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${receipts[2]!.token}`, Origin: ORIGIN },
    });
    expect(del.status).toBe(204);

    g.release();
    await pass;
    await g.app.service.drain();

    const created = g.gh.calls.slice(failed).filter((c) => c.method === 'POST');
    const bodies = created.map((c) => (c.body as { body: string }).body).join('\n');
    expect(bodies).toContain('Premier signalement');
    expect(bodies).toContain('Deuxième signalement');
    // Demande de suppression respectée : ni ticket GitHub, ni texte envoyé.
    expect(bodies).not.toContain('donnée personnelle');
    expect([...g.gh.issues.values()].map((i) => i.body).join('\n')).not.toContain(
      'donnée personnelle',
    );
    expect(g.app.store.byTicket(receipts[2]!.ticket)).toBeUndefined();
  });
});
