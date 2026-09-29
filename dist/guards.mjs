// SPDX-License-Identifier: LGPL-3.0-or-later
import {createState,makeRequest,invoke,humanEdit,totals} from './engine.mjs';
import {esc} from './render.mjs';
export const challenges={
  stale:{title:'Your edit wins.',body:'The agent reads revision 12. While it plans, you change lighting to 3. Its old request asks to set B5 to 2 using revision 12.',initial:'Your quantity: 1 · revision 12',result:'Waiting for you to play the situation.'},
  readonly:{title:'A question is not permission to edit.',body:'The document is granted read-only access. The agent can inspect the budget, but an attempted cell edit must fail at the application boundary.',initial:'Grant: read-only · revision 12',result:'Waiting for you to play the situation.'},
  invalid:{title:'The app validates the value.',body:'The agent proposes −2 lighting packages. This contract requires a whole number from 1 to 10, so the application rejects the input before changing the document.',initial:'Proposed quantity: −2 · revision 12',result:'Waiting for you to play the situation.'},
  duplicate:{title:'One request. One edit.',body:'A client loses a reply and retries the same request ID. The application returns the original receipt instead of applying the edit or adding another undo step.',initial:'Request ID: lighting-42 · revision 12',result:'Waiting for you to play the situation.'},
};
export function runChallenge(kind) {
  const state=createState('calc');
  const request=makeRequest(state,'lighting-42');
  let receipt,detail;
  if(kind==='stale'){humanEdit(state,3);receipt=invoke(state,request);detail='Your quantity stays at 3. The stale request changes nothing. The partner must read the new revision before proposing another edit.';}
  else if(kind==='readonly'){state.grant='read';receipt=invoke(state,request);detail='Quantity stays at 1. Read access remains read access.';}
  else if(kind==='invalid'){request.args={cells:{B5:'-2'}};receipt=invoke(state,request);detail='Quantity stays at 1. The invalid input never becomes a document value.';}
  else if(kind==='duplicate'){invoke(state,request);receipt=invoke(state,request);detail=`Quantity is 2, revision is ${state.revision}, and there is exactly ${state.undo.length} undo step. The receipt is marked as a replay.`;}
  else throw new Error('Unknown challenge');
  return {state,receipt,detail};
}
export function setupGuards() {
  let selected='stale',played=false,running=false,version=0;
  const scene=document.getElementById('guard-scene');
  const run=document.getElementById('run-guard');
  function render(result=null) {
    const challenge=challenges[selected];
    const cost=result?totals(result.state).planned_cost:7632;
    const quantity=result?result.state.data.lighting:1;
    scene.innerHTML=`<div class="guard-visual"><span class="metric-label">Lighting quantity ${quantity} · planned cost</span><div class="metric">$${cost.toLocaleString('en-US')}</div><pre>${esc(result?JSON.stringify({status:result.receipt.status,revision:result.state.revision,quantity,undo_steps:result.state.undo.length,replayed:!!result.receipt.replayed},null,2):challenge.initial)}</pre></div><div class="guard-copy"><h3>${challenge.title}</h3><p>${challenge.body}</p><div class="guard-result ${result?.receipt.replayed?'success':''}">${esc(result?result.detail:running?'The agent reads the document…':challenge.result)}</div></div>`;
    run.disabled=running||played;run.textContent=running?'Checking…':played?'Situation complete':'Play this situation →';
  }
  for(const button of document.querySelectorAll('[data-guard]'))button.addEventListener('click',()=>{version++;selected=button.dataset.guard;played=false;running=false;for(const other of document.querySelectorAll('[data-guard]'))other.classList.toggle('selected',other===button);render();});
  run.addEventListener('click',async()=>{const token=++version;running=true;render();await new Promise(resolve=>setTimeout(resolve,900));if(token!==version)return;const result=runChallenge(selected);running=false;played=true;render(result);});
  document.getElementById('reset-guard').addEventListener('click',()=>{version++;played=false;running=false;render();});
  render();
}
