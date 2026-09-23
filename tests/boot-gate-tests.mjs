import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const entry = path.join(root, 'src', 'app.js');
const seen = new Set();
const errors = [];
let moduleCount = 0;

function exportsOf(source) {
  const names = new Set();
  for (const m of source.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of source.matchAll(/export\s*\{([^}]+)\}/gs)) {
    for (const raw of m[1].split(',')) {
      const part = raw.trim(); if (!part) continue;
      const bits = part.split(/\s+as\s+/); names.add(bits.at(-1).trim());
    }
  }
  if (/export\s+default\b/.test(source)) names.add('default');
  return names;
}

function resolveImport(from, spec) {
  let target = path.resolve(path.dirname(from), spec);
  if (!path.extname(target)) target += '.js';
  return target;
}

function visit(file) {
  file = path.resolve(file);
  if (seen.has(file)) return;
  seen.add(file); moduleCount++;
  if (!fs.existsSync(file)) { errors.push(`Module absent: ${path.relative(root,file)}`); return; }
  const source = fs.readFileSync(file,'utf8');
  const imports = [];
  for (const m of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/gs)) imports.push({kind:'named',names:m[1],spec:m[2]});
  for (const m of source.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from\s*['"]([^'"]+)['"]/g)) imports.push({kind:'default',names:m[1],spec:m[2]});
  for (const m of source.matchAll(/import\s+\*\s+as\s+[A-Za-z_$][\w$]*\s+from\s*['"]([^'"]+)['"]/g)) imports.push({kind:'namespace',spec:m[1]});
  for (const m of source.matchAll(/import\s*['"]([^'"]+)['"]/g)) imports.push({kind:'side',spec:m[1]});
  for (const imp of imports) {
    if (!imp.spec.startsWith('.')) continue;
    const target = resolveImport(file, imp.spec);
    if (!fs.existsSync(target)) { errors.push(`${path.relative(root,file)} -> module absent ${imp.spec}`); continue; }
    const targetSource=fs.readFileSync(target,'utf8');
    const ex=exportsOf(targetSource);
    if (imp.kind==='named') {
      for (const raw of imp.names.split(',')) {
        const part=raw.trim(); if(!part) continue;
        const imported=part.split(/\s+as\s+/)[0].trim();
        if (!ex.has(imported)) errors.push(`${path.relative(root,file)} demande ${imported} à ${imp.spec}, export absent`);
      }
    } else if (imp.kind==='default' && !ex.has('default')) errors.push(`${path.relative(root,file)} demande export default à ${imp.spec}, absent`);
    visit(target);
  }
}

visit(entry);
if (errors.length) {
  console.error('BOOT_GATE_FAIL');
  for (const e of errors) console.error(' - '+e);
  process.exit(1);
}
console.log(`BOOT_GATE_PASS modules=${moduleCount} imports/exports=coherents`);
