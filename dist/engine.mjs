// SPDX-License-Identifier: LGPL-3.0-or-later
import {scenarios,costRows} from './scenarios.mjs';
// AGENT-GUARD: This is a local teaching simulation. Do not add live app calls here.
const copy = value => structuredClone(value);
export function createState(app='calc') {
  if(!scenarios[app]) throw new Error('Unknown application');
  return {app,id:`signal-garden-${app}`,revision:12,selection:scenarios[app].target,
    grant:'edit',data:copy(scenarios[app].data),undo:[],receipts:new Map(),audit:[],lastChanged:[]};
}
export function totals(state) {
  const planned=costRows.reduce((sum,[,quantity,unit],index)=>sum+(index===0?state.data.lighting:quantity)*unit,0);
  return {planned_cost:planned,revenue:state.data.revenue,balance:state.data.revenue-planned,
    ceiling:state.data.ceiling,over_ceiling:Math.max(0,planned-state.data.ceiling)};
}
export function snapshot(state) {
  const common={document_id:state.id,window_id:`window:${state.app}`,revision:state.revision,
    active_view:scenarios[state.app].view,selection:state.selection,grant:state.grant,
    workflow:{focus:'document',modal:null,filter:null,draft:null,validation_errors:[]}};
  let domain;
  if(state.app==='calc')domain={active_sheet:'Budget',cells:{B5:{input:String(state.data.lighting),value:state.data.lighting,unit:'packages'},D5:{input:'=B5*C5',value:state.data.lighting*2250,unit:'USD'},D11:{input:'=SUM(D5:D10)',value:totals(state).planned_cost,unit:'USD'}},summary:totals(state)};
  if(state.app==='write')domain={paragraphs:[{id:'paragraph:decision',heading:'Decision for Friday',text:state.data.body}],selection_text:state.data.body};
  if(state.app==='show')domain={slide_id:'slide:decision',snapshot_number:4,title:state.data.title,speaker_notes:state.data.notes};
  if(state.app==='note')domain={page_id:'page:walkthrough',blocks:copy(state.data.blocks)};
  return {...common,domain,actions:[{id:scenarios[state.app].action,enabled:state.grant==='edit',disabled_reason:state.grant==='edit'?null:'Document grant is read-only',input_example:copy(scenarios[state.app].args)}, {id:'document.undo',enabled:state.grant==='edit'&&state.undo.length>0}]};
}
function fail(state,request,status,message) {
  const receipt={request_id:request.id,status,document_id:state.id,revision:state.revision,changed:[],message};
  state.receipts.set(request.id,{fingerprint:JSON.stringify(request),receipt:copy(receipt)});
  state.audit.push({actor:'agent',status,revision:state.revision,message});
  return receipt;
}
export function invoke(state,request) {
  if(!request?.id||typeof request.id!=='string')return {status:'invalid_request',message:'A request ID is required.',changed:[]};
  const existing=state.receipts.get(request.id);
  if(existing){
    if(existing.fingerprint!==JSON.stringify(request))return {request_id:request.id,status:'id_conflict',revision:state.revision,changed:[],message:'The request ID was already used with different inputs.'};
    return {...copy(existing.receipt),replayed:true};
  }
  if(request.document_id!==state.id)return fail(state,request,'wrong_document','The request does not target the granted document.');
  if(state.grant!=='edit')return fail(state,request,'read_only','You granted read access. The document was not changed.');
  if(request.if_revision!==state.revision)return fail(state,request,'stale_revision','The document changed after the agent read it. Refresh the snapshot and review the new state.');
  if(request.action!==scenarios[state.app].action)return fail(state,request,'unknown_action','This operation is not available on this document.');
  const args=request.args??{};
  const next=copy(state.data);
  let changed=[],message='';
  if(state.app==='calc'){
    const cells=args.cells;
    if(!cells||Object.keys(cells).length!==1||!Object.hasOwn(cells,'B5'))return fail(state,request,'invalid_target','This scenario exposes only the lighting quantity cell B5.');
    const raw=String(cells.B5).trim();
    const quantity=Number(raw);
    if(!raw||!Number.isInteger(quantity)||quantity<1||quantity>10)return fail(state,request,'validation_failed','Lighting quantity must be a whole number from 1 to 10. The document was not changed.');
    next.lighting=quantity;changed=['Budget!B5'];message='Cell input accepted; dependent formulas recalculated.';
  }
  if(state.app==='write'){
    if(typeof args.find!=='string'||!args.find||typeof args.replace!=='string')return fail(state,request,'validation_failed','A nonempty search text and replacement are required.');
    if(!next.body.includes(args.find))return fail(state,request,'target_not_found','The requested text is not in the current paragraph.');
    next.body=next.body.replace(args.find,args.replace);changed=['paragraph:decision'];message='One targeted text replacement applied.';
  }
  if(state.app==='show'){
    if(args.slide_id!=='slide:decision')return fail(state,request,'target_not_found','This slide is not in the granted view.');
    if(typeof args.notes!=='string'||args.notes.length>2000)return fail(state,request,'validation_failed','Speaker notes must be text of at most 2,000 characters.');
    next.notes=args.notes;changed=['slide:decision:notes'];message='Speaker notes updated.';
  }
  if(state.app==='note'){
    const target=next.blocks.find(block=>block.id===args.complete);
    if(!target||target.kind!=='todo'||args.insert_after!==target.id)return fail(state,request,'target_not_found','The requested checklist block is not in the current page.');
    if(typeof args.text!=='string'||!args.text.trim())return fail(state,request,'validation_failed','The reminder needs nonempty text.');
    target.checked=true;
    const index=next.blocks.indexOf(target)+1;
    next.blocks.splice(index,0,{id:`block:night:${state.revision+1}`,kind:'todo',checked:false,text:args.text});
    changed=[target.id,next.blocks[index].id];message='Checklist completed and reminder inserted in one document undo group.';
  }
  state.undo.push({data:copy(state.data),selection:state.selection,request_id:request.id});
  state.data=next;state.revision++;state.lastChanged=changed;
  const receipt={request_id:request.id,status:'completed',document_id:state.id,revision:state.revision,
    changed,message,undo_ref:`undo:${state.id}:${request.id}`,
    result:state.app==='calc'?totals(state):state.app==='write'?{replacements:1,text:state.data.body}:state.app==='show'?{slide_id:'slide:decision',notes:state.data.notes}:{blocks:copy(state.data.blocks)}};
  state.receipts.set(request.id,{fingerprint:JSON.stringify(request),receipt:copy(receipt)});
  state.audit.push({actor:'agent',status:'completed',revision:state.revision,changed});
  return receipt;
}
export function undo(state) {
  if(state.grant!=='edit')return {status:'read_only',message:'Edit access is required to undo.'};
  const previous=state.undo.pop();
  if(!previous)return {status:'nothing_to_undo',message:'There is no document edit to undo.'};
  state.data=previous.data;state.selection=previous.selection;state.revision++;state.lastChanged=[];
  state.audit.push({actor:'human',status:'undone',revision:state.revision,request_id:previous.request_id});
  return {status:'undone',revision:state.revision,undid_request:previous.request_id,result:state.app==='calc'?totals(state):copy(state.data)};
}
export function humanEdit(state,quantity) {
  if(state.app!=='calc'||!Number.isInteger(quantity)||quantity<1||quantity>10)throw new Error('Invalid human example edit');
  state.undo.push({data:copy(state.data),selection:state.selection,request_id:'human-edit'});
  state.data.lighting=quantity;state.revision++;state.lastChanged=['Budget!B5'];
  state.audit.push({actor:'human',status:'edited',revision:state.revision});
}
export function makeRequest(state,id=`demo-${state.app}-${state.revision}`,overrides={}) {
  return {id,document_id:state.id,if_revision:state.revision,action:scenarios[state.app].action,args:copy(scenarios[state.app].args),...overrides};
}
export function outcome(state,receipt) {
  if(receipt.status!=='completed')return receipt.message;
  if(state.app==='calc'){
    const t=receipt.result;
    return `Done. Planned cost is $${t.planned_cost.toLocaleString('en-US')}${t.over_ceiling?`—$${t.over_ceiling.toLocaleString('en-US')} above your ceiling`:', within your ceiling'}. The project balance is $${t.balance.toLocaleString('en-US')}. I changed B5; you can undo that edit.`;
  }
  if(state.app==='write')return 'Done. The approval paragraph now says “by Friday at 16:00.” One targeted text replacement was applied, with one undo step.';
  if(state.app==='show')return 'Done. The decision slide’s speaker notes now include the approval deadline and the reminder about supplier deposits. The visible slide keeps its existing content.';
  return 'Done. The access checklist is complete, and the low-glare night test is a new unchecked task. Both changes share one document undo step in this simulation.';
}
