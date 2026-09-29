// SPDX-License-Identifier: LGPL-3.0-or-later
// Requires the user's existing ElevenLabs helper on qinda. No credentials leave qinda.
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {mkdir,rename,unlink,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {narration,outcomeScripts,filmScripts} from '../dist/narration.mjs';
const directory=new URL('../dist/assets/audio/',import.meta.url);
const voices={narrator:'EgYNzoqPUFlQOBv5O6y2',partner:'nPczCjzI2devNBz1zQrb'};
const jobs=[...Object.entries(narration).map(([id,part])=>({id,text:part.text,voice:voices.narrator})),
  ...Object.entries(outcomeScripts).map(([id,text])=>({id,text,voice:voices.partner})),
  ...filmScripts.map(part=>({...part,voice:voices.narrator}))];
await mkdir(directory,{recursive:true});
async function generate(job){
  const target=fileURLToPath(new URL(`${job.id}.mp3`,directory));
  try{if((await stat(target)).size>2000){process.stdout.write(`Existing: ${job.id}\n`);return;}}catch{}
  if(!/^[A-Za-z0-9]{20}$/.test(job.voice))throw new Error('Invalid voice ID');
  const temporary=`${target}.tmp`;
  const command=`set -a; . ~/Adulting/api-keys.env >/dev/null 2>&1; set +a; SAY_VOICE=${job.voice} python3 ~/.local/share/codex-voice/tts.py`;
  const output=createWriteStream(temporary);
  const processAudio=spawn('ssh',['-o','BatchMode=yes','qinda',command],{stdio:['pipe','pipe','ignore']});
  processAudio.stdout.pipe(output);
  processAudio.stdin.end(job.text);
  const timer=setTimeout(()=>processAudio.kill('SIGTERM'),90000);
  const [code]=await Promise.all([new Promise((resolve,reject)=>{processAudio.on('close',resolve);processAudio.on('error',reject);}),new Promise((resolve,reject)=>{output.on('finish',resolve);output.on('error',reject);})]);
  clearTimeout(timer);
  if(code!==0||(await stat(temporary)).size<2000){await unlink(temporary).catch(()=>{});throw new Error(`Audio generation failed: ${job.id}`);}
  await rename(temporary,target);process.stdout.write(`Recorded: ${job.id}\n`);
}
let cursor=0;
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++];await generate(job);}}
await Promise.all([worker(),worker()]);
process.stdout.write(`Finished ${jobs.length} ElevenLabs recordings.\n`);
