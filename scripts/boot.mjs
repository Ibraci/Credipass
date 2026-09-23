import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {loadLocalEnv} from './lib/env-loader.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
loadLocalEnv(root);
await import('./serve.mjs');
