// SPDX-License-Identifier: LGPL-3.0-or-later
// AGENT-CONTRACT: engine.mjs and render.mjs consume these fictional document seeds.
// Action descriptors illustrate the proposed bridge, not an installed Office API.
export const scenarios = {
  calc: {
    title:'signal-garden-budget.xlsx — QindaCalc', noun:'budget', view:'Budget', target:'B5',
    prompt:'Try two lighting packages. Tell me if the budget still fits.',
    context:'Signal Garden · fictional event budget · $8,600 spending ceiling',
    welcome:'I can read the active Budget sheet, its formulas, and your selection. Run the scenario to try a change and see the recalculated result.',
    plan:'B5 holds the lighting quantity. I’ll change it from 1 to 2, then read the recalculated total and compare it with your $8,600 ceiling.',
    action:'calc.set_cells', args:{cells:{B5:'2'}},
    data:{lighting:1,ceiling:8600,revenue:10120},
    audio:'calc-result',
    actionDescription:'Set cell inputs on the active sheet. The application validates and recalculates before returning a result.',
  },
  write: {
    title:'signal-garden-brief.docx — QindaWrite', noun:'brief', view:'Decision for Friday', target:'paragraph:decision',
    prompt:'Add a Friday 4 pm approval deadline to this paragraph.',
    context:'Signal Garden · project brief · targeted text replacement',
    welcome:'I can read the selected paragraph. A precise replacement can preserve surrounding formatting; replacing a whole Markdown section has different fidelity limits.',
    plan:'I’ll insert the deadline into the existing approval sentence, using a targeted text replacement. The rest of the paragraph stays as it is.',
    action:'write.replace_text', args:{find:'before supplier deposits are sent',replace:'by Friday at 16:00, before supplier deposits are sent'},
    data:{body:'Confirm the accessible route and approve the weather cover before supplier deposits are sent.'},
    audio:'write-result',
    actionDescription:'Replace matching text in the current document. The application reports the number of replacements and an undo reference.',
  },
  show: {
    title:'signal-garden-pitch.fodp — QindaShow', noun:'presentation', view:'Slide 4 · The decision', target:'slide:decision:notes',
    prompt:'Add a reminder to ask for approval before sending supplier deposits.',
    context:'Signal Garden · slide 4 · speaker notes only',
    welcome:'I can read the selected slide and its speaker notes. Run this example to change the notes without changing the visible slide.',
    plan:'I’ll update the speaker notes on the selected decision slide. Its title, visible text, and layout will keep their current values.',
    action:'show.set_notes', args:{slide_id:'slide:decision',notes:'Ask for approval of the step-free route and covered power by Friday at 16:00. Confirm approval before any supplier deposits are sent.'},
    data:{notes:'Ask for approval of the step-free route and covered power.',title:'Build the route.\nBack the makers.'},
    audio:'show-result',
    actionDescription:'Set notes on a stable slide target. The bridge can map that target to the current suite operation, which uses snapshot slide numbers.',
  },
  note: {
    title:'signal-garden-walkthrough — QindaNote', noun:'notebook', view:'Courtyard walkthrough', target:'block:access',
    prompt:'Mark access verified, and add a reminder for the low-glare night test.',
    context:'Signal Garden · current page · two edits in one undo group',
    welcome:'I can read this page as addressable blocks. I’ll mark the access task complete and add the separate night-test reminder.',
    plan:'I’ll complete the access checklist block, then add an unchecked night-test task. These two document edits will share one undo step in this simulation.',
    action:'note.edit_blocks', args:{complete:'block:access',insert_after:'block:access',text:'Run the low-glare night test before Friday approval.'},
    data:{blocks:[{id:'block:context',kind:'text',text:'Friday is the go / no-go moment for supplier deposits.'},{id:'block:access',kind:'todo',text:'Verify the step-free route through the courtyard.',checked:false}]},
    audio:'note-result',
    actionDescription:'Complete a checklist block and insert a reminder. The adapter maps stable IDs to the suite’s existing block-edit operations.',
  },
};
export const costRows = [
  ['Lighting and power',1,2250],['Artist fees',4,650],['Access and wayfinding',1,850],
  ['Site and weather cover',1,900],['Print and promotion',1,600],['Volunteer meals',24,18],
];
export const journey = [
  {app:'QindaNote',title:'Capture what the meeting actually decided.',request:'“Separate decisions, tasks, and unanswered questions.”',body:'Live notes already combine transcription and structured model decisions. A future shared provider can expose the accepted note blocks and their provenance to other authorized clients.',items:['Decision: keep the step-free route','Task: verify covered power','Question: one or two lighting packages?'],handoff:'You review the notes before they become changes elsewhere.'},
  {app:'QindaWrite',title:'Turn a decision into a precise brief update.',request:'“Put the approval deadline into the brief.”',body:'The partner reads the current approval paragraph and proposes a targeted text replacement. It links the change to the meeting note and gives you a per-document undo.',items:['Source: accepted meeting decision','Target: approval paragraph','Edit: Friday, 16:00 deadline'],handoff:'A source note supplies evidence; the brief remains an ordinary editable document.'},
  {app:'QindaCalc',title:'Test the number before promising it.',request:'“What happens if we use two lighting packages?”',body:'The app recalculates the real formulas. The partner explains the $9,882 planned cost and the $1,282 ceiling overrun, then offers to restore the previous assumption.',items:['Quantity: 1 → 2','Planned cost: $7,632 → $9,882','Result: $1,282 over the ceiling'],handoff:'You decide whether to keep the scenario, undo it, or choose another assumption.'},
  {app:'QindaShow',title:'Bring the verified decision into the room.',request:'“Add the cost caveat and approval reminder to my notes.”',body:'The partner reads the chosen slide, updates its speaker notes, and cites the revised brief and budget. It reports each completed edit separately if part of the cross-app workflow fails.',items:['Source: brief + recalculated budget','Target: decision slide notes','Review: source links and edit summary'],handoff:'You own the presentation. Multi-document coordination is a future layer, not a current atomic guarantee.'},
];
export const nodes = {
  human:{title:'Native interface: your work stays visible',body:'You keep using normal document windows, selection, menus, keyboard shortcuts, and undo. The UI can display what the agent is reading and highlight edits as they happen. It should not become a separate AI-only document workspace.'},
  models:{title:'Clients: one partner, different entry points',body:'The embedded assistant can call the service directly. A shell agent can use a small JSON CLI. An MCP-compatible client can discover tools and resources through an adapter. Each client receives only the scope you grant it.'},
  host:{title:'Tk.AgentHost: the proposed shared contract',body:'Collect the current view, domain state, typed action descriptions, edit grants, and task events. Dispatch validated requests to existing application operations and return application-verified outcomes. This class name is a proposal; it does not exist in the reviewed toolkit.'},
  toolkit:{title:'Toolkit foundation: reuse what already exists',body:'QindaTK has accessible roles and custom semantic views, command metadata, document identity and revision machinery, selection, validation, transactions, and a scripting runtime. The service would unify and extend these pieces rather than start from a visual scene dump.'},
  office:{title:'Office adapters: preserve the current editing engines',body:'QindaOffice already knows how to snapshot and edit cells, text, slides, and note blocks. Adapt its per-window ActionModel and DocumentTools, retain its IDs and undo ownership, add formal schemas and richer workflow metadata, and expose the result to the shared host.'},
};
