import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRunStore } from './run-store.mjs';
test('unique runs and immutable records', () => {
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'run-store-'));
 const a=createRunStore(base), b=createRunStore(base);
 assert.notEqual(a.dir,b.dir);
 const first=a.save('assertion',{pass:false});const bytes=fs.readFileSync(first,'utf8');
 a.save('assertion',{pass:true});assert.equal(fs.readFileSync(first,'utf8'),bytes);
 assert.equal(fs.readdirSync(a.dir).length,3);
 fs.rmSync(base,{recursive:true});
});
test('saved assertion survives abrupt process termination', () => {
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'run-crash-'));
 const module=new URL('./run-store.mjs',import.meta.url).href;
 const child=spawnSync(process.execPath,['--input-type=module','-e',`import {createRunStore} from ${JSON.stringify(module)};const r=createRunStore(${JSON.stringify(base)});r.save('assertion',{pass:false});process.kill(process.pid,'SIGKILL');`]);
 assert.equal(child.signal,'SIGKILL');
 const dir=path.join(base,fs.readdirSync(base)[0]);
 const files=fs.readdirSync(dir);assert.equal(files.length,2);
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,files[1]))).data.pass,false);
 fs.rmSync(base,{recursive:true});
});
