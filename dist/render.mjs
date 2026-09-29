// SPDX-License-Identifier: LGPL-3.0-or-later
import {costRows,scenarios} from './scenarios.mjs';
import {snapshot,totals} from './engine.mjs';
export const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n.toLocaleString('en-US',{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
export function renderOffice(state) {
  const app=state.app;
  if(app==='calc'){
    const t=totals(state);
    return `<div class="calc-ribbon"><span class="active">Home</span><span>Insert</span><span>Data</span><span>Sheet</span><span>AI</span></div><div class="formula-bar"><strong>B5</strong><span>ƒx</span><span>${state.data.lighting}</span></div><table class="budget-table"><thead><tr><th>Cost line</th><th>Qty</th><th>Unit $</th><th>Plan $</th></tr></thead><tbody>${costRows.map(([name,q,u],i)=>{const quantity=i===0?state.data.lighting:q;return `<tr><td>${name}</td><td class="${i===0?'selected-cell '+(state.lastChanged.length?'changed':''):''}">${quantity}</td><td>${money(u)}</td><td>${money(quantity*u)}</td></tr>`}).join('')}<tr class="total"><td>TOTAL COST</td><td></td><td></td><td>${money(t.planned_cost)}</td></tr></tbody></table><div class="budget-metrics"><div><span>Planned cost</span><b>$${money(t.planned_cost)}</b><small>Ceiling $8,600</small></div><div class="${t.over_ceiling?'over':''}"><span>${t.over_ceiling?'Over the ceiling':'Within the ceiling'}</span><b>$${money(t.over_ceiling||t.ceiling-t.planned_cost)}</b><small>${t.over_ceiling?'Needs a decision':'Headroom'}</small></div><div><span>Project balance</span><b>$${money(t.balance)}</b><small>Revenue $10,120</small></div></div><div class="sheet-tabs"><span class="active">Budget</span><span>Attendance</span></div>`;
  }
  if(app==='write'){
    let body=esc(state.data.body);
    if(state.lastChanged.length)body=body.replace('by Friday at 16:00','<span class="changed-text">by Friday at 16:00</span>');
    return `<div class="write-ribbon"><span>Home</span><span>Insert</span><span>Layout</span><span>Review</span><span>AI</span></div><div class="write-page"><span class="doc-kicker">SIGNAL GARDEN / PROJECT BRIEF</span><h3>One evening.<br>A shared courtyard.</h3><p>A light trail, local makers, and a welcoming route for 320 guests.</p><h4>Decision for Friday</h4><p>${body}</p><div class="doc-footer">Selected approval paragraph · fictional example</div></div>`;
  }
  if(app==='show')return `<div class="show-ribbon"><span>Home</span><span>Insert</span><span>Slide</span><span>Present</span><span>AI</span></div><div class="show-layout"><div class="slide-thumbs">${[1,2,3,4].map(n=>`<div class="slide-thumb ${n===4?'selected':''}">${n}</div>`).join('')}</div><div class="slide-stage"><div class="presentation-slide"><span>SIGNAL GARDEN / THE DECISION</span><h3>${esc(state.data.title).replace('\n','<br>')}</h3><p>Approve access and weather cover this Friday.</p></div><div class="speaker-notes ${state.lastChanged.length?'changed':''}"><span>SPEAKER NOTES</span><p>${esc(state.data.notes)}</p></div></div></div>`;
  return `<div class="note-ribbon"><span>Notebook</span><span>Page</span><span>Insert</span><span>AI</span></div><div class="note-layout"><div class="note-pages"><span>Signal Garden</span><span class="active">Walkthrough</span><span>Decisions</span><span>References</span></div><div class="note-page"><h3>Courtyard<br>walkthrough</h3>${state.data.blocks.map(block=>`<div class="note-block ${block.checked?'checked':''} ${state.lastChanged.includes(block.id)?'changed':''}">${block.kind==='todo'?'<span class="check" aria-hidden="true"></span>':''}${esc(block.text)}</div>`).join('')}<p class="note-hint">Current page · blocks with stable simulated IDs</p></div></div>`;
}
export function renderLab(state,{receipt=null,step=-1,mode='assistant',feed=[],running=false,ran=false}={}) {
  const scenario=scenarios[state.app];
  $('office-view').innerHTML=renderOffice(state);
  $('window-title').textContent=scenario.title;
  $('task-prompt').textContent=scenario.prompt;
  $('task-context').textContent=scenario.context;
  $('selection-status').textContent=`${scenario.view} · ${state.selection}`;
  $('document-revision').textContent=`Revision ${state.revision}`;
  $('snapshot-view').textContent=JSON.stringify(snapshot(state),null,2);
  $('receipt-view').textContent=receipt?JSON.stringify(receipt,null,2):'Run the scenario to see an application-verified receipt.';
  $('partner-title').textContent=mode==='terminal'?'External agent session':'Your AI partner';
  $('partner-subtitle').textContent=mode==='terminal'?'Proposed CLI · same document state':'Connected to this document · simulation';
  $('partner-feed').innerHTML=feed.map(item=>mode==='terminal'?`<div class="terminal-feed"><p class="${item.type==='error'?'warning':item.type==='command'?'cmd':'output'}">${esc(item.terminal??item.text)}</p></div>`:`<div class="feed-message ${item.type==='error'?'error':item.type==='system'?'system':''}"><span>${item.label??(item.type==='system'?'Application':'Partner')}</span><p>${esc(item.text)}</p></div>`).join('');
  $('partner-feed').scrollTop=$('partner-feed').scrollHeight;
  $('step-track').innerHTML=['Read','Plan','Apply','Report'].map((name,i)=>`<span class="${i<step?'done':i===step?'current':''}">${name}</span>`).join('');
  $('run-scenario').disabled=running||ran;
  $('run-scenario').textContent=running?'Working…':ran?'Scenario complete':'Run this scenario →';
  $('undo-scenario').disabled=running||!state.undo.length||state.grant!=='edit';
  $('speak-result').disabled=running||receipt?.status!=='completed'||receipt?.status==='undone';
  $('allow-edits').checked=state.grant==='edit';
  $('allow-edits').disabled=running;
  for(const btn of document.querySelectorAll('[data-app]')){btn.setAttribute('aria-selected',String(btn.dataset.app===state.app));btn.disabled=running;btn.tabIndex=btn.dataset.app===state.app?0:-1;}
  for(const btn of document.querySelectorAll('[data-mode]'))btn.setAttribute('aria-pressed',String(btn.dataset.mode===mode));
}
