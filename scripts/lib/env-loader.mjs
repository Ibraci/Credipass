import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export function loadLocalEnv(root=process.cwd()){
  const file=resolve(root,'.env.local');
  if(!existsSync(file))return false;
  for(const raw of readFileSync(file,'utf8').split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith('#'))continue;
    const i=line.indexOf('=');if(i<1)continue;
    const key=line.slice(0,i).trim().replace(/^\uFEFF/,'');let value=line.slice(i+1).trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    if(process.env[key]===undefined)process.env[key]=value;
  }
  return true;
}
