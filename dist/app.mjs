// SPDX-License-Identifier: LGPL-3.0-or-later
import {createState,snapshot,invoke,undo,makeRequest,outcome} from './engine.mjs';
import {scenarios,journey,nodes} from './scenarios.mjs';
import {renderLab,esc} from './render.mjs';
import {createNarrator} from './audio.mjs';
import {setupGuards} from './guards.mjs';
const $=id=>document.getElementById(id);
const narrator=createNarrator();
const states=new Map(Object.keys(scenarios).map(app=>[app,createState(app)]));
let state=states.get('calc'),mode='assistant',feed=[],step=-1,receipt=null,running=false,ran=false,runToken=0;
const histories=new Map();
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function render(){renderLab(state,{mode,feed,step,receipt,running,ran});}
function welcome(){feed=[{text:scenarios[state.app].welcome,terminal:`# ${state.id}\n# grant: ${state.grant} · revision: ${state.revision}\n# Proposed CLI session. Run to inspect and edit.`}];step=-1;receipt=null;ran=false;render();}
function saveHistory(){histories.set(state.app,{feed,step,receipt,ran});}
for(const button of document.querySelectorAll('[data-app]'))button.addEventListener('click',()=>{if(running)return;saveHistory();narrator.pause();state=states.get(button.dataset.app);const old=histories.get(state.app);if(old){({feed,step,receipt,ran}=old);render();}else welcome();});
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{mode=button.dataset.mode;render();});
$('allow-edits').addEventListener('change',event=>{state.grant=event.target.checked?'edit':'read';render();});
$('run-scenario').addEventListener('click',async()=>{
  if(running||ran)return;
  const token=++runToken;running=true;step=0;feed=[];receipt=null;
  const view=snapshot(state),request=makeRequest(state,`demo-${state.app}-${Date.now()}`);
  feed.push({type:'system',text:`Read ${view.active_view}, ${view.selection}, revision ${view.revision}.`,terminal:`$ qinda-agent inspect --document ${state.id}\n  view: ${view.active_view}\n  revision: ${view.revision} · grant: ${view.grant}`});render();
  await pause(800);if(token!==runToken)return;
  step=1;feed.push({text:scenarios[state.app].plan,terminal:`# Plan: ${scenarios[state.app].plan}`});render();
  await pause(1000);if(token!==runToken)return;
  step=2;feed.push({type:'system',text:'The application checks the grant, target, revision, and input before applying the request.',terminal:`$ qinda-agent invoke --document ${state.id}\n  action: ${request.action}\n  args: ${JSON.stringify(request.args)}\n  if_revision: ${request.if_revision}`});render();
  await pause(750);if(token!==runToken)return;
  receipt=invoke(state,request);render();
  await pause(650);if(token!==runToken)return;
  step=4;running=false;ran=receipt.status==='completed';
  feed.push({type:receipt.status==='completed'?'result':'error',text:outcome(state,receipt),terminal:receipt.status==='completed'?`✓ ${receipt.status} · revision ${receipt.revision}\n${outcome(state,receipt)}`:`✕ ${receipt.status}\n${receipt.message}`});render();saveHistory();
});
$('undo-scenario').addEventListener('click',()=>{if(running)return;narrator.pause();receipt=undo(state);step=-1;ran=false;feed=[{type:'system',text:'The document’s previous state has been restored. Undo advances the revision, so an old request still cannot silently apply.',terminal:`$ qinda-agent undo --document ${state.id}\n✓ ${receipt.status} · revision ${state.revision}`}];render();saveHistory();});
$('reset-scenario').addEventListener('click',()=>{runToken++;running=false;narrator.pause();const app=state.app;state=createState(app);states.set(app,state);histories.delete(app);welcome();});
$('speak-result').addEventListener('click',()=>{if(receipt?.status==='completed')narrator.outcome(scenarios[state.app].audio,outcome(state,receipt));});
let activeChapter='try';
function selectChapter(id,{audio=true}={}){activeChapter=id;for(const link of document.querySelectorAll('[data-chapter]')){const active=link.dataset.chapter===id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}if(audio)narrator.select(id);}
for(const link of document.querySelectorAll('[data-chapter]'))link.addEventListener('click',()=>selectChapter(link.dataset.chapter));
if('IntersectionObserver' in window){
  const visible=new Map();
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)visible.set(entry.target.dataset.section,entry.isIntersecting);const id=[...document.querySelectorAll('[data-section]')].filter(element=>visible.get(element.dataset.section)).sort((a,b)=>Math.abs(a.getBoundingClientRect().top-140)-Math.abs(b.getBoundingClientRect().top-140))[0]?.dataset.section;if(id&&id!==activeChapter)selectChapter(id,{audio:!narrator.isPlaying()});},{rootMargin:'-100px 0px -55% 0px'});
  document.querySelectorAll('[data-section]').forEach(section=>observer.observe(section));
}
for(const button of document.querySelectorAll('[data-shot]'))button.addEventListener('click',()=>{const app=button.dataset.shot;for(const other of document.querySelectorAll('[data-shot]')){other.setAttribute('aria-selected',String(other===button));other.tabIndex=other===button?0:-1;}const name=`Qinda${app[0].toUpperCase()+app.slice(1)}`;$('real-shot').src=`assets/images/office-${app}.webp`;$('real-shot').alt=`Real ${name} window displaying the fictional Signal Garden sample`;$('shot-caption').textContent=`Real installed ${name}, captured with the public Signal Garden sample. This is existing application UI, not a mockup of the proposed bridge.`;});
let journeyIndex=0;
function renderJourney(){const part=journey[journeyIndex];for(const button of document.querySelectorAll('[data-journey]')){const active=Number(button.dataset.journey)===journeyIndex;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}$('journey-content').innerHTML=`<div><p class="eyebrow">${part.app} · HUMAN VIEW</p><h3>${part.title}</h3><p>${part.body}</p><p class="small-copy">${part.handoff}</p></div><div class="journey-art"><span>Your request</span><p>${part.request}</p><ul>${part.items.map(item=>`<li><b>→</b>${esc(item)}</li>`).join('')}</ul></div>`;$('journey-next').textContent=journeyIndex===3?'Start the day again ↻':'Next handoff →';}
for(const button of document.querySelectorAll('[data-journey]'))button.addEventListener('click',()=>{journeyIndex=Number(button.dataset.journey);renderJourney();});
$('journey-next').addEventListener('click',()=>{journeyIndex=(journeyIndex+1)%journey.length;renderJourney();});
function selectNode(id){const node=nodes[id];for(const button of document.querySelectorAll('[data-node]')){const active=button.dataset.node===id;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));}$('node-description').innerHTML=`<h3>${node.title}</h3><p>${node.body}</p>`;}
for(const button of document.querySelectorAll('[data-node]'))button.addEventListener('click',()=>selectNode(button.dataset.node));
// Arrow-key movement follows the active tab, while plain buttons remain operable.
for(const list of document.querySelectorAll('[role=tablist]'))list.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const tabs=[...list.querySelectorAll('[role=tab]')];const current=tabs.indexOf(document.activeElement);if(current<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;if(!tabs[next].disabled){tabs[next].focus();tabs[next].click();}});
let toastTimer;
window.addEventListener('guide-notice',event=>{clearTimeout(toastTimer);$('toast').textContent=event.detail;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,6000);});
const hash=location.hash.slice(1);if(document.querySelector(`[data-section="${CSS.escape(hash)}"]`))selectChapter(hash);
welcome();renderJourney();selectNode('host');setupGuards();
