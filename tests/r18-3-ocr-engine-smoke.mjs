import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
for(const bin of ['tesseract','pdftoppm']){const out=execFileSync('which',[bin],{encoding:'utf8'}).trim();assert.ok(out,bin)}
const langs=execFileSync('tesseract',['--list-langs'],{encoding:'utf8',stderr:'ignore'});assert.match(langs,/\bfra\b/);assert.match(langs,/\beng\b/);
console.log('R18.3 OCR ENGINE SMOKE: PASS — Tesseract + fra/eng + pdftoppm disponibles');
