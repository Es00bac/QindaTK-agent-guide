// SPDX-License-Identifier: LGPL-3.0-or-later
import {spawnSync} from 'node:child_process';
import {writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {filmScripts} from '../dist/narration.mjs';
const video=fileURLToPath(new URL('../dist/assets/video/office-tour.mp4',import.meta.url));
const original=process.argv[2]??fileURLToPath(new URL('../../container-wm/website/assets/video/office-tour.mp4',import.meta.url));
const temporary=`${video}.tmp.mp4`;
const inputs=filmScripts.flatMap(part=>['-i',fileURLToPath(new URL(`../dist/assets/audio/${part.id}.mp3`,import.meta.url))]);
const filters=filmScripts.map((part,index)=>`[${index+1}:a]apad,atrim=duration=${part.duration},asetpts=PTS-STARTPTS[a${index}]`);
filters.push(`${filmScripts.map((_,index)=>`[a${index}]`).join('')}concat=n=${filmScripts.length}:v=0:a=1,apad[audio]`);
const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',original,...inputs,'-filter_complex',filters.join(';'),'-map','0:v:0','-map','[audio]','-c:v','copy','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',temporary],{stdio:'inherit'});
if(result.status!==0)throw new Error('Office film assembly failed');
await rename(temporary,video);
const timestamp=seconds=>{const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;};
let cursor=0;
const cues=filmScripts.map((part,index)=>{const start=cursor;cursor+=part.duration;const lines=part.text.match(/.{1,72}(?:\s|$)/g)?.map(line=>line.trim()).join('\n')??part.text;return `${index+1}\n${timestamp(start)} --> ${timestamp(cursor)}\n${lines}\n`;});
await writeFile(new URL('../dist/assets/video/office-tour.vtt',import.meta.url),`WEBVTT\n\nNOTE ElevenLabs narration of real QindaOffice footage.\n\n${cues.join('\n')}`);
process.stdout.write('Office film assembled with ElevenLabs narration and captions.\n');
