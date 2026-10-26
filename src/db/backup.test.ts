import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { BackupError, exportData, importData, parseBackup } from './backup';
import { saveTechnique } from './techniques';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function addKimura() {
  return saveTechnique({
    name: { es: 'Kimura' },
    category: 'submission',
    type: 'submission',
    description: {},
    steps: [],
    media: [],
    modes: ['gi'],
    counterpartIds: [],
  });
}

describe('backup', () => {
  it('round-trips every table through export and import', async () => {
    const kimura = await addKimura();
    const json = JSON.stringify(await exportData());

    await db.techniques.clear();
    await importData(parseBackup(json));

    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });

  it('rejects a file from another app and leaves stored data unchanged', async () => {
    const kimura = await addKimura();

    expect(() => parseBackup(JSON.stringify({ app: 'opengym', version: 1, data: {} }))).toThrow(BackupError);
    expect(() => parseBackup('not json')).toThrow(BackupError);
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });

  it('rejects malformed records before touching the database', async () => {
    const kimura = await addKimura();
    const backup = await exportData();
    const broken = { ...backup, data: { ...backup.data, techniques: [{ id: 'x', category: 'nope' }] } };

    expect(() => parseBackup(JSON.stringify(broken))).toThrow(BackupError);
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });

  it('rejects a newer backup version', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'openjiujitsu', version: 99, data: {} }))).toThrow(BackupError);
  });
});
