// SPDX-License-Identifier: LGPL-3.0-or-later
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createState,snapshot,totals,makeRequest,invoke,undo,humanEdit} from '../dist/engine.mjs';
import {scenarios} from '../dist/scenarios.mjs';
import {narration,outcomeScripts,filmScripts} from '../dist/narration.mjs';
import {runChallenge} from '../dist/guards.mjs';
let checks=0;
const test=(name,work)=>{work();checks++;process.stdout.write(`PASS ${name}\n`);};
test('Budget recalculates from the fictional source assumptions',()=>{const s=createState();assert.equal(totals(s).planned_cost,7632);const r=invoke(s,makeRequest(s));assert.equal(r.status,'completed');assert.deepEqual(r.result,{planned_cost:9882,revenue:10120,balance:238,ceiling:8600,over_ceiling:1282});assert.equal(snapshot(s).domain.cells.D11.value,9882);});
test('Undo restores content and advances the revision',()=>{const s=createState();invoke(s,makeRequest(s));const r=undo(s);assert.equal(r.status,'undone');assert.equal(s.data.lighting,1);assert.equal(totals(s).balance,2488);assert.equal(s.revision,14);});
test('A concurrent human edit is preserved',()=>{const s=createState();const request=makeRequest(s);humanEdit(s,3);const r=invoke(s,request);assert.equal(r.status,'stale_revision');assert.equal(s.data.lighting,3);assert.equal(s.undo.length,1);});
test('Read grants and document scope are enforced',()=>{const s=createState();s.grant='read';assert.equal(invoke(s,makeRequest(s)).status,'read_only');assert.equal(s.revision,12);assert.equal(s.undo.length,0);const t=createState();assert.equal(invoke(t,makeRequest(t,'wrong',{document_id:'other-document'})).status,'wrong_document');assert.equal(t.data.lighting,1);});
test('Invalid quantities never enter the document',()=>{for(const input of ['-2','0','2.5','11','oops','']){const s=createState();assert.equal(invoke(s,makeRequest(s,'bad',{args:{cells:{B5:input}}})).status,'validation_failed');assert.equal(s.data.lighting,1);assert.equal(s.undo.length,0);}});
test('A retry yields one edit and one receipt',()=>{const s=createState();const req=makeRequest(s,'same-request');const first=invoke(s,req);const second=invoke(s,req);assert.equal(second.replayed,true);assert.equal(second.revision,first.revision);assert.equal(s.undo.length,1);assert.equal(s.revision,13);const conflict=structuredClone(req);conflict.args.cells.B5='3';assert.equal(invoke(s,conflict).status,'id_conflict');assert.equal(s.data.lighting,2);});
test('A replay after undo does not silently reapply the edit',()=>{const s=createState();const req=makeRequest(s,'replay-after-undo');invoke(s,req);undo(s);const r=invoke(s,req);assert.equal(r.replayed,true);assert.equal(s.data.lighting,1);assert.equal(s.revision,14);});
test('Write changes only the requested text and can undo',()=>{const s=createState('write');const original=s.data.body;const r=invoke(s,makeRequest(s));assert.equal(r.result.replacements,1);assert.match(s.data.body,/by Friday at 16:00/);undo(s);assert.equal(s.data.body,original);});
test('Show changes speaker notes and keeps the visible title',()=>{const s=createState('show');const title=s.data.title;const original=s.data.notes;invoke(s,makeRequest(s));assert.equal(s.data.title,title);assert.match(s.data.notes,/supplier deposits/);undo(s);assert.equal(s.data.notes,original);});
test('Note groups two document changes into one undo',()=>{const s=createState('note');invoke(s,makeRequest(s));assert.equal(s.data.blocks.length,3);assert.equal(s.data.blocks[1].checked,true);assert.equal(s.data.blocks[2].checked,false);assert.equal(s.undo.length,1);undo(s);assert.equal(s.data.blocks.length,2);assert.equal(s.data.blocks[1].checked,false);});
test('Every interactive challenge produces its promised result',()=>{assert.equal(runChallenge('stale').receipt.status,'stale_revision');assert.equal(runChallenge('readonly').receipt.status,'read_only');assert.equal(runChallenge('invalid').receipt.status,'validation_failed');assert.equal(runChallenge('duplicate').receipt.replayed,true);});
const root=new URL('../dist/',import.meta.url);
const html=await readFile(new URL('index.html',root),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const target=match[1];if(/^(https?:|mailto:)/.test(target))continue;assert.ok((await stat(new URL(target,root))).size>0,`Missing static asset ${target}`);}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length,'HTML IDs must be unique');
for(const file of await readdir(root)){if(!file.endsWith('.mjs'))continue;const text=await readFile(new URL(file,root),'utf8');const result=spawnSync('node',['--check',fileURLToPath(new URL(file,root))],{encoding:'utf8'});assert.equal(result.status,0,`${file}: ${result.stderr}`);for(const match of text.matchAll(/(?:\$\(|getElementById\()'([^']+)'/g))assert.ok(ids.includes(match[1]),`Missing HTML target ${match[1]} in ${file}`);}
for(const id of [...Object.keys(narration),...Object.keys(outcomeScripts),...filmScripts.map(p=>p.id)]){const path=fileURLToPath(new URL(`assets/audio/${id}.mp3`,root));const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',path],{encoding:'utf8'});assert.equal(probe.status,0,`Invalid recording ${id}`);assert.ok(Number(JSON.parse(probe.stdout).format.duration)>1);}
for(const part of filmScripts){const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',fileURLToPath(new URL(`assets/audio/${part.id}.mp3`,root))],{encoding:'utf8'});assert.ok(Number(JSON.parse(probe.stdout).format.duration)<=part.duration,`${part.id} narration exceeds its film segment`);}
const videoProbe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','json',fileURLToPath(new URL('assets/video/office-tour.mp4',root))],{encoding:'utf8'});assert.equal(videoProbe.status,0);const streams=JSON.parse(videoProbe.stdout).streams;assert.ok(streams.some(s=>s.codec_type==='video'));assert.ok(streams.some(s=>s.codec_type==='audio'),'Office film must have narration');
for(const app of Object.keys(scenarios))assert.ok(html.includes(`data-app="${app}"`));
for(const id of Object.keys(narration))assert.ok(html.includes(`id="${id}"`));
process.stdout.write(`Passed ${checks} behavior checks, static references, DOM targets, JS syntax, 17 recordings, and narrated film.\n`);
