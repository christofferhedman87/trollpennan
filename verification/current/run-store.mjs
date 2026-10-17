import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export function createRunStore(base) {
  const id = new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID();
  const dir = path.join(base, id);
  fs.mkdirSync(dir, { recursive: true });
  let seq = 0;
  function save(type, data) {
    const file = path.join(dir, String(++seq).padStart(6, '0') + '-' + type + '.json');
    const text = JSON.stringify({ seq, type, data }, null, 2);
    const fd = fs.openSync(file, 'wx');
    try { fs.writeFileSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    if (fs.readFileSync(file, 'utf8') !== text) throw new Error('Run record verification failed');
    return file;
  }
  save('start', { id, status: 'RUNNING' });
  return { id, dir, save };
}
